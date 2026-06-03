// Tests for ModernLoginLayout: a presentational wrapper that centers its
// children inside a MUI Paper card. We just confirm it renders children.
import { renderWithProviders, screen } from './test-utils';
import ModernLoginLayout from '../components/ModernLoginLayout';

describe('ModernLoginLayout', () => {
  it('renders its children', () => {
    renderWithProviders(
      <ModernLoginLayout>
        <span>Login form here</span>
      </ModernLoginLayout>
    );
    expect(screen.getByText('Login form here')).toBeInTheDocument();
  });

  it('renders multiple/complex children inside the layout', () => {
    renderWithProviders(
      <ModernLoginLayout>
        <h1>Welcome</h1>
        <button type="button">Sign in</button>
      </ModernLoginLayout>
    );
    expect(screen.getByRole('heading', { name: 'Welcome' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });
});
