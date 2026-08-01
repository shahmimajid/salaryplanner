import { describe, expect, it, vi, beforeEach } from "vitest";

const loadCalculationDetail = vi.fn();

vi.mock("@/lib/history/load-calculation-detail", () => ({
  loadCalculationDetail: (...args: unknown[]) => loadCalculationDetail(...args),
}));

const { compareSalaryEntries } = await import("./compare-salary-entries");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("compareSalaryEntries", () => {
  it("returns both details when both lookups succeed", async () => {
    loadCalculationDetail.mockResolvedValueOnce({ salaryEntryId: "a" });
    loadCalculationDetail.mockResolvedValueOnce({ salaryEntryId: "b" });

    const result = await compareSalaryEntries("user-1", "a", "b");

    expect(result).toEqual({
      a: { salaryEntryId: "a" },
      b: { salaryEntryId: "b" },
    });
  });

  it("returns null when either lookup fails (not found or not owned)", async () => {
    loadCalculationDetail.mockResolvedValueOnce(null);
    loadCalculationDetail.mockResolvedValueOnce({ salaryEntryId: "b" });

    const result = await compareSalaryEntries("user-1", "a", "b");

    expect(result).toBeNull();
  });
});
