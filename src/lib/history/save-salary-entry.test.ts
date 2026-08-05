import { describe, expect, it, vi, beforeEach } from "vitest";
import Decimal from "decimal.js";

const payrollProfileFindUniqueOrThrow = vi.fn();
const payrollConfigurationFindFirst = vi.fn();
const salaryEntryFindFirst = vi.fn();
const salaryEntryCreate = vi.fn();
const salaryEntryUpdate = vi.fn();
const salaryCalculationUpdateMany = vi.fn();
const salaryCalculationCreate = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    payrollProfile: { findUniqueOrThrow: (...args: unknown[]) => payrollProfileFindUniqueOrThrow(...args) },
    payrollConfiguration: { findFirst: (...args: unknown[]) => payrollConfigurationFindFirst(...args) },
    $transaction: async (fn: (tx: unknown) => unknown) =>
      fn({
        salaryEntry: {
          findFirst: (...args: unknown[]) => salaryEntryFindFirst(...args),
          create: (...args: unknown[]) => salaryEntryCreate(...args),
          update: (...args: unknown[]) => salaryEntryUpdate(...args),
        },
        salaryCalculation: {
          updateMany: (...args: unknown[]) => salaryCalculationUpdateMany(...args),
          create: (...args: unknown[]) => salaryCalculationCreate(...args),
        },
      }),
  },
}));

const { saveSalaryEntry } = await import("./save-salary-entry");

function d(n: number) {
  return new Decimal(n);
}

const PROFILE_ROW = {
  citizenshipStatus: "CITIZEN",
  isBelow60: true,
  residencyStatus: "RESIDENT",
  maritalStatus: "SINGLE",
  spouseHasIncome: false,
  numberOfChildren: 0,
  childReliefClaims: [],
  epfEmployeeRatePercent: d(11),
  lindung24JamOptIn: false,
  zakatEnabled: false,
  claimsSocsoRelief: false,
};

const CONFIG_ROW = {
  id: "config-1",
  version: "test-1",
  effectiveFrom: new Date("2026-01-01"),
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

const VALID_INPUT = {
  payrollMonth: "2026-01",
  basicSalary: 3000,
  fixedAllowance: 0,
  weekendSupportPaymentMethod: "MANUAL_TOTAL" as const,
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

beforeEach(() => {
  vi.clearAllMocks();
  payrollProfileFindUniqueOrThrow.mockResolvedValue(PROFILE_ROW);
  payrollConfigurationFindFirst.mockResolvedValue(CONFIG_ROW);
  salaryEntryCreate.mockResolvedValue({ id: "entry-new" });
  salaryEntryUpdate.mockResolvedValue({ id: "entry-existing" });
  salaryCalculationCreate.mockResolvedValue({ id: "calc-1" });
});

describe("saveSalaryEntry", () => {
  it("returns field errors and never touches Prisma when validation fails", async () => {
    const result = await saveSalaryEntry("user-1", { ...VALID_INPUT, basicSalary: -100 });

    expect(result.ok).toBe(false);
    expect(payrollProfileFindUniqueOrThrow).not.toHaveBeenCalled();
    expect(salaryEntryCreate).not.toHaveBeenCalled();
  });

  it("creates a new SalaryEntry + SalaryCalculation when none exists for the month", async () => {
    salaryEntryFindFirst.mockResolvedValueOnce(null);

    const result = await saveSalaryEntry("user-1", VALID_INPUT);

    expect(result.ok).toBe(true);
    expect(salaryEntryCreate).toHaveBeenCalledTimes(1);
    expect(salaryEntryUpdate).not.toHaveBeenCalled();
    expect(salaryCalculationUpdateMany).not.toHaveBeenCalled();
    expect(salaryCalculationCreate).toHaveBeenCalledTimes(1);
    const createArgs = salaryCalculationCreate.mock.calls[0][0];
    expect(createArgs.data.salaryEntryId).toBe("entry-new");
    expect(createArgs.data.payrollConfigurationId).toBe("config-1");
    expect(createArgs.data.isCurrent).toBe(true);
    // Pins the resolved profile so a later profile edit can't retroactively
    // change this calculation's recompute (docs/assumptions.md #21).
    expect(createArgs.data.profileSnapshot).toMatchObject({
      maritalStatus: "SINGLE",
      epfEmployeeRatePercent: "11",
    });
  });

  it("updates the existing SalaryEntry and supersedes the previous calculation for the same month", async () => {
    salaryEntryFindFirst.mockResolvedValueOnce({ id: "entry-existing" });

    const result = await saveSalaryEntry("user-1", VALID_INPUT);

    expect(result.ok).toBe(true);
    expect(salaryEntryUpdate).toHaveBeenCalledTimes(1);
    expect(salaryEntryCreate).not.toHaveBeenCalled();
    expect(salaryCalculationUpdateMany).toHaveBeenCalledWith({
      where: { salaryEntryId: "entry-existing", isCurrent: true },
      data: { isCurrent: false },
    });
    expect(salaryCalculationCreate).toHaveBeenCalledTimes(1);
    const createArgs = salaryCalculationCreate.mock.calls[0][0];
    expect(createArgs.data.salaryEntryId).toBe("entry-existing");
  });
});
