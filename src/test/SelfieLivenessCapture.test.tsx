// Tests for SelfieLivenessCapture: a webcam selfie capture widget.
//
// This component is browser/webcam-heavy. jsdom has no real camera or canvas,
// so we stub the pieces it touches INSIDE this file (rule 10):
//   - navigator.mediaDevices.getUserMedia -> resolves a fake MediaStream
//   - HTMLMediaElement.prototype.play     -> resolves (jsdom throws otherwise)
//   - HTMLCanvasElement.prototype.getContext / toBlob -> drawImage + a fake blob
//
// With those in place the component's auto-start effect reaches status 'ready'
// and enables the Capture button, letting us exercise the capture path.

import { renderWithProviders, screen, waitFor, fireEvent } from './test-utils';
import SelfieLivenessCapture from '../components/SelfieLivenessCapture';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string, o?: any) => (o && o.defaultValue ? o.defaultValue : k),
    i18n: { language: 'en', changeLanguage: () => Promise.resolve() },
  }),
  Trans: ({ children }: any) => children,
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

// A fake media track + stream so getUserMedia / cleanup don't blow up.
const makeFakeStream = () => ({
  getTracks: () => [{ stop: vi.fn() }],
});

beforeEach(() => {
  // 1) Webcam: getUserMedia resolves a fake stream.
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: vi.fn(() => Promise.resolve(makeFakeStream())) },
  });

  // 2) jsdom doesn't implement HTMLMediaElement.play(); stub it to resolve so
  //    the component's `await video.play()` succeeds and it flips to 'ready'.
  Object.defineProperty(HTMLMediaElement.prototype, 'play', {
    configurable: true,
    writable: true,
    value: vi.fn(() => Promise.resolve()),
  });

  // 3) Canvas: getContext returns a stub exposing drawImage; toBlob hands back a
  //    fake Blob so handleCapture can build a File and call onCaptured.
  HTMLCanvasElement.prototype.getContext = vi.fn(
    () => ({ drawImage: vi.fn() }),
  ) as any;
  HTMLCanvasElement.prototype.toBlob = vi.fn(function (
    this: HTMLCanvasElement,
    cb: BlobCallback,
  ) {
    cb(new Blob(['x'], { type: 'image/jpeg' }));
  }) as any;
});

describe('SelfieLivenessCapture', () => {
  it('renders the capture button', () => {
    renderWithProviders(<SelfieLivenessCapture onCaptured={vi.fn()} />);
    // The capture button shows the "Capture Selfie" label (default value).
    expect(
      screen.getByRole('button', { name: /Capture Selfie/i }),
    ).toBeInTheDocument();
  });

  it('requests the camera on mount', async () => {
    renderWithProviders(<SelfieLivenessCapture onCaptured={vi.fn()} />);
    await waitFor(() =>
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled(),
    );
  });

  it('enables the capture button once the camera is ready', async () => {
    renderWithProviders(<SelfieLivenessCapture onCaptured={vi.fn()} />);
    // Starts disabled (status 'camera-loading'); becomes enabled at 'ready'.
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /Capture Selfie/i }),
      ).toBeEnabled(),
    );
  });

  it('calls onCaptured with a JPEG File when capture is clicked', async () => {
    const onCaptured = vi.fn();
    renderWithProviders(<SelfieLivenessCapture onCaptured={onCaptured} />);

    const captureBtn = await screen.findByRole('button', {
      name: /Capture Selfie/i,
    });
    await waitFor(() => expect(captureBtn).toBeEnabled());

    fireEvent.click(captureBtn);

    await waitFor(() => expect(onCaptured).toHaveBeenCalledTimes(1));
    const file = onCaptured.mock.calls[0][0];
    expect(file).toBeInstanceOf(File);
    expect(file.type).toBe('image/jpeg');
  });
});
