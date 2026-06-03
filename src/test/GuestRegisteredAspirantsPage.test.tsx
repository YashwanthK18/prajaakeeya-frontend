// PAGE TEST for GuestRegisteredAspirantsPage — backs the
// /guest/registered-aspirants route. It fetches a paginated list of aspirants
// (getAllAspirants(page, 50)), keeps the full list in state, and does
// CLIENT-SIDE filtering as you type in the search box (no refetch). Rows are
// rendered as a table on desktop / cards on mobile, and clicking a row
// navigates to /guest/aspirants/<id>/view.
//
// Setup notes (mirrors RegisteredAspirantsPage.test.tsx, adjusted for guest):
//   - i18n mocked with stable refs; language 'en' so the page shows English
//     labels (it switches to Kannada only when i18n.language starts with 'kn').
//   - react-router-dom: useNavigate spied; MemoryRouter stays real.
//   - aspirantService.getAllAspirants mocked; the page reads resp.data.data /
//     resp.data.total / resp.data.totalPages.
//   - matchMedia is stubbed (in setupTests) to matches:false, so useMediaQuery
//     reports desktop -> the table layout renders.

import { renderWithProviders, screen, fireEvent, waitFor } from './test-utils';
import GuestRegisteredAspirantsPage from '../pages/guest/GuestRegisteredAspirantsPage';
import { getAllAspirants } from '../services/aspirantService';

const t = (k: string, o?: any) => (o && o.defaultValue ? o.defaultValue : k);
const i18n = { language: 'en', changeLanguage: () => Promise.resolve(), t };
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t, i18n }),
  Trans: ({ children }: any) => children,
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

const navigate = vi.fn();
vi.mock('react-router-dom', async (orig) => ({
  ...(await (orig() as any)),
  useNavigate: () => navigate,
}));

vi.mock('../services/aspirantService', () => ({
  getAllAspirants: vi.fn(),
}));

const sampleAspirants = [
  { id: 1, name: 'Asha Rao', party: 'Independent', electionName: 'Lok Sabha 2024', constituencyName: 'Bangalore North' },
  { id: 2, name: 'Ravi Kumar', party: 'XYZ Party', electionName: 'State Assembly', constituencyName: 'Ward 12' },
];

describe('GuestRegisteredAspirantsPage (/guest/registered-aspirants)', () => {
  beforeEach(() => {
    navigate.mockClear();
    // Default: a populated, single-page result.
    vi.mocked(getAllAspirants).mockResolvedValue({
      data: { data: sampleAspirants, total: 2, totalPages: 1, page: 1, limit: 50 },
    } as any);
  });

  it('renders the header title and the search box', () => {
    renderWithProviders(<GuestRegisteredAspirantsPage />, { route: '/guest/registered-aspirants' });
    expect(screen.getByText('Registered Aspirants')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Search by name, party, election...'),
    ).toBeInTheDocument();
  });

  it('fetches aspirants on mount and renders their rows', async () => {
    renderWithProviders(<GuestRegisteredAspirantsPage />, { route: '/guest/registered-aspirants' });
    // Mount fetch: page 1, page size 50 (guest page passes no search arg).
    await waitFor(() => expect(getAllAspirants).toHaveBeenCalledWith(1, 50));
    expect(await screen.findByText('Asha Rao')).toBeInTheDocument();
    expect(screen.getByText('Ravi Kumar')).toBeInTheDocument();
    expect(screen.getByText('Bangalore North')).toBeInTheDocument();
  });

  it('shows the empty state when no aspirants are returned', async () => {
    vi.mocked(getAllAspirants).mockResolvedValue({
      data: { data: [], total: 0, totalPages: 1 },
    } as any);
    renderWithProviders(<GuestRegisteredAspirantsPage />, { route: '/guest/registered-aspirants' });
    expect(await screen.findByText('No aspirants found')).toBeInTheDocument();
  });

  it('navigates to the guest aspirant detail page when a row is clicked', async () => {
    renderWithProviders(<GuestRegisteredAspirantsPage />, { route: '/guest/registered-aspirants' });
    const row = await screen.findByText('Asha Rao');
    fireEvent.click(row); // click bubbles up to the TableRow's onClick
    expect(navigate).toHaveBeenCalledWith('/guest/aspirants/1/view');
  });

  it('filters the list client-side as you type (no refetch)', async () => {
    renderWithProviders(<GuestRegisteredAspirantsPage />, { route: '/guest/registered-aspirants' });
    expect(await screen.findByText('Asha Rao')).toBeInTheDocument();

    fireEvent.change(
      screen.getByPlaceholderText('Search by name, party, election...'),
      { target: { value: 'Ravi' } },
    );
    // Filtering happens in-memory: matching row stays, non-matching disappears.
    await waitFor(() => expect(screen.queryByText('Asha Rao')).not.toBeInTheDocument());
    expect(screen.getByText('Ravi Kumar')).toBeInTheDocument();
    // The page does not refetch on search; only the mount call happened.
    expect(getAllAspirants).toHaveBeenCalledTimes(1);
  });

  it('shows an error message when the fetch fails', async () => {
    vi.mocked(getAllAspirants).mockRejectedValue({ message: 'Boom' });
    renderWithProviders(<GuestRegisteredAspirantsPage />, { route: '/guest/registered-aspirants' });
    expect(await screen.findByText('Boom')).toBeInTheDocument();
  });
});
