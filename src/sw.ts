/// <reference lib="esnext" />
/// <reference lib="webworker" />
import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from "serwist";
import { CacheFirst, NetworkFirst, NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// Security-sensitive: explicit per-route-class rules, not Serwist's
// generic defaults, so auth/mutation traffic is never opportunistically
// cached and authenticated pages never risk leaking one user's data to
// another on a shared device. Array order is match priority — first match
// wins; anything matching nothing here just passes straight to the
// network, uncached.
const runtimeCaching: RuntimeCaching[] = [
  // Auth endpoints, Server Action POSTs (matched by method below), and
  // export downloads must never be cached — spec's own hard requirement.
  {
    matcher: ({ url }) =>
      url.pathname.startsWith("/api/auth") || url.pathname.startsWith("/api/export"),
    handler: new NetworkOnly(),
  },
  // Authenticated HTML — network-first, no implicit full-page caching.
  // Server Action POSTs to these same URLs fall through unmatched (method
  // scoped to GET) and go straight to the network, never touching a cache.
  {
    matcher: ({ url, request }) =>
      request.method === "GET" &&
      (url.pathname.startsWith("/dashboard") || url.pathname.startsWith("/history")),
    handler: new NetworkFirst({ cacheName: "authenticated-pages" }),
  },
  // Local mode (no account, nothing per-user) — network-first with a
  // cache fallback so it still opens offline.
  {
    matcher: ({ url, request }) => request.method === "GET" && url.pathname === "/",
    handler: new NetworkFirst({ cacheName: "local-mode" }),
  },
  // Static assets — safe to cache-first, hashed/immutable filenames.
  {
    matcher: ({ request }) =>
      ["style", "script", "image", "font"].includes(request.destination),
    handler: new CacheFirst({ cacheName: "static-assets" }),
  },
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  // Not auto-activated — an update sits in the "waiting" state until the
  // user confirms via the update-available banner's SKIP_WAITING message,
  // so an in-progress session is never yanked out from under them.
  skipWaiting: false,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
});

serwist.addEventListeners();

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
