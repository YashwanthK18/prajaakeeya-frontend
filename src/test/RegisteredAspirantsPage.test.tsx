// PAGE TEST for RegisteredAspirantsPage — backs the /user/registered-aspirants
// route. It fetches a paginated, searchable list of aspirants
// (getAllAspirants), renders them as a table (desktop) or cards (mobile), and
// navigates to an aspirant's detail page when a row is clicked.
//
// Setup notes:
//   - i18n mocked with stable refs; language 'en' so the page shows English
//     labels (it switches to Kannada only when i18n.language starts with 'kn').
//   - react-router-dom: useNavigate spied; useLocation/MemoryRouter stay real.
//   - aspirantService.getAllAspirants mocked; the page reads resp.data.data /
//     resp.data.total / resp.data.totalPages.
//   - matchMedia is stubbed (in setupTests) to matches:false, so useMediaQuery
//     reports desktop -> the table layout renders.

import { renderWithProviders, screen, fireEvent, waitFor } from './test-utils';
import RegisteredAspirantsPage from '../pages/RegisteredAspirantsPage';
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

describe('RegisteredAspirantsPage (/user/registered-aspirants)', () => {
  beforeEach(() => {
    // Default: a populated, single-page result.
    vi.mocked(getAllAspirants).mockResolvedValue({
      data: { data: sampleAspirants, total: 2, totalPages: 1, page: 1, limit: 50 },
    } as any);
  });

  it('renders the header title and the search box', () => {
    renderWithProviders(<RegisteredAspirantsPage />, { route: '/user/registered-aspirants' });
    expect(screen.getByText('Registered Aspirants')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search by name')).toBeInTheDocument();
  });

  it('fetches aspirants on mount and renders their rows', async () => {
    renderWithProviders(<RegisteredAspirantsPage />, { route: '/user/registered-aspirants' });
    // Mount fetch: page 1, page size 50, no search term (undefined).
    await waitFor(() => expect(getAllAspirants).toHaveBeenCalledWith(1, 50, undefined));
    expect(await screen.findByText('Asha Rao')).toBeInTheDocument();
    expect(screen.getByText('Ravi Kumar')).toBeInTheDocument();
    expect(screen.getByText('Bangalore North')).toBeInTheDocument();
  });

  it('shows the empty state when no aspirants are returned', async () => {
    vi.mocked(getAllAspirants).mockResolvedValue({
      data: { data: [], total: 0, totalPages: 1 },
    } as any);
    renderWithProviders(<RegisteredAspirantsPage />, { route: '/user/registered-aspirants' });
    expect(await screen.findByText('No aspirants found')).toBeInTheDocument();
  });

  it('navigates to the aspirant detail page when a row is clicked', async () => {
    renderWithProviders(<RegisteredAspirantsPage />, { route: '/user/registered-aspirants' });
    const row = await screen.findByText('Asha Rao');
    fireEvent.click(row); // click bubbles to the TableRow's onClick
    expect(navigate).toHaveBeenCalledWith('/user/aspirants/1/view');
  });

  it('refetches with the search term after typing (debounced)', async () => {
    renderWithProviders(<RegisteredAspirantsPage />, { route: '/user/registered-aspirants' });
    await waitFor(() => expect(getAllAspirants).toHaveBeenCalledWith(1, 50, undefined));

    fireEvent.change(screen.getByPlaceholderText('Search by name'), {
      target: { value: 'Ravi' },
    });
    // The 400ms debounce then triggers a fetch scoped to the search term.
    await waitFor(
      () => expect(getAllAspirants).toHaveBeenCalledWith(1, 50, 'Ravi'),
      { timeout: 2000 },
    );
  });

  it('shows an error message when the fetch fails', async () => {
    vi.mocked(getAllAspirants).mockRejectedValue({ message: 'Boom' });
    renderWithProviders(<RegisteredAspirantsPage />, { route: '/user/registered-aspirants' });
    expect(await screen.findByText('Boom')).toBeInTheDocument();
  });
});
