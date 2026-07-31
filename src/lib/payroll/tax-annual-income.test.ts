import { describe, expect, it } from "vitest";
import Decimal from "decimal.js";
import { calculateAnnualTaxableIncome } from "./tax-annual-income";
import { buildRealisticTestConfig, buildTestProfile } from "./test-fixtures";

const d = (n: number) => new Decimal(n);
const config = buildRealisticTestConfig();

describe("calculateAnnualTaxableIncome", () => {
  it("applies SELF + SPOUSE + 4x CHILD_BELOW_18 + EPF reliefs for the default married-with-4-children profile", () => {
    const result = calculateAnnualTaxableIncome({
      currentMonthGrossTaxableIncome: d(19088),
      currentMonthEpfEmployee: d(2099.68),
      previousCumulativeIncomeForYear: d(0),
      monthsRemainingInYear: 12,
      profile: buildTestProfile(),
      config,
    });

    const codes = result.reliefBreakdown.map((r) => r.code).sort();
    expect(codes).toEqual([
      "CHILD_BELOW_18",
      "EPF_LIFE_INSURANCE",
      "SELF",
      "SPOUSE",
    ]);

    const child = result.reliefBreakdown.find(
      (r) => r.code === "CHILD_BELOW_18",
    )!;
    expect(child.amountApplied.toString()).toBe("8000"); // 4 children x RM2000 x 100%

    const epf = result.reliefBreakdown.find(
      (r) => r.code === "EPF_LIFE_INSURANCE",
    )!;
    expect(epf.amountApplied.toString()).toBe("7000"); // capped at maxAmount (annualized EPF > 7000)
  });

  it("omits SPOUSE relief when the spouse has income", () => {
    const result = calculateAnnualTaxableIncome({
      currentMonthGrossTaxableIncome: d(19088),
      currentMonthEpfEmployee: d(0),
      previousCumulativeIncomeForYear: d(0),
      monthsRemainingInYear: 12,
      profile: buildTestProfile({ spouseHasIncome: true }),
      config,
    });
    expect(result.reliefBreakdown.some((r) => r.code === "SPOUSE")).toBe(false);
  });

  it("omits SPOUSE relief for a single taxpayer regardless of spouseHasIncome", () => {
    const result = calculateAnnualTaxableIncome({
      currentMonthGrossTaxableIncome: d(19088),
      currentMonthEpfEmployee: d(0),
      previousCumulativeIncomeForYear: d(0),
      monthsRemainingInYear: 12,
      profile: buildTestProfile({
        maritalStatus: "SINGLE",
        spouseHasIncome: false,
      }),
      config,
    });
    expect(result.reliefBreakdown.some((r) => r.code === "SPOUSE")).toBe(false);
  });

  it("sums partial/split child relief claims correctly", () => {
    const result = calculateAnnualTaxableIncome({
      currentMonthGrossTaxableIncome: d(19088),
      currentMonthEpfEmployee: d(0),
      previousCumulativeIncomeForYear: d(0),
      monthsRemainingInYear: 12,
      profile: buildTestProfile({
        childReliefClaims: [
          { belowAge18: true, reliefPercentageClaimed: 100 },
          { belowAge18: true, reliefPercentageClaimed: 50 },
        ],
      }),
      config,
    });
    const child = result.reliefBreakdown.find(
      (r) => r.code === "CHILD_BELOW_18",
    )!;
    expect(child.amountApplied.toString()).toBe("3000"); // 2000*100% + 2000*50%
  });

  it("excludes claims for children 18 and over", () => {
    const result = calculateAnnualTaxableIncome({
      currentMonthGrossTaxableIncome: d(19088),
      currentMonthEpfEmployee: d(0),
      previousCumulativeIncomeForYear: d(0),
      monthsRemainingInYear: 12,
      profile: buildTestProfile({
        childReliefClaims: [
          { belowAge18: false, reliefPercentageClaimed: 100 },
        ],
      }),
      config,
    });
    expect(
      result.reliefBreakdown.some((r) => r.code === "CHILD_BELOW_18"),
    ).toBe(false);
  });

  it("gives zero reliefs to non-residents; chargeable income equals gross", () => {
    const result = calculateAnnualTaxableIncome({
      currentMonthGrossTaxableIncome: d(19088),
      currentMonthEpfEmployee: d(2099.68),
      previousCumulativeIncomeForYear: d(0),
      monthsRemainingInYear: 12,
      profile: buildTestProfile({ residencyStatus: "NON_RESIDENT" }),
      config,
    });
    expect(result.reliefBreakdown).toEqual([]);
    expect(result.projectedAnnualChargeableIncome.toString()).toBe(
      result.projectedAnnualGrossIncome.toString(),
    );
  });

  it("projects a flat annual total for a steady income split across elapsed/remaining months", () => {
    const result = calculateAnnualTaxableIncome({
      currentMonthGrossTaxableIncome: d(1000),
      currentMonthEpfEmployee: d(0),
      previousCumulativeIncomeForYear: d(5000), // 5 months already paid at 1000/mo
      monthsRemainingInYear: 7,
      profile: buildTestProfile({ residencyStatus: "NON_RESIDENT" }), // isolate from reliefs
      config,
    });
    expect(result.projectedAnnualGrossIncome.toString()).toBe("12000"); // 1000*7 + 5000
  });

  it("floors chargeable income at zero when reliefs exceed gross income", () => {
    const result = calculateAnnualTaxableIncome({
      currentMonthGrossTaxableIncome: d(500),
      currentMonthEpfEmployee: d(0),
      previousCumulativeIncomeForYear: d(0),
      monthsRemainingInYear: 1,
      profile: buildTestProfile(),
      config,
    });
    expect(result.projectedAnnualChargeableIncome.toString()).toBe("0");
  });
});
