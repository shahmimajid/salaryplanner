import { describe, expect, it } from "vitest";
import Decimal from "decimal.js";
import { calculateSOCSO } from "./socso";
import { buildRealisticTestConfig } from "./test-fixtures";

const d = (n: number) => new Decimal(n);
const config = buildRealisticTestConfig();

describe("calculateSOCSO", () => {
  it("applies the band contribution below the ceiling", () => {
    const result = calculateSOCSO({
      socsoWage: d(3000),
      category: "CATEGORY_1",
      config,
    });
    expect(result.employeeContribution.toString()).toBe("39.75");
    expect(result.isMaxContributionReached).toBe(false);
  });

  it("caps the contribution at the ceiling", () => {
    const atCeiling = calculateSOCSO({
      socsoWage: d(6000),
      category: "CATEGORY_1",
      config,
    });
    const aboveCeiling = calculateSOCSO({
      socsoWage: d(19088),
      category: "CATEGORY_1",
      config,
    });

    expect(atCeiling.employeeContribution.toString()).toBe(
      aboveCeiling.employeeContribution.toString(),
    );
    expect(atCeiling.isMaxContributionReached).toBe(true);
    expect(aboveCeiling.isMaxContributionReached).toBe(true);
  });

  it("distinguishes CATEGORY_1 from CATEGORY_2", () => {
    const cat1 = calculateSOCSO({
      socsoWage: d(3000),
      category: "CATEGORY_1",
      config,
    });
    const cat2 = calculateSOCSO({
      socsoWage: d(3000),
      category: "CATEGORY_2",
      config,
    });
    expect(cat1.employeeContribution.toString()).not.toBe(
      cat2.employeeContribution.toString(),
    );
  });

  it("does not increase SOCSO once basic salary alone already exceeds the ceiling, even with weekend support added", () => {
    const withoutWeekendSupport = calculateSOCSO({
      socsoWage: d(19088),
      category: "CATEGORY_1",
      config,
    });
    const withWeekendSupport = calculateSOCSO({
      socsoWage: d(19088 + 1000),
      category: "CATEGORY_1",
      config,
    });

    expect(withWeekendSupport.employeeContribution.toString()).toBe(
      withoutWeekendSupport.employeeContribution.toString(),
    );
    expect(withWeekendSupport.employerContribution.toString()).toBe(
      withoutWeekendSupport.employerContribution.toString(),
    );
  });

  // Table-driven sweep (spec §15's property/table-driven requirement):
  // contribution must be flat (capped) at and above the ceiling for both categories.
  it.each([
    { category: "CATEGORY_1" as const, wage: 6000 },
    { category: "CATEGORY_1" as const, wage: 6001 },
    { category: "CATEGORY_1" as const, wage: 50000 },
    { category: "CATEGORY_2" as const, wage: 6000 },
    { category: "CATEGORY_2" as const, wage: 6001 },
    { category: "CATEGORY_2" as const, wage: 50000 },
  ])(
    "wage=$wage category=$category is capped at the ceiling contribution",
    ({ category, wage }) => {
      const capped = calculateSOCSO({ socsoWage: d(6000), category, config });
      const actual = calculateSOCSO({ socsoWage: d(wage), category, config });
      expect(actual.employeeContribution.toString()).toBe(
        capped.employeeContribution.toString(),
      );
      expect(actual.isMaxContributionReached).toBe(true);
    },
  );
});
