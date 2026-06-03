// PAGE TEST for GuestAspirantsPage — the public (not-logged-in) aspirant browser
// at /guest/aspirants. The user picks an Election Type, then cascading
// constituency / municipality / gram-panchayat filters; once the filters are
// complete the page fetches & lists approved aspirants.
//
// These tests are deliberately modest: render + key heading/label + empty-state,
// with EVERY service mocked so nothing hits the network. We keep the elections
// list empty so the page lands deterministically on its "select filters" empty
// state (filtersComplete is false), which avoids the heavy cascading-fetch flow.
//
// What we rely on:
//   - The page title uses t('userDashboard.actions.candidates', { defaultValue:
//     'View Aspirants' }); our mock returns the defaultValue.
//   - The Election Type select label uses t('forms.aspirant.electionType',
//     { defaultValue: 'Election Type' }).
//   - With no filters chosen, the page shows the hardcoded English prompt
//     "Select the filters above to view aspirants" (language is 'en', not 'kn').
//
// Setup notes:
//   - react-i18next mocked with stable t/i18n refs.
//   - electionService + aspirantService fully mocked with valid empty shapes.
//   - No useNavigate / auth store needed (the guest page reads neither).

import { renderWithProviders, screen } from './test-utils';
import GuestAspirantsPage from '../pages/guest/GuestAspirantsPage';

const t = (k: string, o?: any) => (o && o.defaultValue ? o.defaultValue : k);
const i18n = { language: 'en', changeLanguage: () => Promise.resolve(), t };
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t, i18n }),
  Trans: ({ children }: any) => children,
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

// electionService — fetchElections resolves to an empty list so no cascading
// fetches fire; every other geography fetch resolves to a valid empty shape.
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

// aspirantService — list fetch resolves empty (never reached without filters).
vi.mock('../services/aspirantService', () => ({
  fetchAspirantsByConstituency: vi.fn(() => Promise.resolve({ data: [] })),
}));

describe('GuestAspirantsPage (/guest/aspirants)', () => {
  it('renders the page title', () => {
    renderWithProviders(<GuestAspirantsPage />, { route: '/guest/aspirants' });
    expect(screen.getByText('View Aspirants')).toBeInTheDocument();
  });

  it('renders the Election Type filter', () => {
    renderWithProviders(<GuestAspirantsPage />, { route: '/guest/aspirants' });
    // The select renders a label (multiple label nodes can exist for an
    // outlined select), so assert at least one match.
    expect(screen.getAllByText('Election Type').length).toBeGreaterThan(0);
  });

  it('shows the "select filters" empty state before any filter is chosen', () => {
    renderWithProviders(<GuestAspirantsPage />, { route: '/guest/aspirants' });
    // Hardcoded English (non-Kannada branch) since filtersComplete is false.
    expect(
      screen.getByText('Select the filters above to view aspirants'),
    ).toBeInTheDocument();
  });

  it('renders without crashing and stays mounted (smoke)', () => {
    renderWithProviders(<GuestAspirantsPage />, { route: '/guest/aspirants' });
    // Title still present after the on-mount fetchElections effect settles.
    expect(screen.getByText('View Aspirants')).toBeInTheDocument();
  });
});
