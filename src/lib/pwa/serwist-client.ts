import { Serwist } from "@serwist/window";

// Module singleton, not one instance per component — service-worker-
// registration.tsx registers it once; update-available-banner.tsx listens
// on the same instance for "waiting"/"controlling" events. Served at
// /serwist/sw.js (src/app/serwist/[path]/route.ts), which sets
// Service-Worker-Allowed: / so scope: "/" can still control the whole site
// despite the non-root registration URL.
export const serwist =
  typeof window !== "undefined" && "serviceWorker" in navigator
    ? new Serwist("/serwist/sw.js", { scope: "/", type: "classic" })
    : null;
