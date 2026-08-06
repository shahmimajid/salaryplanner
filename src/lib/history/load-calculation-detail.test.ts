import { describe, expect, it, vi, beforeEach } from "vitest";
import Decimal from "decimal.js";

const salaryEntryFindFirst = vi.fn();
const payrollProfileFindUniqueOrThrow = vi.fn();
const resolveConfigById = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    salaryEntry: { findFirst: (...args: unknown[]) => salaryEntryFindFirst(...args) },
    payrollProfile: { findUniqueOrThrow: (...args: unknown[]) => payrollProfileFindUniqueOrThrow(...args) },
  },
}));

vi.mock("@/lib/payroll/config/resolve-config", () => ({
  resolveConfigById: (...args: unknown[]) => resolveConfigById(...args),
}));

const { loadCalculationDetail } = await import("./load-calculation-detail");

function d(n: number) {
  return new Decimal(n);
}

const CONFIG_SNAPSHOT = {
  id: "config-1",
  version: "test-1",
  effectiveFrom: "2026-01-01",
  effectiveTo: null,
  epfRates: [
    { citizenshipStatus: "CITIZEN", minAge: null, maxAge: 59, employeeRatePercent: d(11), employerRatePercent: d(13) },
  ],
  epfWageBands: [],
  socsoRates: [
    { category: "CATEGORY_1", wageFrom: d(0), wageTo: d(6000), employeeContribution: d(39.75), employerContribution: d(139.25) },
  ],
  eisRates: [{ wageFrom: d(0), wageTo: d(6000), employeeContribution: d(39.5), employerContribution: d(39.5) }],
  taxBrackets: [
    { residencyStatus: "RESIDENT", chargeableIncomeFrom: d(0), chargeableIncomeTo: null, ratePercent: d(0), cumulativeTaxBase: d(0) },
  ],
  taxReliefs: [{ code: "SELF", label: "Individual relief", maxAmount: d(9000) }],
  taxRebates: [],
};

const LIVE_PROFILE_ROW = {
  citizenshipStatus: "CITIZEN",
  isBelow60: true,
  residencyStatus: "RESIDENT",
  maritalStatus: "SINGLE",
  spouseHasIncome: false,
  numberOfChildren: 0,
  childReliefClaims: [],
  epfEmployeeRatePercent: d(999), // deliberately different from the pinned snapshot below
  lindung24JamOptIn: false,
  zakatEnabled: false,
  claimsSocsoRelief: false,
};

const PINNED_PROFILE_SNAPSHOT = {
  citizenshipStatus: "CITIZEN",
  isBelow60: true,
  residencyStatus: "RESIDENT",
  maritalStatus: "SINGLE",
  spouseHasIncome: false,
  numberOfChildren: 0,
  childReliefClaims: [],
  epfEmployeeRatePercent: "11", // stored as a string, per toStoredProfileSnapshotJson
  lindung24JamOptIn: false,
  zakatEnabled: false,
  claimsSocsoRelief: false,
};

function entryRow(profileSnapshot: unknown) {
  return {
    id: "entry-1",
    payrollMonth: new Date("2026-01-01"),
    basicSalary: d(5000),
    fixedAllowance: d(0),
    weekendSupportPaymentMethod: "MANUAL_TOTAL",
    weekendSupportDaysCount: null,
    weekendSupportRatePerDay: null,
    weekendSupportAllowance: d(0),
    bonus: d(0),
    commission: d(0),
    overtime: d(0),
    otherTaxableIncome: d(0),
    otherNonTaxableReimbursement: d(0),
    epfAdjustment: d(0),
    zakat: d(0),
    previousCumulativeIncomeForYear: d(0),
    previousCumulativePcbPaid: d(0),
    calculations: [{ payrollConfigurationId: "config-1", profileSnapshot }],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  resolveConfigById.mockResolvedValue(CONFIG_SNAPSHOT);
  payrollProfileFindUniqueOrThrow.mockResolvedValue(LIVE_PROFILE_ROW);
});

describe("loadCalculationDetail", () => {
  it("returns null when the entry isn't found or isn't owned by this user", async () => {
    salaryEntryFindFirst.mockResolvedValueOnce(null);

    const result = await loadCalculationDetail("user-1", "entry-1");

    expect(result).toBeNull();
  });

  it("uses the pinned profile snapshot when present, never fetching the live PayrollProfile row", async () => {
    salaryEntryFindFirst.mockResolvedValueOnce(entryRow(PINNED_PROFILE_SNAPSHOT));

    const result = await loadCalculationDetail("user-1", "entry-1");

    expect(result).not.toBeNull();
    expect(payrollProfileFindUniqueOrThrow).not.toHaveBeenCalled();
    // EPF computed from the pinned 11% rate, not the live row's 999%.
    expect(result!.data.epf).toBe("550.00");
  });

  it("falls back to the live PayrollProfile row when profileSnapshot is null (a pre-migration row)", async () => {
    salaryEntryFindFirst.mockResolvedValueOnce(entryRow(null));

    await loadCalculationDetail("user-1", "entry-1");

    expect(payrollProfileFindUniqueOrThrow).toHaveBeenCalledWith({ where: { userId: "user-1" } });
  });
});
