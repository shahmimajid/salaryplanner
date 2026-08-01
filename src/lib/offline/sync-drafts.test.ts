import { describe, expect, it, vi, beforeEach } from "vitest";
import type { SalaryEntryFormValues } from "@/components/calculator/schema";

const VALID_VALUES: SalaryEntryFormValues = {
  payrollMonth: "2026-03",
  basicSalary: 5000,
  fixedAllowance: 0,
  weekendSupportPaymentMethod: "MANUAL_TOTAL",
  weekendSupportManualTotalAmount: 0,
  bonus: 0,
  commission: 0,
  otherTaxableIncome: 0,
  otherNonTaxableReimbursement: 0,
  epfAdjustment: 0,
  zakat: 0,
  previousCumulativeIncomeForYear: 0,
  previousCumulativePcbPaid: 0,
};

const listDrafts = vi.fn();
const deleteDraft = vi.fn();
const updateDraftStatus = vi.fn();
const checkPayrollMonthAvailability = vi.fn();

vi.mock("@/lib/offline/db", () => ({
  listDrafts: (...args: unknown[]) => listDrafts(...args),
  deleteDraft: (...args: unknown[]) => deleteDraft(...args),
  updateDraftStatus: (...args: unknown[]) => updateDraftStatus(...args),
}));

vi.mock("@/app/history/actions", () => ({
  checkPayrollMonthAvailability: (...args: unknown[]) => checkPayrollMonthAvailability(...args),
}));

const { syncPendingDrafts, overwriteDraft, discardDraft } = await import("./sync-drafts");

function draft(
  overrides: Partial<{
    localId: string;
    payrollMonth: string;
    status: "pending" | "syncing" | "error";
  }> = {},
) {
  return {
    localId: overrides.localId ?? "draft-1",
    userId: "user-1",
    values: { ...VALID_VALUES, payrollMonth: overrides.payrollMonth ?? "2026-03" },
    createdAt: Date.now(),
    status: overrides.status ?? "pending",
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("syncPendingDrafts", () => {
  it("syncs a draft whose month has no existing entry and deletes it", async () => {
    listDrafts.mockResolvedValueOnce([draft()]);
    checkPayrollMonthAvailability.mockResolvedValueOnce({ exists: false });
    const action = vi.fn().mockResolvedValue({ ok: true, salaryEntryId: "entry-1", data: {} });

    const result = await syncPendingDrafts("user-1", action);

    expect(action).toHaveBeenCalledWith(draft().values);
    expect(deleteDraft).toHaveBeenCalledWith("draft-1");
    expect(result).toEqual({ synced: 1, conflicted: 0, failed: 0 });
  });

  it("marks a draft as a conflict without auto-overwriting when the month already exists", async () => {
    listDrafts.mockResolvedValueOnce([draft()]);
    checkPayrollMonthAvailability.mockResolvedValueOnce({ exists: true, netSalary: "4000" });
    const action = vi.fn();

    const result = await syncPendingDrafts("user-1", action);

    expect(action).not.toHaveBeenCalled();
    expect(deleteDraft).not.toHaveBeenCalled();
    expect(updateDraftStatus).toHaveBeenCalledWith(
      "draft-1",
      "error",
      expect.stringContaining("already exists"),
    );
    expect(result).toEqual({ synced: 0, conflicted: 1, failed: 0 });
  });

  it("marks a draft as failed (not deleted) when the server action rejects it", async () => {
    listDrafts.mockResolvedValueOnce([draft()]);
    checkPayrollMonthAvailability.mockResolvedValueOnce({ exists: false });
    const action = vi.fn().mockResolvedValue({ ok: false, fieldErrors: {} });

    const result = await syncPendingDrafts("user-1", action);

    expect(deleteDraft).not.toHaveBeenCalled();
    expect(result).toEqual({ synced: 0, conflicted: 0, failed: 1 });
  });

  it("marks a draft as failed on a network error, without deleting it", async () => {
    listDrafts.mockResolvedValueOnce([draft()]);
    checkPayrollMonthAvailability.mockResolvedValueOnce({ exists: false });
    const action = vi.fn().mockRejectedValue(new Error("network down"));

    const result = await syncPendingDrafts("user-1", action);

    expect(deleteDraft).not.toHaveBeenCalled();
    expect(updateDraftStatus).toHaveBeenCalledWith(
      "draft-1",
      "error",
      expect.stringContaining("Network error"),
    );
    expect(result).toEqual({ synced: 0, conflicted: 0, failed: 1 });
  });

  it("skips a draft already mid-sync", async () => {
    listDrafts.mockResolvedValueOnce([draft({ status: "syncing" })]);
    const action = vi.fn();

    const result = await syncPendingDrafts("user-1", action);

    expect(action).not.toHaveBeenCalled();
    expect(checkPayrollMonthAvailability).not.toHaveBeenCalled();
    expect(result).toEqual({ synced: 0, conflicted: 0, failed: 0 });
  });
});

describe("overwriteDraft", () => {
  it("deletes the draft on success", async () => {
    const action = vi.fn().mockResolvedValue({ ok: true, salaryEntryId: "entry-1", data: {} });

    const ok = await overwriteDraft(draft(), action);

    expect(ok).toBe(true);
    expect(deleteDraft).toHaveBeenCalledWith("draft-1");
  });

  it("keeps the draft and marks it errored on failure", async () => {
    const action = vi.fn().mockResolvedValue({ ok: false, fieldErrors: {} });

    const ok = await overwriteDraft(draft(), action);

    expect(ok).toBe(false);
    expect(deleteDraft).not.toHaveBeenCalled();
    expect(updateDraftStatus).toHaveBeenCalled();
  });
});

describe("discardDraft", () => {
  it("deletes the draft", async () => {
    await discardDraft("draft-1");
    expect(deleteDraft).toHaveBeenCalledWith("draft-1");
  });
});
