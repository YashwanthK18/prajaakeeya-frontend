// COMPONENT TEST for AspirantChatTab.
//
// This is a presentational card with a single "Join Interview" button. Clicking
// it navigates to /user/chat/<aspirantId> (or /user/chat when no id is known).
//
// Import paths are relative to src/test/ since the test lives in src/test/.

import { renderWithProviders, screen, fireEvent } from './test-utils';
import AspirantChatTab from '../components/aspirant/AspirantChatTab';

// --- Mock i18n: t() returns defaultValue if given, else the key. ---
// AspirantChatTab uses `t('key') || 'fallback'`, so a returned key string is fine
// (it's truthy) and we assert on the hardcoded English fallback via getByRole name.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string, o?: any) => (o && o.defaultValue ? o.defaultValue : k),
    i18n: { language: 'en', changeLanguage: () => Promise.resolve() },
  }),
  Trans: ({ children }: any) => children,
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

// Spy on react-router-dom's useNavigate so we can assert where the button sends us.
// We keep the real module (MemoryRouter etc.) and only override useNavigate.
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('AspirantChatTab', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders the chat title and the Join Interview button', () => {
    renderWithProviders(<AspirantChatTab aspirantProfile={{}} user={{}} />);
    // The t() mock returns the key for the title; assert on that key string.
    expect(screen.getByText('userDashboard.aspirant.chatTitle')).toBeInTheDocument();
    // Button label also comes back as the key.
    expect(
      screen.getByRole('button', { name: 'userDashboard.aspirant.joinInterview' })
    ).toBeInTheDocument();
  });

  it('navigates to the aspirant chat route using the profile id', () => {
    const aspirantProfile = { id: 42, name: 'Asha' };
    renderWithProviders(<AspirantChatTab aspirantProfile={aspirantProfile} user={{}} />);

    fireEvent.click(screen.getByRole('button', { name: 'userDashboard.aspirant.joinInterview' }));

    // Navigates to /user/chat/42 and passes the candidate in router state.
    expect(mockNavigate).toHaveBeenCalledWith('/user/chat/42', {
      state: { candidate: { id: 42, name: 'Asha' } },
    });
  });

  it('falls back to the user id when the profile has no id', () => {
    renderWithProviders(<AspirantChatTab aspirantProfile={{}} user={{ id: 7, name: 'Ravi' }} />);

    fireEvent.click(screen.getByRole('button', { name: 'userDashboard.aspirant.joinInterview' }));

    expect(mockNavigate).toHaveBeenCalledWith('/user/chat/7', {
      state: { candidate: { name: 'Ravi' } },
    });
  });

  it('navigates to the generic chat page when no id is available', () => {
    renderWithProviders(<AspirantChatTab aspirantProfile={{}} user={{}} />);

    fireEvent.click(screen.getByRole('button', { name: 'userDashboard.aspirant.joinInterview' }));

    expect(mockNavigate).toHaveBeenCalledWith('/user/chat');
  });
});
