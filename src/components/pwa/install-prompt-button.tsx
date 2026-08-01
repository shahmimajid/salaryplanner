"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isIosSafariStandaloneCapable(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return /iPhone|iPad|iPod/.test(navigator.userAgent) && nav.standalone !== true;
}

/**
 * beforeinstallprompt only fires on Chromium/Edge — there's no equivalent
 * event on iOS Safari, which instead needs a manual "Add to Home Screen"
 * instructional banner (a coarse UA check, acceptable for a non-critical
 * hint rather than a functional gate).
 */
export function InstallPromptButton() {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosHint] = useState(
    () => typeof window !== "undefined" && isIosSafariStandaloneCapable(),
  );
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    function handler(event: Event) {
      event.preventDefault();
      setDeferredEvent(event as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (dismissed) return null;

  if (deferredEvent) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={async () => {
          await deferredEvent.prompt();
          await deferredEvent.userChoice;
          setDeferredEvent(null);
        }}
      >
        Install app
      </Button>
    );
  }

  if (iosHint) {
    return (
      <div className="bg-muted/40 flex items-center gap-3 rounded-md border px-3 py-1.5 text-xs">
        <span>Add to your home screen: Share → Add to Home Screen.</span>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="underline underline-offset-2"
        >
          Dismiss
        </button>
      </div>
    );
  }

  return null;
}
