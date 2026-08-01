import { describe, expect, it } from "vitest";
import Decimal from "decimal.js";
import { defaultPayrollProfileCreateData, toPayrollProfileSnapshot } from "./profile-snapshot";
import { DEFAULT_PAYROLL_PROFILE } from "./default-profile";

describe("defaultPayrollProfileCreateData", () => {
  it("matches DEFAULT_PAYROLL_PROFILE's values, Decimal fields stringified", () => {
    const data = defaultPayrollProfileCreateData();
    expect(data.citizenshipStatus).toBe(DEFAULT_PAYROLL_PROFILE.citizenshipStatus);
    expect(data.maritalStatus).toBe(DEFAULT_PAYROLL_PROFILE.maritalStatus);
    expect(data.numberOfChildren).toBe(DEFAULT_PAYROLL_PROFILE.numberOfChildren);
    expect(data.epfEmployeeRatePercent).toBe("11");
    expect(data.childReliefClaims).toEqual(DEFAULT_PAYROLL_PROFILE.childReliefClaims);
  });
});

describe("toPayrollProfileSnapshot", () => {
  const baseRow = {
    citizenshipStatus: "CITIZEN" as const,
    isBelow60: true,
    residencyStatus: "RESIDENT" as const,
    maritalStatus: "MARRIED" as const,
    spouseHasIncome: false,
    numberOfChildren: 2,
    childReliefClaims: [
      { belowAge18: true, reliefPercentageClaimed: 100 },
      { belowAge18: true, reliefPercentageClaimed: 50 },
    ],
    epfEmployeeRatePercent: new Decimal(11),
    lindung24JamOptIn: false,
    zakatEnabled: false,
  };

  it("converts a persisted row into a PayrollProfileSnapshot", () => {
    const snapshot = toPayrollProfileSnapshot(baseRow);
    expect(snapshot.numberOfChildren).toBe(2);
    expect(snapshot.childReliefClaims).toHaveLength(2);
    expect(snapshot.epfEmployeeRatePercent).toBeInstanceOf(Decimal);
    expect(snapshot.epfEmployeeRatePercent.toString()).toBe("11");
  });

  it("rejects malformed childReliefClaims JSON rather than passing it through", () => {
    const malformed = { ...baseRow, childReliefClaims: [{ belowAge18: "yes" }] };
    expect(() => toPayrollProfileSnapshot(malformed)).toThrow();
  });
});
