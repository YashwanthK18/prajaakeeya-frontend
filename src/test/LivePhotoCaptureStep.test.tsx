// Tests for LivePhotoCaptureStep — the selfie-capture step. It can run in three
// states: the initial "choose a method" view, the live-camera view, and the
// captured-photo / uploaded view. These tests focus on the initial view plus
// the captured-photo view, which render meaningfully in jsdom.
//
// Setup notes:
//  - react-i18next is mocked so t() returns the key (or its defaultValue).
//  - mediaService is mocked (uploadAspirantDocument / uploadProfilePicture) so
//    no network requests fire from the auto-upload effect.
//  - navigator.mediaDevices.getUserMedia and canvas getContext are stubbed since
//    jsdom has no real webcam; the component touches them in some branches.

import { renderWithProviders, screen } from './test-utils';
import { createRef } from 'react';
import LivePhotoCaptureStep from '../components/aspirant/LivePhotoCaptureStep';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string, o?: any) => (o && o.defaultValue ? o.defaultValue : k),
    i18n: { language: 'en', changeLanguage: () => Promise.resolve() },
  }),
  Trans: ({ children }: any) => children,
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

// Upload functions are mocked so the auto-upload effect never hits the network.
vi.mock('../services/mediaService', () => ({
  uploadAspirantDocument: vi.fn(() => Promise.resolve({ url: 'x' })),
  uploadProfilePicture: vi.fn(() => Promise.resolve({ url: 'x' })),
}));

// Stub the webcam API (jsdom has none). configurable so afterEach cleanup is fine.
Object.defineProperty(navigator, 'mediaDevices', {
  value: { getUserMedia: vi.fn(() => Promise.resolve({ getTracks: () => [] })) },
  configurable: true,
});
// Some draw paths touch canvas — give it a no-op 2d context.
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  drawImage: vi.fn(),
})) as any;

const makeProps = (overrides: Partial<any> = {}) => ({
  cameraActive: false,
  capturedPhoto: null,
  loading: false,
  videoRef: createRef<HTMLVideoElement>(),
  canvasRef: createRef<HTMLCanvasElement>(),
  stopCamera: vi.fn(),
  capturePhoto: vi.fn(),
  retakePhoto: vi.fn(),
  handleConfirmSelfie: vi.fn(),
  onBack: vi.fn(),
  startCamera: vi.fn(),
  ...overrides,
});

describe('LivePhotoCaptureStep', () => {
  it('renders the live-photo title and subtitle', () => {
    renderWithProviders(<LivePhotoCaptureStep {...makeProps()} />);
    expect(
      screen.getByText('forms.aspirant.livePhoto.title'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('forms.aspirant.livePhoto.subtitle'),
    ).toBeInTheDocument();
  });

  it('shows Take Photo and Upload From File buttons in the initial state', () => {
    renderWithProviders(<LivePhotoCaptureStep {...makeProps()} />);
    // startCamera is provided -> the "Take Photo" button renders.
    expect(
      screen.getByRole('button', { name: /forms.aspirant.livePhoto.takePhoto/ }),
    ).toBeInTheDocument();
    // Upload-from-file button has defaultValue 'Upload From File'.
    expect(
      screen.getByRole('button', { name: 'Upload From File' }),
    ).toBeInTheDocument();
  });

  it('shows the instructions alert text in the initial state', () => {
    renderWithProviders(<LivePhotoCaptureStep {...makeProps()} />);
    expect(
      screen.getByText('forms.aspirant.livePhoto.instructions'),
    ).toBeInTheDocument();
  });

  it('shows the captured photo preview and retake/upload controls when a photo exists', () => {
    renderWithProviders(
      <LivePhotoCaptureStep
        {...makeProps({ capturedPhoto: 'data:image/png;base64,AAAA' })}
      />,
    );
    // The captured-photo branch renders an <img alt="Captured" />.
    expect(screen.getByAltText('Captured')).toBeInTheDocument();
    // Retake button appears (key echoed by our t() mock).
    expect(
      screen.getByRole('button', { name: /forms.aspirant.livePhoto.retake/ }),
    ).toBeInTheDocument();
  });

  it('shows the success / uploaded indicator once a captured photo is present', () => {
    // The success-image block (`alt="Uploaded"`) requires both a captured photo
    // and uploadStatus 'success'. On a fresh mount the `capturedPhoto` effect
    // resets status to 'idle' when no photo is set, so the alreadyUploaded-only
    // path can't surface the success image. Instead, drive it through the
    // captured-photo branch: passing alreadyUploaded keeps uploadTriggeredRef
    // true so the auto-upload effect doesn't re-fire, and uploadStatus stays
    // 'success', rendering the "Uploaded!" indicator text.
    renderWithProviders(
      <LivePhotoCaptureStep
        {...makeProps({
          alreadyUploaded: true,
          capturedPhoto: 'data:image/png;base64,AAAA',
        })}
      />,
    );
    // The captured-photo preview image is shown.
    expect(screen.getByAltText('Captured')).toBeInTheDocument();
    // And the "Uploaded!" success text (key/fallback) appears.
    expect(screen.getByText('common.uploaded')).toBeInTheDocument();
  });
});
