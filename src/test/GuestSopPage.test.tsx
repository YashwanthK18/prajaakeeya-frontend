// PAGE TEST for GuestSopPage — backs the /guest/sop route. It's a thin,
// view-only wrapper: a header (icon + title + subtitle) above the SopFlowChart,
// which is rendered in read-only mode (hideAgreement). The page imports no
// services and reads no router params/stores.
//
// Setup notes:
//   - i18n mocked with stable refs; t() returns the KEY (or defaultValue). The
//     header text uses `t('pages.landing.sopOverline') || 'How Prajakeeya Works'`
//     — since t() returns a truthy key, we assert on the KEY string.
//   - SopFlowChart is a heavy animated child (framer-motion + ResizeObserver
//     drawing); we stub it to a marker div so this test stays focused on the
//     page's own header + that it mounts the chart with hideAgreement.
//   - window.scrollTo is already stubbed in setupTests (the page calls it on mount).

import { renderWithProviders, screen } from './test-utils';
import GuestSopPage from '../pages/guest/GuestSopPage';

const t = (k: string, o?: any) => (o && o.defaultValue ? o.defaultValue : k);
const i18n = { language: 'en', changeLanguage: () => Promise.resolve(), t };
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t, i18n }),
  Trans: ({ children }: any) => children,
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

// Stub the SopFlowChart child to a marker so we don't pull in its animated tree.
// We record the props it was rendered with to assert the page wires it as
// read-only (hideAgreement).
let lastFlowProps: any = null;
vi.mock('../components/aspirant/SopFlowChart', () => ({
  default: (props: any) => {
    lastFlowProps = props;
    return <div data-testid="sop-flow-chart" />;
  },
}));

describe('GuestSopPage (/guest/sop)', () => {
  beforeEach(() => {
    lastFlowProps = null;
  });

  it('renders the header title (translation key)', () => {
    renderWithProviders(<GuestSopPage />, { route: '/guest/sop' });
    expect(screen.getByText('pages.landing.sopOverline')).toBeInTheDocument();
  });

  it('renders the subtitle (translation key)', () => {
    renderWithProviders(<GuestSopPage />, { route: '/guest/sop' });
    expect(screen.getByText('pages.landing.sopFlow.coreRule')).toBeInTheDocument();
  });

  it('mounts the SOP flow chart', () => {
    renderWithProviders(<GuestSopPage />, { route: '/guest/sop' });
    expect(screen.getByTestId('sop-flow-chart')).toBeInTheDocument();
  });

  it('renders the flow chart in read-only mode (hideAgreement)', () => {
    renderWithProviders(<GuestSopPage />, { route: '/guest/sop' });
    expect(lastFlowProps).not.toBeNull();
    expect(lastFlowProps.hideAgreement).toBe(true);
    // Starts un-agreed and provides the state setter + a no-op onAgree.
    expect(lastFlowProps.sopAgreed).toBe(false);
    expect(typeof lastFlowProps.setSopAgreed).toBe('function');
  });
});
