// Runs automatically before every test file (configured via test.setupFiles
// in vite.config.js).

// 1) Adds DOM matchers like toBeInTheDocument(), toBeDisabled(), toHaveValue().
import '@testing-library/jest-dom/vitest';

// 2) Unmount the rendered DOM and reset mocks after each test so tests stay
//    isolated from one another.
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// 3) jsdom doesn't implement matchMedia; MUI calls it. Stub so it doesn't crash.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }),
});

// 4) jsdom lacks IntersectionObserver / ResizeObserver (used by MUI + animation
//    libs). Provide no-op stubs so components relying on them can render.
class NoopObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.IntersectionObserver = NoopObserver as unknown as typeof IntersectionObserver;
window.ResizeObserver = NoopObserver as unknown as typeof ResizeObserver;

// 5) jsdom doesn't implement scrollTo; many pages call it on mount.
window.scrollTo = () => {};

// 6) Provide a real in-memory localStorage/sessionStorage. jsdom's built-in
//    Storage doesn't behave consistently across workers here (zustand's persist
//    middleware fails with "storage.setItem is not a function"), so we install
//    a simple, spec-shaped implementation that always works.
class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length() { return this.store.size; }
  clear() { this.store.clear(); }
  getItem(key: string) { return this.store.has(key) ? this.store.get(key)! : null; }
  setItem(key: string, value: string) { this.store.set(key, String(value)); }
  removeItem(key: string) { this.store.delete(key); }
  key(index: number) { return Array.from(this.store.keys())[index] ?? null; }
}
Object.defineProperty(window, 'localStorage', { value: new MemoryStorage(), writable: true });
Object.defineProperty(window, 'sessionStorage', { value: new MemoryStorage(), writable: true });
