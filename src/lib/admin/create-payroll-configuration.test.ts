import { describe, expect, it, vi, beforeEach } from "vitest";
import type { PayrollConfigFormValues } from "@/components/admin/config-schema";

const payrollConfigurationCreate = vi.fn();
const payrollConfigurationUpdate = vi.fn();
const auditLogCreate = vi.fn();

class FakePrismaClientKnownRequestError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

vi.mock("@/generated/prisma/client", () => ({
  Prisma: { PrismaClientKnownRequestError: FakePrismaClientKnownRequestError },
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    $transaction: async (fn: (tx: unknown) => unknown) =>
      fn({
        payrollConfiguration: {
          create: (...args: unknown[]) => payrollConfigurationCreate(...args),
          update: (...args: unknown[]) => payrollConfigurationUpdate(...args),
        },
        auditLog: { create: (...args: unknown[]) => auditLogCreate(...args) },
      }),
  },
}));

const { createPayrollConfiguration } = await import("./create-payroll-configuration");

const VALID_INPUT: PayrollConfigFormValues = {
  version: "test-2",
  label: "Test config",
  effectiveFrom: "2026-01-01",
  effectiveTo: null,
  isActive: true,
  sourceReference: "test",
  notes: null,
  epfRates: [
    {
      citizenshipStatus: "CITIZEN",
      minAge: null,
      maxAge: 59,
      employeeRatePercent: 11,
      employerRatePercent: 13,
      notes: null,
    },
  ],
  epfWageBands: [{ wageFrom: 0, wageTo: 10, employeeContribution: 1, employerContribution: 2 }],
  socsoRates: [
    {
      category: "CATEGORY_1",
      wageFrom: 0,
      wageTo: 6000,
      employeeContribution: 39.75,
      employerContribution: 139.25,
    },
  ],
  eisRates: [{ wageFrom: 0, wageTo: 6000, employeeContribution: 39.5, employerContribution: 39.5 }],
  taxBrackets: [
    {
      residencyStatus: "RESIDENT",
      chargeableIncomeFrom: 0,
      chargeableIncomeTo: null,
      ratePercent: 0,
      cumulativeTaxBase: 0,
    },
  ],
  taxReliefs: [{ code: "SELF", label: "Individual relief", maxAmount: 9000, description: null }],
  taxRebates: [{ code: "REBATE18", label: "Chapter 6A rebate", amount: 400, incomeThreshold: 35000, description: null }],
  retirePreviousConfigId: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  payrollConfigurationCreate.mockResolvedValue({ id: "config-new" });
});

describe("createPayrollConfiguration", () => {
  it("returns field errors and never touches Prisma when validation fails", async () => {
    const result = await createPayrollConfiguration("user-1", { ...VALID_INPUT, version: "" });

    expect(result.ok).toBe(false);
    expect(payrollConfigurationCreate).not.toHaveBeenCalled();
  });

  it("creates the configuration with all 7 nested arrays and writes an audit log entry", async () => {
    const result = await createPayrollConfiguration("user-1", VALID_INPUT);

    expect(result.ok).toBe(true);
    expect(payrollConfigurationCreate).toHaveBeenCalledTimes(1);
    const createArgs = payrollConfigurationCreate.mock.calls[0][0];
    expect(createArgs.data.createdById).toBe("user-1");
    expect(createArgs.data.epfRates).toEqual({ create: VALID_INPUT.epfRates });
    expect(createArgs.data.epfWageBands).toEqual({ create: VALID_INPUT.epfWageBands });
    expect(createArgs.data.socsoRates).toEqual({ create: VALID_INPUT.socsoRates });
    expect(createArgs.data.eisRates).toEqual({ create: VALID_INPUT.eisRates });
    expect(createArgs.data.taxBrackets).toEqual({ create: VALID_INPUT.taxBrackets });
    expect(createArgs.data.taxReliefs).toEqual({ create: VALID_INPUT.taxReliefs });
    expect(createArgs.data.taxRebates).toEqual({ create: VALID_INPUT.taxRebates });

    expect(payrollConfigurationUpdate).not.toHaveBeenCalled();
    expect(auditLogCreate).toHaveBeenCalledTimes(1);
    expect(auditLogCreate.mock.calls[0][0]).toMatchObject({
      data: {
        userId: "user-1",
        action: "CONFIG_CHANGE",
        entityType: "PayrollConfiguration",
        entityId: "config-new",
      },
    });
  });

  it("retires the source config to the day before the new effectiveFrom when requested", async () => {
    const result = await createPayrollConfiguration("user-1", {
      ...VALID_INPUT,
      retirePreviousConfigId: "config-old",
    });

    expect(result.ok).toBe(true);
    expect(payrollConfigurationUpdate).toHaveBeenCalledWith({
      where: { id: "config-old" },
      data: { effectiveTo: new Date("2025-12-31T00:00:00.000Z") },
    });
  });

  it("maps a unique-version conflict to a field error", async () => {
    payrollConfigurationCreate.mockRejectedValueOnce(
      new FakePrismaClientKnownRequestError("duplicate", "P2002"),
    );

    const result = await createPayrollConfiguration("user-1", VALID_INPUT);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors.version).toEqual(["This version already exists."]);
    }
  });
});
