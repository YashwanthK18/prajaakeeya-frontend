/* Firebase Cloud Messaging service worker — handles BACKGROUND web push.
 *
 * The (public, non-secret) Firebase config is passed via the registration query
 * string from pushNotifications.ts, so it lives in one place (the app env) and
 * isn't duplicated here. This SW is registered at the dedicated FCM scope
 * (/firebase-cloud-messaging-push-scope) so it coexists with the PWA service
 * worker that controls "/".
 */
/* eslint-disable no-undef */
importScripts(
  "https://www.gstatic.com/firebasejs/12.14.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/12.14.0/firebase-messaging-compat.js",
);

const params = new URLSearchParams(self.location.search);
const firebaseConfig = {
  apiKey: params.get("apiKey"),
  authDomain: params.get("authDomain"),
  projectId: params.get("projectId"),
  storageBucket: params.get("storageBucket"),
  messagingSenderId: params.get("messagingSenderId"),
  appId: params.get("appId"),
};

if (
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.messagingSenderId &&
  firebaseConfig.appId
) {
  firebase.initializeApp(firebaseConfig);
  // Initialising messaging() installs FCM's default background handler, which
  // auto-displays `notification` / `webpush.notification` payloads. We do NOT
  // register onBackgroundMessage — that would duplicate the auto-shown banner.
  firebase.messaging();
}

// Activate a new version of this SW immediately instead of waiting for every
// tab to close — so push/click fixes reach devices on the next visit, not days
// later. (This SW lives at its own scope and controls no pages, so claiming is
// harmless.)
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

// ─── TEMPORARY DEBUG — remove once push payloads are confirmed ───────────────
// Logs the RAW push payload exactly as the backend sent it (notification + data
// blocks), so we can see whether the routing ids (type/aspirantId/electionId)
// are present. View in DevTools → Application → Service Workers → "inspect" on
// firebase-messaging-sw.js → Console.
self.addEventListener("push", (event) => {
  try {
    console.log("[push DEBUG] raw payload:", event.data ? event.data.json() : null);
  } catch (e) {
    console.log("[push DEBUG] payload (text):", event.data && event.data.text());
  }
});
// ─────────────────────────────────────────────────────────────────────────────

// Resolve the in-app deep link from the push payload. The backend sends it as a
// RELATIVE path in data.link; FCM may nest the original data under FCM_MSG when
// it auto-displays the notification, so unwrap that. Falls back to the signed-in
// dashboard so a tap always lands somewhere useful.
function notificationLink(data) {
  data = data || {};
  if (data.FCM_MSG && data.FCM_MSG.data) {
    data = { ...data, ...data.FCM_MSG.data };
  }
  return data.link || "/user/dashboard";
}

// Own the notification tap. We navigate explicitly here (rather than relying on
// the Firebase SDK's built-in fcm_options.link handler, which did not fire) and
// we do NOT set fcm_options.link on the backend, so there is exactly one
// handler — no double-open. openWindow opens the deep link reliably across
// Chrome / Firefox / Android TWA; if a tab is already on the target, we focus it.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = (event.notification && event.notification.data) || {};
  const path = notificationLink(data);
  const targetUrl = new URL(path, self.location.origin).href;
  console.log("[push DEBUG] notificationclick →", targetUrl, "data:", data);

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of clientList) {
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })(),
  );
});
