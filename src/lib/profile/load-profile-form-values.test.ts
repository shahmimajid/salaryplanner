import { describe, expect, it, vi, beforeEach } from "vitest";
import Decimal from "decimal.js";

const payrollProfileFindUniqueOrThrow = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    payrollProfile: {
      findUniqueOrThrow: (...args: unknown[]) => payrollProfileFindUniqueOrThrow(...args),
    },
  },
}));

const { loadPayrollProfileFormValues } = await import("./load-profile-form-values");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("loadPayrollProfileFormValues", () => {
  it("converts a persisted row into the form's plain-number/array shape", async () => {
    payrollProfileFindUniqueOrThrow.mockResolvedValueOnce({
      citizenshipStatus: "CITIZEN",
      isBelow60: true,
      residencyStatus: "RESIDENT",
      maritalStatus: "MARRIED",
      spouseHasIncome: false,
      numberOfChildren: 2,
      childReliefClaims: [
        { belowAge18: true, reliefPercentageClaimed: 100 },
        { belowAge18: true, reliefPercentageClaimed: 50 },
      ],
      epfEmployeeRatePercent: new Decimal(11),
      lindung24JamOptIn: false,
      zakatEnabled: false,
      claimsSocsoRelief: false,
    });

    const result = await loadPayrollProfileFormValues("user-1");

    expect(payrollProfileFindUniqueOrThrow).toHaveBeenCalledWith({ where: { userId: "user-1" } });
    expect(result.epfEmployeeRatePercent).toBe(11);
    expect(typeof result.epfEmployeeRatePercent).toBe("number");
    expect(result.childReliefClaims).toHaveLength(2);
  });

  it("rejects malformed childReliefClaims JSON rather than passing it through", async () => {
    payrollProfileFindUniqueOrThrow.mockResolvedValueOnce({
      citizenshipStatus: "CITIZEN",
      isBelow60: true,
      residencyStatus: "RESIDENT",
      maritalStatus: "SINGLE",
      spouseHasIncome: false,
      numberOfChildren: 1,
      childReliefClaims: [{ belowAge18: "yes" }],
      epfEmployeeRatePercent: new Decimal(11),
      lindung24JamOptIn: false,
      zakatEnabled: false,
      claimsSocsoRelief: false,
    });

    await expect(loadPayrollProfileFormValues("user-1")).rejects.toThrow();
  });
});
