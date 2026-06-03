// PAGE TEST for UserLoginPage — the public sign-in screen.
//
// What this page does (the parts we care about for tests):
//   - Renders inside SplitAuthLayout (branding + a card).
//   - Shows a "Continue with Google" button and a "Continue as Guest" button.
//   - Clicking "Sign up" navigates to /oath; "Continue as Guest" -> /guest/dashboard.
//
// Setup notes:
//   - react-i18next is mocked so t() returns the KEY (or its defaultValue). We
//     assert on those key strings (e.g. 'pages.login.socialGoogle').
//   - authService is fully mocked so nothing hits the network.
//   - useNavigate is spied on (the rest of react-router-dom stays real so
//     MemoryRouter still works).
//   - The auth store is real; we reset it to logged-out before each test.

import { renderWithProviders, screen, fireEvent } from './test-utils';
import UserLoginPage from '../pages/UserLoginPage';
import useAuthStore from '../store/useAuthStore';

// --- i18n: t() echoes the key (or defaultValue). The i18n object also needs a
// .t() method because SplitAuthLayout (the wrapper this page uses) calls
// i18n.t('pages.login.footerMotto') directly. ---
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string, o?: any) => (o && o.defaultValue ? o.defaultValue : k),
    i18n: {
      language: 'en',
      changeLanguage: () => Promise.resolve(),
      t: (k: string) => k,
    },
  }),
  Trans: ({ children }: any) => children,
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

// --- Spy on useNavigate; keep the rest of react-router-dom real. ---
const navigate = vi.fn();
vi.mock('react-router-dom', async (orig) => ({
  ...(await orig() as any),
  useNavigate: () => navigate,
}));

// --- authService: every function is a resolved no-op so no network calls fire. ---
vi.mock('../services/authService', () => ({
  sendAspirantOtp: vi.fn(() => Promise.resolve({ verificationId: 'v1' })),
  verifyAspirantLoginOtp: vi.fn(() => Promise.resolve({ token: 't', user: {} })),
  resendAspirantOtp: vi.fn(() => Promise.resolve({ verificationId: 'v1' })),
  getGoogleOAuthUrl: vi.fn(() => 'https://example.com/oauth'),
}));

describe('UserLoginPage', () => {
  beforeEach(() => {
    // Start logged-out before each test.
    useAuthStore.setState({ token: null, user: null, isAuthenticated: false } as any);
  });

  it('renders the Google sign-in button', () => {
    renderWithProviders(<UserLoginPage />);
    // Button label resolves to the i18n key in our mock.
    expect(
      screen.getByRole('button', { name: 'pages.login.socialGoogle' }),
    ).toBeInTheDocument();
  });

  it('renders the card title and the sign-up prompt', () => {
    renderWithProviders(<UserLoginPage />);
    // SplitAuthLayout renders cardTitle=t('pages.login.title').
    expect(screen.getByText('pages.login.title')).toBeInTheDocument();
    // The "no account yet?" prompt text.
    expect(screen.getByText('pages.login.noAccount')).toBeInTheDocument();
  });

  it('renders the "Continue as Guest" button', () => {
    renderWithProviders(<UserLoginPage />);
    expect(
      screen.getByRole('button', { name: 'pages.login.continueAsGuest' }),
    ).toBeInTheDocument();
  });

  it('navigates to the guest dashboard when "Continue as Guest" is clicked', () => {
    renderWithProviders(<UserLoginPage />);
    fireEvent.click(
      screen.getByRole('button', { name: 'pages.login.continueAsGuest' }),
    );
    expect(navigate).toHaveBeenCalledWith('/guest/dashboard');
  });

  it('navigates to /oath when the sign-up link is clicked', () => {
    renderWithProviders(<UserLoginPage />);
    fireEvent.click(screen.getByText('pages.login.signUp'));
    expect(navigate).toHaveBeenCalledWith('/oath');
  });
});
