import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ProfileFormValues } from "@/components/profile/profile-schema";

const payrollProfileUpdate = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    payrollProfile: { update: (...args: unknown[]) => payrollProfileUpdate(...args) },
  },
}));

const { updatePayrollProfile } = await import("./update-profile");

const VALID_INPUT: ProfileFormValues = {
  citizenshipStatus: "CITIZEN",
  isBelow60: true,
  residencyStatus: "RESIDENT",
  maritalStatus: "MARRIED",
  spouseHasIncome: false,
  numberOfChildren: 2,
  childReliefClaims: [
    { belowAge18: true, reliefPercentageClaimed: 100 },
    { belowAge18: true, reliefPercentageClaimed: 100 },
  ],
  epfEmployeeRatePercent: 9,
  lindung24JamOptIn: false,
  zakatEnabled: false,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("updatePayrollProfile", () => {
  it("returns field errors and never touches Prisma when validation fails", async () => {
    const result = await updatePayrollProfile("user-1", { ...VALID_INPUT, numberOfChildren: -1 });

    expect(result.ok).toBe(false);
    expect(payrollProfileUpdate).not.toHaveBeenCalled();
  });

  it("updates the profile row scoped to userId, stringifying epfEmployeeRatePercent", async () => {
    const result = await updatePayrollProfile("user-1", VALID_INPUT);

    expect(result.ok).toBe(true);
    expect(payrollProfileUpdate).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      data: expect.objectContaining({
        maritalStatus: "MARRIED",
        numberOfChildren: 2,
        epfEmployeeRatePercent: "9",
      }),
    });
  });
});
