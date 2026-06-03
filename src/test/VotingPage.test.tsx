// PAGE TEST for VotingPage — the voter's "cast your vote" screen.
//
// What this page does (the parts we care about):
//   - Shows a title/subtitle and a "Voting Rights" info box.
//   - Lists the ward's aspirants (cards with name + Vote / View Details buttons).
//   - Clicking "View Details" navigates to /aspirants/:id.
//
// Setup notes:
//   - We force the app's MOCK mode (isMockMode = true) by mocking ../config/appMode.
//     In mock mode the page renders three built-in dummy aspirants SYNCHRONOUSLY
//     (Rajesh Kumar, Priya Sharma, Suresh Reddy) with no network fetch — this
//     keeps the test deterministic instead of fighting async fetch timing.
//   - Every service is still mocked so the on-mount fetchVotingWindow call (which
//     fires even in mock mode) never hits a backend.
//   - react-i18next is mocked; many strings use `t('...') || 'English'`. Since
//     our t() returns the KEY (truthy), the || fallback never fires — so we
//     assert on the KEY strings.
//   - useNavigate is spied on; the rest of react-router-dom stays real.
//   - The auth store is seeded with a voter who has a ward.

import { renderWithProviders, screen, fireEvent } from './test-utils';
import VotingPage from '../pages/VotingPage';
import useAuthStore from '../store/useAuthStore';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string, o?: any) => (o && o.defaultValue ? o.defaultValue : k),
    i18n: { language: 'en', changeLanguage: () => Promise.resolve() },
  }),
  Trans: ({ children }: any) => children,
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

// Force mock mode so the page uses its synchronous dummy aspirant list.
vi.mock('../config/appMode', () => ({ isMockMode: true, APP_MODE: 'mock' }));

const navigate = vi.fn();
vi.mock('react-router-dom', async (orig) => ({
  ...(await orig() as any),
  useNavigate: () => navigate,
}));

// voteService — on-mount fetchVotingWindow still fires in mock mode; resolve it.
vi.mock('../services/voteService', () => ({
  fetchVotingWindow: vi.fn(() => Promise.resolve({ data: { isVotingAllowed: false } })),
  fetchMyVote: vi.fn(() => Promise.resolve({ data: {} })),
  fetchWardResults: vi.fn(() => Promise.resolve({ data: [] })),
  submitVote: vi.fn(() => Promise.resolve({ data: {} })),
}));

// aspirantService — not used in mock mode, but mocked so it can never hit the
// network if the mode ever flips.
vi.mock('../services/aspirantService', () => ({
  fetchWardAspirantsByNumber: vi.fn(() => Promise.resolve({ data: [] })),
}));

describe('VotingPage', () => {
  beforeEach(() => {
    // Seed a voter with a ward + at least one interaction flag so canVote is true.
    useAuthStore.setState({
      token: 't',
      user: {
        id: 1,
        name: 'Asha',
        role: 'voter',
        wardId: 1,
        wardNumber: '12',
        wardName: 'North',
        isChat: true,
      } as any,
      isAuthenticated: true,
    } as any);
  });

  it('renders the page title and subtitle', () => {
    renderWithProviders(<VotingPage />);
    expect(screen.getByText('pages.voting.title')).toBeInTheDocument();
    expect(screen.getByText('pages.voting.subtitle')).toBeInTheDocument();
  });

  it('shows the "Voting Rights" restrictions box', () => {
    renderWithProviders(<VotingPage />);
    // restrictionsTitle uses a defaultValue, which our t() mock returns.
    expect(screen.getByText('Voting Rights')).toBeInTheDocument();
  });

  it('renders the ward number from the auth store', () => {
    renderWithProviders(<VotingPage />);
    // wardNumber '12' is shown in the ward info card.
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('lists the (mock-mode) aspirants by name', () => {
    renderWithProviders(<VotingPage />);
    // In mock mode the three dummy aspirants render synchronously.
    expect(screen.getByText('Rajesh Kumar')).toBeInTheDocument();
    expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    expect(screen.getByText('Suresh Reddy')).toBeInTheDocument();
  });

  it('navigates to the aspirant details page from "View Details"', () => {
    renderWithProviders(<VotingPage />);
    // Each aspirant card has a "View Details" button; click the first one.
    const buttons = screen.getAllByRole('button', { name: 'pages.voting.viewDetails' });
    fireEvent.click(buttons[0]);
    // First dummy aspirant has id 1.
    expect(navigate).toHaveBeenCalledWith('/aspirants/1');
  });
});
