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
    expect(result.employeeContribution.toString()).toBe("2100"); // 19088 * 11% = 2099.68 -> ceil to next ringgit
    expect(result.employerContribution.toString()).toBe("2482"); // 19088 * 13% = 2481.44 -> ceil to next ringgit
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

  it("does not apply a CITIZEN wage band to a different citizenship at the same wage", () => {
    // KWSP publishes a separate fixed-amount table per Part — a low-wage
    // NON_CITIZEN must never pick up CITIZEN Part A's band amounts just
    // because the wage happens to fall in CITIZEN's band range.
    const nonCitizenConfig = buildRealisticTestConfig({
      epfRates: [
        {
          citizenshipStatus: "NON_CITIZEN",
          minAge: null,
          maxAge: null,
          employeeRatePercent: d(2),
          employerRatePercent: d(2),
        },
      ],
      // Deliberately reuse the same CITIZEN-tagged bands from the base
      // fixture (via buildRealisticTestConfig's own default epfWageBands,
      // left unspecified here) — the point is that a NON_CITIZEN profile
      // must not match them regardless.
    });

    const result = calculateEPF({
      epfWage: d(15),
      profile: {
        citizenshipStatus: "NON_CITIZEN",
        epfEmployeeRatePercent: d(2),
        isBelow60: true,
      },
      config: nonCitizenConfig,
      epfAdjustment: d(0),
    });

    expect(result.appliedWageBandUsed).toBe(false);
    expect(result.employeeContribution.toString()).toBe("1"); // 15 * 2% = 0.3 -> ceil
    expect(result.employerContribution.toString()).toBe("1"); // 15 * 2% = 0.3 -> ceil
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

    expect(result.employeeContribution.toString()).toBe("1050"); // 19088 * 5.5% = 1049.84 -> ceil
    expect(result.employerContribution.toString()).toBe("764"); // 19088 * 4% = 763.52 -> ceil
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

    expect(result.employeeContribution.toString()).toBe("2150"); // (2099.68 + 50) = 2149.68 -> ceil
    expect(result.employerContribution.toString()).toBe("2482");
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

    expect(result.employerContribution.toString()).toBe("601"); // 5000.01 * 12% = 600.0012 -> ceil to next ringgit
    // Employee rate never tiers — it's always profile.epfEmployeeRatePercent.
    expect(result.employeeContribution.toString()).toBe("551"); // 5000.01 * 11% = 550.0011 -> ceil to next ringgit
  });

  it("rounds UP to the next whole ringgit, never down, even when nearest would round down", () => {
    // Matches the official KWSP table exactly: wage 240 at 13% = 31.2, which
    // ROUND_HALF_UP would floor to 31, but the real Third Schedule (band
    // 220.01-240.00) shows 32 — confirming the rule is ceiling, not nearest.
    const result = calculateEPF({
      epfWage: d(240),
      profile: {
        citizenshipStatus: "CITIZEN",
        epfEmployeeRatePercent: d(13),
        isBelow60: true,
      },
      config: buildRealisticTestConfig({
        epfRates: [
          {
            citizenshipStatus: "CITIZEN",
            minAge: null,
            maxAge: 59,
            employeeRatePercent: d(13),
            employerRatePercent: d(13),
          },
        ],
        // No wage bands covering 240 in this config — forces the percentage path.
        epfWageBands: [
          {
            citizenshipStatus: "CITIZEN",
            minAge: null,
            maxAge: null,
            wageFrom: d(0),
            wageTo: d(10),
            employeeContribution: d(0),
            employerContribution: d(0),
          },
        ],
      }),
      epfAdjustment: d(0),
    });

    expect(result.employeeContribution.toString()).toBe("32");
    expect(result.employerContribution.toString()).toBe("32");
  });

  it("never produces cents — always a whole ringgit", () => {
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
    // 4545.50 * 11% = 500.005 -> ceil to next ringgit
    expect(result.employeeContribution.toString()).toBe("501");
  });
});
