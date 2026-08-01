"use client";

import { useEffect } from "react";
import { syncPendingDrafts } from "@/lib/offline/sync-drafts";
import { saveSalaryEntryAction } from "@/app/dashboard/actions";

/**
 * Triggers a sync on the browser "online" event (not the Background Sync
 * API — Safari doesn't support it) and once on mount if already online
 * (covers reopening the app with leftover drafts from a previous offline
 * session). Renders nothing; offline-drafts-banner.tsx reads the same
 * IndexedDB store to show progress/conflicts.
 */
export function OfflineSyncManager({ userId }: { userId: string }) {
  useEffect(() => {
    function sync() {
      void syncPendingDrafts(userId, saveSalaryEntryAction);
    }
    if (navigator.onLine) {
      sync();
    }
    window.addEventListener("online", sync);
    return () => window.removeEventListener("online", sync);
  }, [userId]);

  return null;
}
