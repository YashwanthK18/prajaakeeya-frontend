// PAGE TEST for CandidateDetailsPage — the public profile a voter sees for one
// aspirant/candidate (read via the :id route param).
//
// What this page does (the parts we test):
//   - On mount it reads params.id, calls getAspirantById(id), maps the response
//     into a `candidate` object, and renders a profile (name, age, gender,
//     education, occupation, etc.). While the first fetch is pending it shows a
//     loading state (t('common.loading')).
//   - It also fetches ward aspirants + visits + "my ward meetings" via apiClient.
//   - PhoneRevealCard (a child) shows a masked phone with a reveal toggle.
//
// Setup notes:
//   - react-i18next mocked: t() returns the KEY (or defaultValue). We assert on
//     the KEY strings (e.g. 'pages.candidateDetails.tabs.profile') or on the
//     hard-coded candidate data we feed the mock (e.g. the name 'Asha Rao').
//   - useParams() -> { id: '1' } so the page fetches aspirant #1. useNavigate is
//     spied; useLocation stays real (no nav state -> page uses API data).
//   - aspirantService / aspirantChatService and the apiClient default export are
//     all mocked so nothing hits the network.

import { renderWithProviders, screen, fireEvent } from './test-utils';
import CandidateDetailsPage from '../pages/CandidateDetailsPage';
import useAuthStore from '../store/useAuthStore';

// --- i18n: stable module-level refs so effects don't loop. t() echoes the key. ---
const t = (k: string, o?: any) => (o && o.defaultValue ? o.defaultValue : k);
const i18n = { language: 'en', changeLanguage: () => Promise.resolve(), t };
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t, i18n }),
  Trans: ({ children }: any) => children,
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

// --- Router: spy useNavigate, force the :id param to '1', keep the rest real. ---
const navigate = vi.fn();
vi.mock('react-router-dom', async (orig) => ({
  ...((await orig()) as any),
  useNavigate: () => navigate,
  useParams: () => ({ id: '1' }),
}));

// --- aspirantService: getAspirantById returns a fully-populated aspirant so the
// profile renders. The page reads resp.data directly. Other fns no-op. ---
const aspirant: any = {
  id: 1,
  name: 'Asha Rao',
  party: 'Independent',
  status: 'approved',
  age: 42,
  gender: 'Female',
  education: 'M.A. Political Science',
  occupation: 'Social Worker',
  address: '12 Main Road, North Ward',
  manifesto: 'Clean water for every household.',
  phone: '9876543210',
  ward: { number: '12', name: 'North Ward', assembly: 'North' },
  meetings: [],
  electionName: 'Municipal 2026',
  constituencyName: 'North',
};
vi.mock('../services/aspirantService', () => ({
  getAspirantById: vi.fn(() => Promise.resolve({ data: aspirant })),
  fetchWardAspirantsByNumber: vi.fn(() => Promise.resolve({ data: [] })),
  getAspirantVisits: vi.fn(() => Promise.resolve({ data: [] })),
  bookAspirant: vi.fn(() => Promise.resolve({ data: {} })),
  respondVisit: vi.fn(() => Promise.resolve({ data: {} })),
}));

// --- aspirantChatService: imported by the page; never exercised here. ---
vi.mock('../services/aspirantChatService', () => ({
  getAspirantMessages: vi.fn(() => Promise.resolve({ data: [] })),
  postUserChatMessage: vi.fn(() => Promise.resolve({ data: {} })),
}));

// --- apiClient default export — used for /aspirant-ward-meetings/my + tracking. ---
vi.mock('../services/apiClient', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: [] })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
    patch: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

describe('CandidateDetailsPage', () => {
  beforeEach(() => {
    // Seed a logged-in voter (the page reads user from the auth store).
    useAuthStore.setState({
      token: 't',
      user: { id: 5, name: 'Voter', role: 'voter', wardId: 1 } as any,
      isAuthenticated: true,
    } as any);
  });

  it('renders the candidate name after the aspirant loads', async () => {
    renderWithProviders(<CandidateDetailsPage />);
    // Name comes from the mocked getAspirantById response; it appears in the
    // header and the "Full Name" tile, so use findAllByText.
    const names = await screen.findAllByText('Asha Rao');
    expect(names.length).toBeGreaterThan(0);
  });

  it('renders the profile section heading (i18n key)', async () => {
    renderWithProviders(<CandidateDetailsPage />);
    expect(
      await screen.findByText('pages.candidateDetails.tabs.profile'),
    ).toBeInTheDocument();
  });

  it('renders the About section with the aspirant manifesto', async () => {
    renderWithProviders(<CandidateDetailsPage />);
    expect(await screen.findByText('pages.candidateDetails.labels.about')).toBeInTheDocument();
    expect(screen.getByText('Clean water for every household.')).toBeInTheDocument();
  });

  it('shows personal detail values mapped from the API', async () => {
    renderWithProviders(<CandidateDetailsPage />);
    // Wait for load, then assert a couple of mapped field values render.
    await screen.findByText('pages.candidateDetails.tabs.profile');
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Social Worker')).toBeInTheDocument();
  });

  it('reveals the full phone number when the eye toggle is clicked', async () => {
    renderWithProviders(<CandidateDetailsPage />);
    await screen.findByText('pages.candidateDetails.tabs.profile');
    // PhoneRevealCard starts masked; clicking the reveal button shows the full number.
    const toggle = screen.getByRole('button', { name: 'Show phone number' });
    fireEvent.click(toggle);
    expect(await screen.findByText('9876543210')).toBeInTheDocument();
  });
});
