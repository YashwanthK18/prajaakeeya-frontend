// Tests for AuthFooter: a presentational footer with three router links
// (Privacy Policy / Terms / Community Guidelines) and a copyright line.
import { renderWithProviders, screen } from './test-utils';
import AuthFooter from '../components/AuthFooter';

// AuthFooter calls useTranslation() (only for i18n instance), so stub it.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string, o?: any) => (o && o.defaultValue ? o.defaultValue : k),
    i18n: { language: 'en', changeLanguage: () => Promise.resolve() },
  }),
  Trans: ({ children }: any) => children,
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

describe('AuthFooter', () => {
  it('renders the three policy links', () => {
    renderWithProviders(<AuthFooter />);
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Terms' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Community Guidelines' })).toBeInTheDocument();
  });

  it('points each link at the correct route', () => {
    renderWithProviders(<AuthFooter />);
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute(
      'href',
      '/privacy-policy'
    );
    expect(screen.getByRole('link', { name: 'Terms' })).toHaveAttribute(
      'href',
      '/terms-and-conditions'
    );
    expect(screen.getByRole('link', { name: 'Community Guidelines' })).toHaveAttribute(
      'href',
      '/community-guidelines'
    );
  });

  it('shows the copyright line with the current year', () => {
    renderWithProviders(<AuthFooter />);
    const year = new Date().getFullYear();
    expect(screen.getByText(`© Prajaakeeya ${year}`)).toBeInTheDocument();
  });

  it('renders inside a footer landmark', () => {
    renderWithProviders(<AuthFooter />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });
});
