import { describe, expect, it, vi, beforeEach } from "vitest";
import Decimal from "decimal.js";

const findFirstMock = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    payrollConfiguration: {
      findFirst: (...args: unknown[]) => findFirstMock(...args),
    },
  },
}));

// Import after mocking so resolveConfig picks up the mocked prisma singleton.
const { resolveConfig } = await import("./resolve-config");

function prismaDecimal(n: number) {
  // Prisma 7's runtime Decimal is structurally DecimalJsLike-compatible;
  // decimal.js instances satisfy the same shape for our conversion test.
  return new Decimal(n);
}

const baseRow = {
  version: "test-2026.1",
  effectiveFrom: new Date("2026-01-01"),
  effectiveTo: null as Date | null,
  epfRates: [
    {
      citizenshipStatus: "CITIZEN",
      minAge: null,
      maxAge: 59,
      employeeRatePercent: prismaDecimal(11),
      employerRatePercent: prismaDecimal(13),
    },
  ],
  epfWageBands: [],
  socsoRates: [],
  eisRates: [],
  taxBrackets: [],
  taxReliefs: [],
  taxRebates: [],
};

beforeEach(() => {
  findFirstMock.mockReset();
});

describe("resolveConfig", () => {
  it("queries with the correct where/orderBy shape", async () => {
    findFirstMock.mockResolvedValueOnce(baseRow);

    await resolveConfig({ effectiveDate: "2026-06-15" });

    expect(findFirstMock).toHaveBeenCalledTimes(1);
    const callArgs = findFirstMock.mock.calls[0][0];
    expect(callArgs.where.isActive).toBe(true);
    expect(callArgs.orderBy).toEqual({ effectiveFrom: "desc" });
    expect(callArgs.include).toMatchObject({
      epfRates: true,
      epfWageBands: true,
      socsoRates: true,
      eisRates: true,
      taxBrackets: true,
      taxReliefs: true,
      taxRebates: true,
    });
  });

  it("converts Prisma Decimal fields into decimal.js Decimal instances", async () => {
    findFirstMock.mockResolvedValueOnce(baseRow);

    const result = await resolveConfig({ effectiveDate: "2026-06-15" });

    expect(result.epfRates[0].employeeRatePercent).toBeInstanceOf(Decimal);
    expect(result.epfRates[0].employeeRatePercent.toString()).toBe("11");
    expect(result.version).toBe("test-2026.1");
    expect(result.effectiveFrom).toBe("2026-01-01");
    expect(result.effectiveTo).toBeNull();
  });

  it("throws a descriptive error when no active configuration matches", async () => {
    findFirstMock.mockResolvedValueOnce(null);

    await expect(
      resolveConfig({ effectiveDate: "2026-06-15" }),
    ).rejects.toThrow(/No active payroll configuration found/);
  });
});
