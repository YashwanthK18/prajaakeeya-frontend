// Sample test that verifies the FULL React testing stack is wired up:
//   - Vitest runs the test            (test runner)
//   - jsdom provides document/window  (fake browser)
//   - React Testing Library renders   (render + screen)
//   - jest-dom adds toBeInTheDocument (custom matcher)
//
// `describe` groups tests; `it` is one case; `expect(...)` is an assertion.
import { render, screen } from '@testing-library/react';

// A throwaway component, just to prove rendering works end-to-end.
function Hello({ name }: { name: string }) {
  return <h1>Hello, {name}!</h1>;
}

describe('vitest + react testing library setup', () => {
  it('runs basic assertions (Vitest)', () => {
    expect(1 + 1).toBe(2);
  });

  it('renders a React component and finds it in the DOM (RTL + jest-dom)', () => {
    render(<Hello name="Prajaakeeya" />);
    // toBeInTheDocument() comes from @testing-library/jest-dom.
    expect(screen.getByText('Hello, Prajaakeeya!')).toBeInTheDocument();
  });
});
