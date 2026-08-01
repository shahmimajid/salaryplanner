import { listDrafts, deleteDraft, updateDraftStatus, type DraftSalaryEntry } from "@/lib/offline/db";
import { checkPayrollMonthAvailability } from "@/app/history/actions";
import type { SalaryEntryFormValues } from "@/components/calculator/schema";
import type { SalaryFormActionResult } from "@/components/calculator/salary-entry-form";

export type SyncAction = (values: SalaryEntryFormValues) => Promise<SalaryFormActionResult>;

export interface SyncDraftsResult {
  synced: number;
  conflicted: number;
  failed: number;
}

/**
 * Syncs every pending draft for a user. Before each one, checks whether its
 * target month now has a saved entry (e.g. saved from another device while
 * offline) — if so, treats it as a conflict requiring explicit user
 * resolution (overwriteDraft/discardDraft below) rather than silently
 * overwriting, since the user wasn't watching when the conflict arose.
 * Drafts with no existing entry for their month sync automatically.
 */
export async function syncPendingDrafts(
  userId: string,
  action: SyncAction,
): Promise<SyncDraftsResult> {
  const drafts = await listDrafts(userId);
  let synced = 0;
  let conflicted = 0;
  let failed = 0;

  for (const draft of drafts) {
    if (draft.status === "syncing") continue;

    const availability = await checkPayrollMonthAvailability(draft.values.payrollMonth);
    if (availability.exists) {
      await updateDraftStatus(
        draft.localId,
        "error",
        "A calculation already exists for this month.",
      );
      conflicted++;
      continue;
    }

    await updateDraftStatus(draft.localId, "syncing");
    try {
      const result = await action(draft.values);
      if (result.ok) {
        await deleteDraft(draft.localId);
        synced++;
      } else {
        await updateDraftStatus(draft.localId, "error", "Couldn't save — check the entry and resave.");
        failed++;
      }
    } catch {
      // Network error — no in-process retry loop; picked up again on the
      // next "online" event instead, avoiding a background timer that'd
      // keep running while the tab is backgrounded or closed.
      await updateDraftStatus(draft.localId, "error", "Network error — will retry when back online.");
      failed++;
    }
  }

  return { synced, conflicted, failed };
}

/** User explicitly chose "Overwrite" on a conflicted draft. */
export async function overwriteDraft(draft: DraftSalaryEntry, action: SyncAction): Promise<boolean> {
  const result = await action(draft.values);
  if (result.ok) {
    await deleteDraft(draft.localId);
    return true;
  }
  await updateDraftStatus(draft.localId, "error", "Couldn't save — check the entry and resave.");
  return false;
}

/** User explicitly chose "Discard" on a conflicted (or otherwise errored) draft. */
export async function discardDraft(localId: string): Promise<void> {
  await deleteDraft(localId);
}
