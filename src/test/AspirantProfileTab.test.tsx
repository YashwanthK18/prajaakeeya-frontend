// Tests for AspirantProfileTab — a read-only card showing an aspirant's profile,
// SOP agreement, and optional withdraw button.
//
// Setup notes:
//  - react-i18next is mocked so t() returns the key (or its defaultValue). Many
//    strings in this component are hardcoded English with a `t(...) || 'English'`
//    fallback, so we assert on the hardcoded English where it's stable.
//  - The component renders SopAgreementCard (which mounts SopFlowChart). Both are
//    pure-presentational, so no service mocks are needed here.

import { renderWithProviders, screen, fireEvent } from './test-utils';
import AspirantProfileTab from '../components/aspirant/AspirantProfileTab';

// i18n: t() echoes the key, or the provided defaultValue when present.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string, o?: any) => (o && o.defaultValue ? o.defaultValue : k),
    i18n: { language: 'en', changeLanguage: () => Promise.resolve() },
  }),
  Trans: ({ children }: any) => children,
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

// A plausible aspirant profile object (constituency-based / lok_sabha).
const baseProfile = {
  name: 'Asha Rao',
  status: 'approved',
  electionType: 'lok_sabha',
  electionName: 'Lok Sabha 2024',
  constituencyName: 'Bangalore South',
  applicationDate: '2026-01-15',
  sopAgreed: true,
  sopAgreedAt: '2026-01-10T10:00:00Z',
};

describe('AspirantProfileTab', () => {
  it('shows the empty-state message when no profile is provided', () => {
    renderWithProviders(
      <AspirantProfileTab
        aspirantProfile={null}
        isMobile={false}
        handleDownload={vi.fn()}
      />,
    );
    // The "no data" branch renders this hardcoded English string.
    expect(screen.getByText('Profile data not available')).toBeInTheDocument();
  });

  it('renders profile and SOP cards for a valid profile', () => {
    renderWithProviders(
      <AspirantProfileTab
        aspirantProfile={baseProfile}
        isMobile={false}
        handleDownload={vi.fn()}
      />,
    );
    // Hardcoded card section labels.
    expect(screen.getByText('Election')).toBeInTheDocument();
    expect(screen.getByText('Constituency')).toBeInTheDocument();
    // Election / constituency values come straight from the profile object.
    expect(screen.getByText('Lok Sabha 2024')).toBeInTheDocument();
    expect(screen.getByText('Bangalore South')).toBeInTheDocument();
  });

  it('shows the pending alert + Continue Registration button when status is pending', () => {
    renderWithProviders(
      <AspirantProfileTab
        aspirantProfile={{ ...baseProfile, status: 'pending' }}
        isMobile={false}
        handleDownload={vi.fn()}
      />,
    );
    expect(screen.getByText('Application is pending')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Continue Registration' }),
    ).toBeInTheDocument();
  });

  it('renders the Withdraw button only when onWithdraw is provided', () => {
    const onWithdraw = vi.fn();
    renderWithProviders(
      <AspirantProfileTab
        aspirantProfile={baseProfile}
        isMobile={false}
        handleDownload={vi.fn()}
        onWithdraw={onWithdraw}
      />,
    );
    // The button text is `t('userDashboard.aspirant.withdraw') || 'Withdraw'`.
    // Our t() mock returns the KEY (a truthy string), so the || fallback never
    // fires — assert on the key string the mock produces.
    expect(
      screen.getByRole('button', { name: 'userDashboard.aspirant.withdraw' }),
    ).toBeInTheDocument();
  });

  it('opens the withdraw confirmation dialog and fires onWithdraw on confirm', async () => {
    const onWithdraw = vi.fn();
    renderWithProviders(
      <AspirantProfileTab
        aspirantProfile={baseProfile}
        isMobile={false}
        handleDownload={vi.fn()}
        onWithdraw={onWithdraw}
      />,
    );
    // Click the outlined Withdraw button to open the confirm dialog.
    fireEvent.click(
      screen.getByRole('button', { name: 'userDashboard.aspirant.withdraw' }),
    );
    // Dialog title renders the title key (t() echoes the key).
    expect(
      screen.getByText('userDashboard.aspirant.withdrawConfirmTitle'),
    ).toBeInTheDocument();

    // The dialog adds a second button with the same withdraw key (confirm action).
    const withdrawButtons = screen.getAllByRole('button', {
      name: 'userDashboard.aspirant.withdraw',
    });
    // Confirm = the contained error button inside the dialog (the last one).
    fireEvent.click(withdrawButtons[withdrawButtons.length - 1]);
    expect(onWithdraw).toHaveBeenCalledTimes(1);
  });
});
