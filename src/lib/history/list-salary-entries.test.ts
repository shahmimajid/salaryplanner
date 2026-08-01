import { describe, expect, it } from "vitest";
import { filterEntriesByYear, listAvailableYears, type SalaryEntrySummary } from "./list-salary-entries";

function entry(payrollMonth: string): SalaryEntrySummary {
  return {
    id: payrollMonth,
    payrollMonth,
    grossSalary: "0.00",
    netSalary: "0.00",
    calculatedAt: new Date(),
  };
}

const ENTRIES = [entry("2026-03"), entry("2026-01"), entry("2025-12"), entry("2024-06")];

describe("filterEntriesByYear", () => {
  it("returns only entries within the given year", () => {
    expect(filterEntriesByYear(ENTRIES, 2026).map((e) => e.payrollMonth)).toEqual([
      "2026-03",
      "2026-01",
    ]);
  });

  it("returns an empty array for a year with no entries", () => {
    expect(filterEntriesByYear(ENTRIES, 2020)).toEqual([]);
  });
});

describe("listAvailableYears", () => {
  it("returns distinct years sorted descending", () => {
    expect(listAvailableYears(ENTRIES)).toEqual([2026, 2025, 2024]);
  });

  it("returns an empty array for no entries", () => {
    expect(listAvailableYears([])).toEqual([]);
  });
});
