import { describe, expect, it } from "vitest";
import Decimal from "decimal.js";
import { calculateEPF } from "./epf";
import { buildRealisticTestConfig } from "./test-fixtures";

const d = (n: number) => new Decimal(n);
const config = buildRealisticTestConfig();

describe("calculateEPF", () => {
  it("uses the percentage path for realistic salaries above the wage-band table", () => {
    const result = calculateEPF({
      epfWage: d(19088),
      profile: {
        citizenshipStatus: "CITIZEN",
        epfEmployeeRatePercent: d(11),
        isBelow60: true,
      },
      config,
      epfAdjustment: d(0),
    });

    expect(result.appliedWageBandUsed).toBe(false);
    expect(result.employeeContribution.toString()).toBe("2099.68"); // 19088 * 11%
    expect(result.employerContribution.toString()).toBe("2481.44"); // 19088 * 13%
    expect(result.appliedRatePercent.toString()).toBe("11");
  });

  it("uses the wage-band table for low wages", () => {
    const result = calculateEPF({
      epfWage: d(15),
      profile: {
        citizenshipStatus: "CITIZEN",
        epfEmployeeRatePercent: d(11),
        isBelow60: true,
      },
      config,
      epfAdjustment: d(0),
    });

    expect(result.appliedWageBandUsed).toBe(true);
    expect(result.employeeContribution.toString()).toBe("1");
    expect(result.employerContribution.toString()).toBe("3");
  });

  it("applies the age-60+ statutory rate row", () => {
    const result = calculateEPF({
      epfWage: d(19088),
      profile: {
        citizenshipStatus: "CITIZEN",
        epfEmployeeRatePercent: d(5.5),
        isBelow60: false,
      },
      config,
      epfAdjustment: d(0),
    });

    expect(result.employeeContribution.toString()).toBe("1049.84"); // 19088 * 5.5%
    expect(result.employerContribution.toString()).toBe("763.52"); // 19088 * 4%
  });

  it("applies zero rates for non-citizens (universal rate row, any age)", () => {
    const result = calculateEPF({
      epfWage: d(19088),
      profile: {
        citizenshipStatus: "NON_CITIZEN",
        epfEmployeeRatePercent: d(0),
        isBelow60: true,
      },
      config,
      epfAdjustment: d(0),
    });

    expect(result.employeeContribution.toString()).toBe("0");
    expect(result.employerContribution.toString()).toBe("0");
  });

  it("adds a positive epfAdjustment to the employee contribution only", () => {
    const result = calculateEPF({
      epfWage: d(19088),
      profile: {
        citizenshipStatus: "CITIZEN",
        epfEmployeeRatePercent: d(11),
        isBelow60: true,
      },
      config,
      epfAdjustment: d(50),
    });

    expect(result.employeeContribution.toString()).toBe("2149.68");
    expect(result.employerContribution.toString()).toBe("2481.44");
  });

  it("floors a negative epfAdjustment at zero rather than going negative", () => {
    const result = calculateEPF({
      epfWage: d(19088),
      profile: {
        citizenshipStatus: "CITIZEN",
        epfEmployeeRatePercent: d(11),
        isBelow60: true,
      },
      config,
      epfAdjustment: d(-999999),
    });

    expect(result.employeeContribution.toString()).toBe("0");
  });

  it("applies the flat employer rate at exactly the wage-tier threshold", () => {
    const tieredConfig = buildRealisticTestConfig({
      epfRates: [
        {
          citizenshipStatus: "CITIZEN",
          minAge: null,
          maxAge: 59,
          employeeRatePercent: d(11),
          employerRatePercent: d(13),
          employerRateThreshold: d(5000),
          employerRateAbovePercent: d(12),
        },
      ],
    });

    const result = calculateEPF({
      epfWage: d(5000),
      profile: { citizenshipStatus: "CITIZEN", epfEmployeeRatePercent: d(11), isBelow60: true },
      config: tieredConfig,
      epfAdjustment: d(0),
    });

    expect(result.employerContribution.toString()).toBe("650"); // 5000 * 13% (at threshold, not above it)
  });

  it("applies the above-threshold employer rate for wages strictly above the tier", () => {
    const tieredConfig = buildRealisticTestConfig({
      epfRates: [
        {
          citizenshipStatus: "CITIZEN",
          minAge: null,
          maxAge: 59,
          employeeRatePercent: d(11),
          employerRatePercent: d(13),
          employerRateThreshold: d(5000),
          employerRateAbovePercent: d(12),
        },
      ],
    });

    const result = calculateEPF({
      epfWage: d(5000.01),
      profile: { citizenshipStatus: "CITIZEN", epfEmployeeRatePercent: d(11), isBelow60: true },
      config: tieredConfig,
      epfAdjustment: d(0),
    });

    expect(result.employerContribution.toString()).toBe("600"); // 5000.01 * 12% = 600.0012 -> rounds to 600.00
    // Employee rate never tiers — it's always profile.epfEmployeeRatePercent.
    expect(result.employeeContribution.toString()).toBe("550"); // 5000.01 * 11% = 550.0011 -> rounds to 550.00
  });

  it("rounds using ROUND_HALF_UP at the boundary", () => {
    const result = calculateEPF({
      epfWage: d(4545.5),
      profile: {
        citizenshipStatus: "CITIZEN",
        epfEmployeeRatePercent: d(11),
        isBelow60: true,
      },
      config,
      epfAdjustment: d(0),
    });
    // 4545.50 * 11% = 500.005 -> rounds up to 500.01
    expect(result.employeeContribution.toString()).toBe("500.01");
  });
});
