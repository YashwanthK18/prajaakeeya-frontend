// Shared test helpers. Import from here instead of '@testing-library/react'
// so every test gets the providers most components need (MUI theme + Router).
//
// Usage:
//   import { renderWithProviders, screen } from './test-utils';
//   renderWithProviders(<MyComponent />);
//   // or with a starting route:
//   renderWithProviders(<MyPage />, { route: '/aspirants/5' });

import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import { getTheme } from '../theme';

interface ProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  // Initial URL the in-memory router starts at (default '/').
  route?: string;
}

// Wraps children in the app's MUI theme + an in-memory router.
// MemoryRouter is used (not BrowserRouter) so navigation works without a real
// browser URL bar, and tests can start at any route.
function AllProviders({ children, route = '/' }: { children: ReactNode; route?: string }) {
  return (
    <ThemeProvider theme={getTheme('light')}>
      <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
    </ThemeProvider>
  );
}

export function renderWithProviders(ui: ReactElement, options: ProvidersOptions = {}) {
  const { route, ...rest } = options;
  return render(ui, {
    wrapper: ({ children }) => <AllProviders route={route}>{children}</AllProviders>,
    ...rest,
  });
}

// Re-export everything from RTL so tests have a single import source.
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
