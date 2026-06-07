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

// Activate a new version of this SW immediately instead of waiting for every tab
// to close — so push/click fixes reach devices on the next visit, not days later.
// (This SW lives at its own scope and controls no pages, so claiming is harmless.)
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

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

// Stash the pending deep-link route in the Cache API. The PAGE reads this when
// it (re)gains focus — see consumePendingPushRoute() in pushNotifications.ts.
// Why a stash instead of just postMessage: a page launched via clients.openWindow
// loads UNCONTROLLED, and Client.postMessage() to it is NOT reliably delivered
// (even with startMessages()). The Cache API is shared between SW and page, so a
// pulled route survives regardless of controller / message-queue state.
const PENDING_ROUTE_CACHE = "push-pending-route";
const PENDING_ROUTE_KEY = "/__pending_push_route";

async function stashPendingRoute(route) {
  try {
    const cache = await caches.open(PENDING_ROUTE_CACHE);
    await cache.put(
      PENDING_ROUTE_KEY,
      new Response(JSON.stringify({ route: route, ts: Date.now() }), {
        headers: { "Content-Type": "application/json" },
      }),
    );
  } catch (e) {
    /* best-effort */
  }
}

// Own the notification tap.
//
// CRITICAL ORDERING: this listener is registered BEFORE firebase.messaging()
// (the init block is at the BOTTOM of this file). The FCM compat SDK installs
// its OWN notificationclick handler when messaging() runs, which calls
// stopImmediatePropagation() and can pre-empt a handler registered after it.
// Registering ours first AND calling stopImmediatePropagation() guarantees
// exactly one handler — ours.
//
// Navigation is driven by a STASHED route (Cache API) that the page consumes on
// focus — reliable for a TWA and for openWindow-launched (uncontrolled) pages,
// where neither postMessage nor openWindow-to-an-already-open-app is dependable
// (svgomg-twa#94, firebase-js-sdk#2438, crbug 1052288/1076039). postMessage is
// kept ONLY as a fast-path trigger; the stash is the source of truth.
//   - app already open → stash + focus (+ postMessage nudge); page pulls route.
//   - app closed       → stash + openWindow(targetUrl) (URL also carries route).
self.addEventListener("notificationclick", (event) => {
  event.stopImmediatePropagation();
  event.notification.close();

  const data = (event.notification && event.notification.data) || {};
  const targetUrl = new URL(notificationLink(data), self.location.origin).href;
  const targetPath = new URL(targetUrl).pathname;
  // Relative route (path + query + hash) the in-app React Router understands.
  const targetRoute = (() => {
    const u = new URL(targetUrl);
    return u.pathname + u.search + u.hash;
  })();
  event.waitUntil(
    (async () => {
      // Stash FIRST so the route is available the moment the page gains focus.
      await stashPendingRoute(targetRoute);

      let clientList = [];
      try {
        clientList = await self.clients.matchAll({
          type: "window",
          includeUncontrolled: true,
        });
      } catch (e) {
        clientList = [];
      }

      // Same-origin window clients only (never focus/message a cross-origin one).
      const sameOrigin = clientList.filter((c) => {
        try {
          return new URL(c.url).origin === self.location.origin;
        } catch (e) {
          return false;
        }
      });

      // App already open → bring it to the foreground. Prefer a tab already on
      // the target page. The page then pulls the stashed route on focus and
      // navigates in-SPA (stays inside the TWA — never an external Chrome tab).
      if (sameOrigin.length > 0) {
        const exact = sameOrigin.find((c) => {
          try {
            return new URL(c.url).pathname === targetPath;
          } catch (e) {
            return false;
          }
        });
        const client = exact || sameOrigin[0];
        try {
          if ("focus" in client) await client.focus();
        } catch (e) {
          /* focus is best-effort */
        }
        // Fast-path nudge (when the page IS controlled and listening).
        try {
          client.postMessage({ type: "PUSH_NAVIGATE", url: targetRoute });
        } catch (e) {
          /* the stash + focus covers delivery either way */
        }
        return undefined;
      }

      // App closed → cold-start at the deep link (URL carries the route; the
      // stash is consumed on mount as a no-op safety net).
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    })(),
  );
});

// Initialise Firebase Messaging AFTER the notificationclick handler above is
// wired, so the FCM SDK's built-in handler can't pre-empt ours. messaging()
// installs FCM's default background push handler, which auto-displays the
// `notification` / `webpush.notification` payload — we rely on that for display.
if (
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.messagingSenderId &&
  firebaseConfig.appId
) {
  firebase.initializeApp(firebaseConfig);
  firebase.messaging();
}
