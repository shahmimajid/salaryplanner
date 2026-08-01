"use client";

import { useEffect } from "react";
import { serwist } from "@/lib/pwa/serwist-client";

/**
 * Registers only in production — dev-mode SW registration is a classic
 * source of "why isn't my change showing up" confusion (stale caches
 * fighting live edits), and there's nothing here that needs testing
 * against `next dev` specifically. Renders nothing; update-available-
 * banner.tsx (mounted separately) listens on the same serwist singleton.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && serwist) {
      void serwist.register();
    }
  }, []);

  return null;
}
