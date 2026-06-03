// PAGE TEST for GuestDashboardPage — the public (not-logged-in) home grid of
// action tiles (View Aspirants, Public Issues, SOP, Registered Aspirants) plus
// a hero banner that shows the total registered-citizens count.
//
// What this page does (the parts we care about for tests):
//   - On mount it fetches the total voters count (getVoters) and, if a numeric
//     total comes back, shows it in the hero strip (toLocaleString).
//   - Renders a hero heading. Because i18n.language is 'en' (not 'kn'), the page
//     uses the HARDCODED English string "Guest Dashboard".
//   - Renders a grid of clickable action tiles whose titles come from
//     t('...', { defaultValue }); our mock returns the defaultValue.
//   - Clicking a tile navigates (useNavigate) to its path.
//
// Setup notes:
//   - react-i18next mocked with STABLE t/i18n refs.
//   - voterService.getVoters fully mocked — no network.
//   - useNavigate spied; the rest of react-router-dom stays real.
//   - No auth store needed (guest page reads no store).

import { renderWithProviders, screen, fireEvent, waitFor } from './test-utils';
import GuestDashboardPage from '../pages/guest/GuestDashboardPage';

// Stable refs so the page's tile array (built from t) stays referentially calm.
const t = (k: string, o?: any) => (o && o.defaultValue ? o.defaultValue : k);
const i18n = { language: 'en', changeLanguage: () => Promise.resolve(), t };
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t, i18n }),
  Trans: ({ children }: any) => children,
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

// Spy useNavigate; keep the rest of the router (MemoryRouter etc.) real.
const navigate = vi.fn();
vi.mock('react-router-dom', async (orig) => ({
  ...(await (orig() as any)),
  useNavigate: () => navigate,
}));

// voterService.getVoters — page reads resp.data.totalUsers (falls back to .total).
vi.mock('../services/voterService', () => ({
  getVoters: vi.fn(() => Promise.resolve({ data: { totalUsers: 4567 } })),
}));

describe('GuestDashboardPage (/guest/dashboard)', () => {
  it('renders the hero heading (hardcoded English when language is not kn)', () => {
    renderWithProviders(<GuestDashboardPage />, { route: '/guest/dashboard' });
    expect(screen.getByText('Guest Dashboard')).toBeInTheDocument();
  });

  it('renders the action tiles', () => {
    renderWithProviders(<GuestDashboardPage />, { route: '/guest/dashboard' });
    // Tile titles use t('...', { defaultValue }); our mock returns defaultValue.
    expect(screen.getByText('View Aspirants')).toBeInTheDocument();
    expect(screen.getByText('Public Issues')).toBeInTheDocument();
    expect(screen.getByText('SOP')).toBeInTheDocument();
    expect(screen.getByText('Registered Aspirants')).toBeInTheDocument();
  });

  it('shows the registered-citizens count fetched from getVoters', async () => {
    renderWithProviders(<GuestDashboardPage />, { route: '/guest/dashboard' });
    // 4567 -> "4,567" via toLocaleString once the on-mount fetch resolves.
    expect(await screen.findByText('4,567')).toBeInTheDocument();
  });

  it('navigates to the aspirants page when the "View Aspirants" tile is clicked', async () => {
    renderWithProviders(<GuestDashboardPage />, { route: '/guest/dashboard' });
    fireEvent.click(screen.getByText('View Aspirants'));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/guest/aspirants'));
  });

  it('navigates to the civic-issues page when the "Public Issues" tile is clicked', async () => {
    renderWithProviders(<GuestDashboardPage />, { route: '/guest/dashboard' });
    fireEvent.click(screen.getByText('Public Issues'));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/guest/civic-issues'));
  });
});
