// PAGE TEST for GuestCivicIssuesPage — the public (not-logged-in) civic-issues
// view at /guest/civic-issues. The user picks an Election Type and cascading
// constituency filters; once complete the page fetches per-area issue counts.
//
// These tests are deliberately modest: render + header + the static category
// grid shown before any filter is chosen, with EVERY service mocked. We keep the
// elections list empty so the page lands on its pre-filter state (filtersComplete
// is false), which renders the STATIC_CATEGORIES grid synchronously.
//
// What we rely on:
//   - The header title uses t('civicIssues.title', { defaultValue: 'Public
//     Issues' }); our mock returns the defaultValue.
//   - Before any filter is chosen the page shows the hardcoded English prompt
//     "Select a constituency above to view issue counts in your area" plus the
//     STATIC_CATEGORIES grid (e.g. "Jobs issues", "Health issues") — these are
//     literal English names rendered when language is not 'kn'.
//
// Setup notes:
//   - react-i18next mocked with stable t/i18n refs.
//   - civicIssuesService.getIssuesByElectionAndConstituency mocked; the page
//     destructures `{ categories }` off the RESOLVED value (not res.data), so the
//     mock resolves to { categories: [...] } directly.
//   - electionService fully mocked with valid empty shapes.
//   - No useNavigate / auth store needed (the guest page reads neither).

import { renderWithProviders, screen } from './test-utils';
import GuestCivicIssuesPage from '../pages/guest/GuestCivicIssuesPage';

const t = (k: string, o?: any) => (o && o.defaultValue ? o.defaultValue : k);
const i18n = { language: 'en', changeLanguage: () => Promise.resolve(), t };
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t, i18n }),
  Trans: ({ children }: any) => children,
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

// civicIssues service — the page does `.then(({ categories }) => ...)`, so the
// resolved value is the bare object (not wrapped in `data`).
vi.mock('../services/civicIssuesService', () => ({
  getIssuesByElectionAndConstituency: vi.fn(() =>
    Promise.resolve({ categories: [], issues: [], totalHandRaises: 0 }),
  ),
}));

// electionService — empty-but-valid shapes; with no elections, no cascading
// fetches fire and the page stays on its pre-filter (static grid) state.
vi.mock('../services/electionService', () => ({
  fetchElections: vi.fn(() => Promise.resolve({ data: [] })),
  fetchConstituencies: vi.fn(() => Promise.resolve({ data: { constituencies: [] } })),
  fetchMunicipalities: vi.fn(() => Promise.resolve({ data: [] })),
  fetchConstituenciesByScope: vi.fn(() => Promise.resolve({ data: [] })),
  fetchGPStates: vi.fn(() => Promise.resolve({ data: [] })),
  fetchGPDistricts: vi.fn(() => Promise.resolve({ data: [] })),
  fetchGPTaluks: vi.fn(() => Promise.resolve({ data: [] })),
  fetchGPGrams: vi.fn(() => Promise.resolve({ data: [] })),
  fetchGPVillages: vi.fn(() => Promise.resolve({ data: [] })),
}));

describe('GuestCivicIssuesPage (/guest/civic-issues)', () => {
  it('renders the header title', () => {
    renderWithProviders(<GuestCivicIssuesPage />, { route: '/guest/civic-issues' });
    expect(screen.getByText('Public Issues')).toBeInTheDocument();
  });

  it('renders the Election Type filter', () => {
    renderWithProviders(<GuestCivicIssuesPage />, { route: '/guest/civic-issues' });
    expect(screen.getAllByText('Election Type').length).toBeGreaterThan(0);
  });

  it('shows the pre-filter prompt before any constituency is chosen', () => {
    renderWithProviders(<GuestCivicIssuesPage />, { route: '/guest/civic-issues' });
    // Hardcoded English (non-Kannada branch) since filtersComplete is false.
    expect(
      screen.getByText('Select a constituency above to view issue counts in your area'),
    ).toBeInTheDocument();
  });

  it('renders the static category grid in the pre-filter state', () => {
    renderWithProviders(<GuestCivicIssuesPage />, { route: '/guest/civic-issues' });
    // STATIC_CATEGORIES names are literal English in the non-Kannada branch.
    expect(screen.getByText('Jobs issues')).toBeInTheDocument();
    expect(screen.getByText('Health issues')).toBeInTheDocument();
    expect(screen.getByText('Water issues')).toBeInTheDocument();
  });
});
