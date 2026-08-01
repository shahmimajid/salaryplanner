"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { serwist } from "@/lib/pwa/serwist-client";

/**
 * Listens on the same serwist singleton service-worker-registration.tsx
 * registers — a new version enters the "waiting" state (never
 * auto-activated, see src/sw.ts's skipWaiting: false) until the user
 * confirms here, so an in-progress session is never yanked out from
 * under them.
 */
export function UpdateAvailableBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!serwist) return;
    serwist.addEventListener("waiting", () => setVisible(true));
    serwist.addEventListener("controlling", () => window.location.reload());
  }, []);

  if (!visible) return null;

  return (
    <div className="bg-primary text-primary-foreground flex items-center justify-center gap-4 px-4 py-2 text-sm">
      <span>A new version is available.</span>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => serwist?.messageSkipWaiting()}
      >
        Reload
      </Button>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="underline underline-offset-2"
      >
        Later
      </button>
    </div>
  );
}
