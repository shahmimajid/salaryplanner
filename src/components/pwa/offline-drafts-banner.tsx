"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { listDrafts, type DraftSalaryEntry } from "@/lib/offline/db";
import { syncPendingDrafts, overwriteDraft, discardDraft } from "@/lib/offline/sync-drafts";
import { saveSalaryEntryAction } from "@/app/dashboard/actions";

/** Reads the same IndexedDB draft store offline-sync-manager.tsx writes to and syncs from. */
export function OfflineDraftsBanner({ userId }: { userId: string }) {
  const [drafts, setDrafts] = useState<DraftSalaryEntry[]>([]);

  const refresh = useCallback(() => {
    listDrafts(userId).then(setDrafts);
  }, [userId]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 3000);
    window.addEventListener("online", refresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener("online", refresh);
    };
  }, [refresh]);

  if (drafts.length === 0) return null;

  async function handleSyncNow() {
    await syncPendingDrafts(userId, saveSalaryEntryAction);
    refresh();
  }

  async function handleOverwrite(draft: DraftSalaryEntry) {
    await overwriteDraft(draft, saveSalaryEntryAction);
    refresh();
  }

  async function handleDiscard(localId: string) {
    await discardDraft(localId);
    refresh();
  }

  return (
    <div className="bg-muted/30 mb-4 grid gap-2 rounded-lg border p-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span>
          {drafts.length} calculation{drafts.length === 1 ? "" : "s"} saved offline, not yet
          synced.
        </span>
        <Button size="sm" variant="outline" onClick={handleSyncNow}>
          Sync now
        </Button>
      </div>
      {drafts.map((draft) => (
        <div
          key={draft.localId}
          className="flex items-center justify-between gap-2 border-t pt-2 text-xs"
        >
          <span>
            {draft.values.payrollMonth} —{" "}
            {draft.status === "error" ? draft.lastError : "Pending sync"}
          </span>
          {draft.status === "error" && draft.lastError?.includes("already exists") ? (
            <div className="flex gap-3">
              <button
                type="button"
                className="underline underline-offset-2"
                onClick={() => handleOverwrite(draft)}
              >
                Overwrite
              </button>
              <button
                type="button"
                className="underline underline-offset-2"
                onClick={() => handleDiscard(draft.localId)}
              >
                Discard
              </button>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
