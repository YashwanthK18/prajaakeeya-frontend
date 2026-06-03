// COMPONENT TEST for AspirantRequestsTab.
//
// Presentational table/list of "Direct Meet Requests". Covers:
//   - loading state, empty state, populated state (table on desktop, cards on mobile)
//   - the refresh button fires fetchAspirantBookings()
//   - error text shows in the empty state when bookingsFetchError is set

import { renderWithProviders, screen, fireEvent } from './test-utils';
import AspirantRequestsTab from '../components/aspirant/AspirantRequestsTab';

// --- Mock i18n: t() returns the key (or defaultValue). ---
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string, o?: any) => (o && o.defaultValue ? o.defaultValue : k),
    i18n: { language: 'en', changeLanguage: () => Promise.resolve() },
  }),
  Trans: ({ children }: any) => children,
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

const booking = { id: 1, voterName: 'Ravi Kumar', message: 'Please meet me about water supply' };

// Render with sensible defaults; overrides per test.
function setup(overrides: Record<string, unknown> = {}) {
  const props = {
    bookings: [] as any[],
    bookingsLoading: false,
    bookingsFetchError: null as string | null,
    bookingsLastFetchedAt: null as number | null,
    fetchAspirantBookings: vi.fn(),
    isMobile: false,
    ...overrides,
  };
  renderWithProviders(<AspirantRequestsTab {...(props as any)} />);
  return props;
}

describe('AspirantRequestsTab', () => {
  it('renders the requests heading', () => {
    setup();
    expect(screen.getByText('userDashboard.aspirant.requests')).toBeInTheDocument();
  });

  it('shows the loading message while bookings are loading', () => {
    setup({ bookingsLoading: true });
    expect(screen.getByText('common.loading')).toBeInTheDocument();
  });

  it('shows the empty state when there are no requests', () => {
    setup({ bookings: [] });
    expect(screen.getByText('userDashboard.aspirant.noRequests')).toBeInTheDocument();
  });

  it('renders a booking row (desktop table) with voter name and message', () => {
    setup({ bookings: [booking], isMobile: false });
    expect(screen.getByText('Ravi Kumar')).toBeInTheDocument();
    expect(screen.getByText('Please meet me about water supply')).toBeInTheDocument();
    // Table header labels come back as keys.
    expect(screen.getByText('userDashboard.aspirant.requestsTable.voter')).toBeInTheDocument();
  });

  it('renders bookings as cards on mobile', () => {
    setup({ bookings: [booking], isMobile: true });
    expect(screen.getByText('Ravi Kumar')).toBeInTheDocument();
    expect(screen.getByText('Please meet me about water supply')).toBeInTheDocument();
    // No table header in the mobile card layout.
    expect(
      screen.queryByText('userDashboard.aspirant.requestsTable.voter')
    ).not.toBeInTheDocument();
  });

  it('calls fetchAspirantBookings when the refresh button is clicked', () => {
    const props = setup();
    // aria-label "Refresh requests" is hardcoded English.
    fireEvent.click(screen.getByRole('button', { name: 'Refresh requests' }));
    expect(props.fetchAspirantBookings).toHaveBeenCalledTimes(1);
  });

  it('shows the fetch error in the empty state', () => {
    setup({ bookings: [], bookingsFetchError: 'Server unavailable' });
    expect(screen.getByText(/Server unavailable/)).toBeInTheDocument();
  });
});
