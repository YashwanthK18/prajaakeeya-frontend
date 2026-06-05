// Tests for DeclarationStep — the final declaration/signature step of the
// aspirant registration wizard. It's a fully controlled presentational
// component (all state lives in the parent), so we drive it with props.
//
// Setup notes:
//  - react-i18next is mocked so t() returns the key (or its defaultValue).
//    Several labels use `t('...') || 'English'`, so where the key is the only
//    output we assert on the KEY string.
//  - No services are imported by this component.

import { renderWithProviders, screen, fireEvent } from './test-utils';
import DeclarationStep from '../components/aspirant/DeclarationStep';

// i18n: t() echoes the key, or the provided defaultValue when present.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string, o?: any) => (o && o.defaultValue ? o.defaultValue : k),
    i18n: { language: 'en', changeLanguage: () => Promise.resolve() },
  }),
  Trans: ({ children }: any) => children,
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

// Build a fresh set of valid props for each test. Callbacks are spies.
const makeProps = (overrides: Partial<any> = {}) => ({
  sopAgreed: false,
  setSopAgreed: vi.fn(),
  onSopClick: vi.fn(),
  declarationChecks: { agreed: false },
  setDeclarationChecks: vi.fn(),
  digitalSignature: '',
  setDigitalSignature: vi.fn(),
  canProceed: false,
  loading: false,
  onBack: vi.fn(),
  onSubmit: vi.fn(),
  ...overrides,
});

describe('DeclarationStep', () => {
  it('renders the declaration title and signature field', () => {
    renderWithProviders(<DeclarationStep {...makeProps()} />);
    // Title key is rendered verbatim (no fallback in this component).
    expect(
      screen.getByText('forms.aspirant.declaration.title'),
    ).toBeInTheDocument();
    // Signature field label is also rendered via t() (echoes the key).
    expect(
      screen.getByLabelText('forms.aspirant.declaration.signature.label'),
    ).toBeInTheDocument();
  });

  it('shows the Next navigation button (Home & Back are commented out)', () => {
    renderWithProviders(<DeclarationStep {...makeProps()} />);
    expect(
      screen.getByRole('button', { name: /forms.aspirant.navigation.next/ }),
    ).toBeInTheDocument();
    // Home & Back buttons are intentionally commented out in this step.
    expect(
      screen.queryByRole('button', { name: /forms.aspirant.navigation.back/ }),
    ).not.toBeInTheDocument();
  });

  it('disables the Next/submit button when canProceed is false', () => {
    renderWithProviders(<DeclarationStep {...makeProps({ canProceed: false })} />);
    expect(
      screen.getByRole('button', { name: /forms.aspirant.navigation.next/ }),
    ).toBeDisabled();
  });

  it('enables Next and fires onSubmit when canProceed is true', () => {
    const onSubmit = vi.fn();
    renderWithProviders(
      <DeclarationStep {...makeProps({ canProceed: true, onSubmit })} />,
    );
    const next = screen.getByRole('button', {
      name: /forms.aspirant.navigation.next/,
    });
    expect(next).toBeEnabled();
    fireEvent.click(next);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('updates the signature via setDigitalSignature on input change', () => {
    const setDigitalSignature = vi.fn();
    renderWithProviders(
      <DeclarationStep {...makeProps({ setDigitalSignature })} />,
    );
    const input = screen.getByLabelText(
      'forms.aspirant.declaration.signature.label',
    );
    fireEvent.change(input, { target: { value: 'Asha Rao' } });
    expect(setDigitalSignature).toHaveBeenCalledWith('Asha Rao');
  });

  it('toggles the agree checkbox via setDeclarationChecks', () => {
    const setDeclarationChecks = vi.fn();
    renderWithProviders(
      <DeclarationStep {...makeProps({ setDeclarationChecks })} />,
    );
    // The first checkbox is the declaration "agree" checkbox.
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    expect(setDeclarationChecks).toHaveBeenCalledWith({ agreed: true });
  });
});
