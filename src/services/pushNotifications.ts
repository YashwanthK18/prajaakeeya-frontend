import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getMessaging,
  getToken,
  deleteToken,
  onMessage,
  isSupported,
  type Messaging,
} from 'firebase/messaging';
import {
  registerDeviceToken,
  unregisterDeviceToken,
  emitNotificationsChanged,
} from './notificationService';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};
const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;

/** Push is only wired when the Firebase env is fully configured. */
const isConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId &&
    vapidKey,
);

const FCM_SW_SCOPE = '/firebase-cloud-messaging-push-scope';

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;
let currentToken: string | null = null;
let foregroundWired = false;

function getApp(): FirebaseApp {
  if (!app) app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig as Record<string, string>);
  return app;
}

/** Register the dedicated FCM service worker, passing the config via query params. */
async function registerSw(): Promise<ServiceWorkerRegistration> {
  const qs = new URLSearchParams({
    apiKey: firebaseConfig.apiKey ?? '',
    authDomain: firebaseConfig.authDomain ?? '',
    projectId: firebaseConfig.projectId ?? '',
    storageBucket: firebaseConfig.storageBucket ?? '',
    messagingSenderId: firebaseConfig.messagingSenderId ?? '',
    appId: firebaseConfig.appId ?? '',
  }).toString();
  return navigator.serviceWorker.register(`/firebase-messaging-sw.js?${qs}`, {
    scope: FCM_SW_SCOPE,
  });
}

function detectPlatform(): string {
  const ua = navigator.userAgent || '';
  const os = /android/i.test(ua)
    ? 'android'
    : /iphone|ipad|ipod/i.test(ua)
      ? 'ios'
      : 'web';
  const standalone =
    window.matchMedia?.('(display-mode: standalone)')?.matches ||
    (navigator as unknown as { standalone?: boolean }).standalone;
  return standalone ? `pwa-${os}` : os;
}

/**
 * True only where web push actually works. This automatically excludes iOS
 * Safari tabs and iOS Chrome (no Push API) — on iOS, isSupported() returns true
 * only inside an installed PWA (Add to Home Screen, iOS 16.4+).
 */
export async function isPushSupported(): Promise<boolean> {
  if (!isConfigured) return false;
  if (typeof window === 'undefined') return false;
  if (!('serviceWorker' in navigator) || !('Notification' in window)) return false;
  try {
    return await isSupported();
  } catch {
    return false;
  }
}

/**
 * Idempotently set up push for the signed-in user: obtain an FCM token,
 * register it with the backend, and wire the foreground handler. Only prompts
 * for permission when `promptIfDefault` is true (and only from a user gesture).
 * No-ops when push is unsupported / unconfigured. Safe to call repeatedly.
 */
export async function initPushNotifications(
  options: { promptIfDefault?: boolean } = {},
): Promise<void> {
  const { promptIfDefault = false } = options;
  if (!(await isPushSupported())) return;
  if (Notification.permission === 'denied') return;
  if (Notification.permission === 'default') {
    if (!promptIfDefault) return;
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return;
  }

  try {
    const registration = await registerSw();
    messaging = getMessaging(getApp());
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });
    if (!token) return;
    currentToken = token;
    await registerDeviceToken(token, detectPlatform());

    if (!foregroundWired) {
      foregroundWired = true;
      onMessage(messaging, (payload) => {
        // App is in the foreground: the OS won't show a banner automatically.
        emitNotificationsChanged(); // refresh the in-app bell
        if (payload.notification) {
          void registration.showNotification(
            payload.notification.title || 'Prajaakeeya',
            {
              body: payload.notification.body || '',
              icon: '/images/android-chrome-192x192.png',
              data: payload.data || {},
            },
          );
        }
      });
    }
  } catch (err) {
    // Best-effort; never break the app over notifications.
    console.warn('[push] init failed', err);
  }
}

/** Prompt the user (call from a click handler / "Enable notifications" button). */
export function enablePushNotifications(): Promise<void> {
  return initPushNotifications({ promptIfDefault: true });
}

/**
 * Wire push for an authenticated user:
 *  - register silently if permission was already granted;
 *  - otherwise arm a ONE-TIME prompt on the next user gesture (browsers, and
 *    especially iOS, require a gesture to show the permission dialog).
 * Returns a cleanup function for use in a React effect.
 */
export function setupPushForUser(): () => void {
  if (!isConfigured || typeof window === 'undefined') return () => {};

  void initPushNotifications({ promptIfDefault: false });

  if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
    const handler = () => {
      cleanup();
      void initPushNotifications({ promptIfDefault: true });
    };
    const cleanup = () => {
      window.removeEventListener('pointerdown', handler);
      window.removeEventListener('keydown', handler);
    };
    window.addEventListener('pointerdown', handler, { once: true });
    window.addEventListener('keydown', handler, { once: true });
    return cleanup;
  }
  return () => {};
}

/** Best-effort teardown on logout: remove the token server-side and locally. */
export async function disablePushNotifications(): Promise<void> {
  const token = currentToken;
  try {
    if (token) await unregisterDeviceToken(token).catch(() => undefined);
    if (messaging && token) await deleteToken(messaging).catch(() => undefined);
  } catch {
    /* ignore */
  } finally {
    currentToken = null;
  }
}
