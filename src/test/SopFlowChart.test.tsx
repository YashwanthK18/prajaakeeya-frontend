// Tests for SopFlowChart — an animated SVG/flow diagram of the SOP, with an
// optional agree-checkbox + proceed button at the bottom. It's purely
// presentational (no service imports); a ResizeObserver-driven effect draws the
// bypass connector, which the global no-op ResizeObserver stub handles fine.
//
// Setup notes:
//  - react-i18next is mocked so t() returns the key. Flow-node text comes from
//    fc(key) => t('forms.aspirant.sop.flowChart.<key>'), so we assert on those
//    full key strings.

import { renderWithProviders, screen, fireEvent } from './test-utils';
import SopFlowChart from '../components/aspirant/SopFlowChart';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string, o?: any) => (o && o.defaultValue ? o.defaultValue : k),
    i18n: { language: 'en', changeLanguage: () => Promise.resolve() },
  }),
  Trans: ({ children }: any) => children,
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

const makeProps = (overrides: Partial<any> = {}) => ({
  sopAgreed: false,
  setSopAgreed: vi.fn(),
  onAgree: vi.fn(),
  ...overrides,
});

describe('SopFlowChart', () => {
  it('renders the legend labels', () => {
    renderWithProviders(<SopFlowChart {...makeProps()} />);
    expect(screen.getByText('forms.aspirant.sop.legend.people')).toBeInTheDocument();
    expect(screen.getByText('forms.aspirant.sop.legend.prOthers')).toBeInTheDocument();
    expect(screen.getByText('forms.aspirant.sop.legend.pr')).toBeInTheDocument();
  });

  it('renders core flow-chart node text via the fc() key helper', () => {
    renderWithProviders(<SopFlowChart {...makeProps()} />);
    expect(
      screen.getByText('forms.aspirant.sop.flowChart.connectingWithPeople'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('forms.aspirant.sop.flowChart.pooling'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('forms.aspirant.sop.flowChart.execution'),
    ).toBeInTheDocument();
  });

  it('shows the agree checkbox + button when hideAgreement is false', () => {
    renderWithProviders(<SopFlowChart {...makeProps()} />);
    expect(
      screen.getByText('forms.aspirant.sop.agreeCheckbox'),
    ).toBeInTheDocument();
    // The agree button is disabled until sopAgreed is true.
    expect(
      screen.getByRole('button', { name: 'forms.aspirant.sop.agreeButton' }),
    ).toBeDisabled();
  });

  it('hides the agreement controls when hideAgreement is true', () => {
    renderWithProviders(<SopFlowChart {...makeProps({ hideAgreement: true })} />);
    expect(
      screen.queryByRole('button', { name: 'forms.aspirant.sop.agreeButton' }),
    ).not.toBeInTheDocument();
  });

  it('toggles the agree checkbox via setSopAgreed', () => {
    const setSopAgreed = vi.fn();
    renderWithProviders(<SopFlowChart {...makeProps({ setSopAgreed })} />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(setSopAgreed).toHaveBeenCalledWith(true);
  });

  it('enables the agree button and fires onAgree when sopAgreed is true', () => {
    const onAgree = vi.fn();
    renderWithProviders(<SopFlowChart {...makeProps({ sopAgreed: true, onAgree })} />);
    const btn = screen.getByRole('button', {
      name: 'forms.aspirant.sop.agreeButton',
    });
    expect(btn).toBeEnabled();
    fireEvent.click(btn);
    expect(onAgree).toHaveBeenCalledTimes(1);
  });

  it('renders the signatureSlot content when provided', () => {
    renderWithProviders(
      <SopFlowChart
        {...makeProps()}
        signatureSlot={<div data-testid="sig-slot">signed</div>}
      />,
    );
    expect(screen.getByTestId('sig-slot')).toBeInTheDocument();
  });
});
