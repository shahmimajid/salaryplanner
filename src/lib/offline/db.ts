import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { SalaryEntryFormValues } from "@/components/calculator/schema";

export interface DraftSalaryEntry {
  /** Client-generated (crypto.randomUUID()) — the record's key. */
  localId: string;
  /** Scopes drafts to the signed-in user; cleared on sign-out. */
  userId: string;
  values: SalaryEntryFormValues;
  createdAt: number;
  status: "pending" | "syncing" | "error";
  lastError?: string;
}

interface OfflineDraftsDB extends DBSchema {
  drafts: {
    key: string;
    value: DraftSalaryEntry;
    indexes: { "by-userId": string };
  };
}

let dbPromise: Promise<IDBPDatabase<OfflineDraftsDB>> | null = null;

function getDb(): Promise<IDBPDatabase<OfflineDraftsDB>> {
  if (typeof window === "undefined") {
    throw new Error("Offline drafts are client-only.");
  }
  if (!dbPromise) {
    dbPromise = openDB<OfflineDraftsDB>("salaryplanner-offline", 1, {
      upgrade(db) {
        const store = db.createObjectStore("drafts", { keyPath: "localId" });
        store.createIndex("by-userId", "userId");
      },
    });
  }
  return dbPromise;
}

export async function saveDraft(draft: DraftSalaryEntry): Promise<void> {
  const db = await getDb();
  await db.put("drafts", draft);
}

export async function listDrafts(userId: string): Promise<DraftSalaryEntry[]> {
  const db = await getDb();
  return db.getAllFromIndex("drafts", "by-userId", userId);
}

export async function deleteDraft(localId: string): Promise<void> {
  const db = await getDb();
  await db.delete("drafts", localId);
}

export async function updateDraftStatus(
  localId: string,
  status: DraftSalaryEntry["status"],
  lastError?: string,
): Promise<void> {
  const db = await getDb();
  const draft = await db.get("drafts", localId);
  if (!draft) return;
  await db.put("drafts", { ...draft, status, lastError });
}

/** Sign-out hygiene — a shared device must not retain another user's offline drafts. */
export async function clearDraftsForUser(userId: string): Promise<void> {
  const db = await getDb();
  const tx = db.transaction("drafts", "readwrite");
  let cursor = await tx.store.index("by-userId").openCursor(userId);
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
}
