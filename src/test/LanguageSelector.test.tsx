import { renderWithProviders, screen, fireEvent } from './test-utils';
import LanguageSelector, { LANGUAGES } from '../components/LanguageSelector';

const changeLanguage = vi.fn(() => Promise.resolve());

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string, o?: any) => (o && o.defaultValue ? o.defaultValue : k),
    i18n: { language: 'en', changeLanguage },
    initReactI18next: { type: '3rdParty', init: () => {} },
  }),
  Trans: ({ children }: any) => children,
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

describe('LanguageSelector', () => {
  beforeEach(() => {
    changeLanguage.mockClear();
  });

  it('renders the current language (English) on the trigger button', () => {
    renderWithProviders(<LanguageSelector />);
    expect(screen.getByRole('button', { name: /English/i })).toBeInTheDocument();
  });

  it('opens the menu with all language options when clicked', async () => {
    renderWithProviders(<LanguageSelector />);
    fireEvent.click(screen.getByRole('button', { name: /English/i }));

    const menuItems = await screen.findAllByRole('menuitem');
    expect(menuItems).toHaveLength(LANGUAGES.length);
    // Spot-check a couple of localized labels rendered in the menu.
    expect(screen.getByRole('menuitem', { name: 'ಕನ್ನಡ' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'हिन्दी' })).toBeInTheDocument();
  });

  it('calls i18n.changeLanguage with the selected code', async () => {
    renderWithProviders(<LanguageSelector />);
    fireEvent.click(screen.getByRole('button', { name: /English/i }));

    const kannada = await screen.findByRole('menuitem', { name: 'ಕನ್ನಡ' });
    fireEvent.click(kannada);

    expect(changeLanguage).toHaveBeenCalledWith('kn');
  });

  it('fires the onSelect callback with the chosen code', async () => {
    const onSelect = vi.fn();
    renderWithProviders(<LanguageSelector onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: /English/i }));

    const hindi = await screen.findByRole('menuitem', { name: 'हिन्दी' });
    fireEvent.click(hindi);

    expect(onSelect).toHaveBeenCalledWith('hi');
  });
});
