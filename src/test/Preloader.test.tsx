// Tests for Preloader: renders null but, on mount, injects up to 32 particle
// <div>s into the #pl-particles container that lives in index.html. Also exports
// a dismissPreloader() helper that removes the #preloader element.
import { render } from './test-utils';
import Preloader, { dismissPreloader } from '../components/Preloader';

describe('Preloader', () => {
  beforeEach(() => {
    // Recreate the host DOM nodes Preloader expects (normally from index.html).
    document.body.innerHTML =
      '<div id="preloader"><div id="pl-particles"></div></div>';
    // Ensure non-ReactNative userAgent so the particle path runs.
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (jsdom)',
      configurable: true,
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders nothing itself (returns null)', () => {
    const { container } = render(<Preloader />);
    // The component's own render output is empty.
    expect(container).toBeEmptyDOMElement();
  });

  it('populates the #pl-particles container with particle divs on mount', () => {
    render(<Preloader />);
    const particles = document.querySelectorAll('#pl-particles .pl-particle');
    expect(particles.length).toBe(32);
  });

  it('does not duplicate particles if the container is already populated', () => {
    const container = document.getElementById('pl-particles')!;
    const existing = document.createElement('div');
    existing.className = 'pl-particle';
    container.appendChild(existing);

    render(<Preloader />);
    // Should bail out early, leaving just the one pre-existing particle.
    expect(container.querySelectorAll('.pl-particle').length).toBe(1);
  });

  it('removes the #preloader element entirely in a ReactNative WebView', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'MyApp ReactNative/1.0',
      configurable: true,
    });
    render(<Preloader />);
    expect(document.getElementById('preloader')).toBeNull();
  });

  describe('dismissPreloader', () => {
    it('adds the exit class and then removes the preloader', () => {
      vi.useFakeTimers();
      try {
        dismissPreloader();
        const el = document.getElementById('preloader');
        expect(el).not.toBeNull();
        expect(el!.classList.contains('exit')).toBe(true);

        // After the 750ms timeout the element is removed from the DOM.
        vi.advanceTimersByTime(750);
        expect(document.getElementById('preloader')).toBeNull();
      } finally {
        vi.useRealTimers();
      }
    });

    it('is a no-op when there is no preloader element', () => {
      document.body.innerHTML = '';
      // Should not throw when the element is absent.
      expect(() => dismissPreloader()).not.toThrow();
    });
  });
});
