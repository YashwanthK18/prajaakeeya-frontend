// COMPONENT TEST for SopAgreementCard.
//
// Behaviour:
//   - Renders NOTHING when sopAgreed is false.
//   - When sopAgreed is true, shows the "SOP Agreed" pill (unless hidePill).
//   - Clicking the pill (or the "Review SOP" icon) opens a dialog that shows the
//     standard operating procedure (a SopFlowChart) plus the signer's name.
//   - When `open` is controlled, toggling closed calls onClose().
//
// SopFlowChart is a heavy animated child; we mock it to a simple marker so this
// test stays focused on SopAgreementCard's own logic.

import { renderWithProviders, screen, fireEvent, within } from './test-utils';
import SopAgreementCard from '../components/aspirant/SopAgreementCard';

// --- Mock i18n in case any nested import touches it. ---
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string, o?: any) => (o && o.defaultValue ? o.defaultValue : k),
    i18n: { language: 'en', changeLanguage: () => Promise.resolve() },
  }),
  Trans: ({ children }: any) => children,
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

// --- Mock the SopFlowChart child so we don't pull in framer-motion / its tree. ---
// The card passes a `signatureSlot` (containing the signer name) into it; we render
// that slot so we can still assert the name shows up inside the dialog.
vi.mock('../components/aspirant/SopFlowChart', () => ({
  default: ({ signatureSlot }: any) => (
    <div data-testid="sop-flow-chart">{signatureSlot}</div>
  ),
}));

describe('SopAgreementCard', () => {
  it('renders nothing when the SOP has not been agreed', () => {
    const { container } = renderWithProviders(
      <SopAgreementCard sopAgreed={false} name="Asha" />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the "SOP Agreed" pill when agreed', () => {
    renderWithProviders(<SopAgreementCard sopAgreed name="Asha" />);
    expect(screen.getByText('SOP Agreed')).toBeInTheDocument();
    expect(screen.getByText('Tap to review the SOP')).toBeInTheDocument();
    // Dialog content is not mounted/visible until opened.
    expect(screen.queryByTestId('sop-flow-chart')).not.toBeInTheDocument();
  });

  it('hides the pill when hidePill is set', () => {
    renderWithProviders(<SopAgreementCard sopAgreed name="Asha" hidePill />);
    expect(screen.queryByText('SOP Agreed')).not.toBeInTheDocument();
  });

  it('opens the SOP dialog when the pill is clicked', () => {
    renderWithProviders(<SopAgreementCard sopAgreed name="Asha Rao" />);
    // Click the pill text (it sits inside a button element).
    fireEvent.click(screen.getByText('SOP Agreed'));
    // The dialog now mounts the (mocked) flow chart.
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByTestId('sop-flow-chart')).toBeInTheDocument();
    // The dialog header title is shown.
    expect(within(dialog).getByText('Standard Operating Procedure')).toBeInTheDocument();
    // The signer's name appears in the signature slot.
    expect(within(dialog).getAllByText('Asha Rao').length).toBeGreaterThan(0);
  });

  it('renders Kannada labels when isKannada is true', () => {
    renderWithProviders(<SopAgreementCard sopAgreed name="Asha" isKannada />);
    expect(screen.getByText('SOP ಒಪ್ಪಿಗೆ ಪಡೆಯಲಾಗಿದೆ')).toBeInTheDocument();
  });

  it('calls onClose when a controlled-open dialog is closed', () => {
    const onClose = vi.fn();
    renderWithProviders(
      <SopAgreementCard sopAgreed name="Asha" open onClose={onClose} hidePill />
    );
    // Controlled open -> dialog is already shown; close it via the X button.
    // The close IconButton has no aria-label, so locate it via its CloseIcon (MUI
    // renders data-testid="CloseIcon") and click the enclosing <button>.
    const dialog = screen.getByRole('dialog');
    const closeIcon = within(dialog).getByTestId('CloseIcon');
    fireEvent.click(closeIcon.closest('button')!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
