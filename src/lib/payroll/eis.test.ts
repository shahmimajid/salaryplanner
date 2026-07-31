import { describe, expect, it } from "vitest";
import Decimal from "decimal.js";
import { calculateEIS } from "./eis";
import { buildRealisticTestConfig } from "./test-fixtures";

const d = (n: number) => new Decimal(n);
const config = buildRealisticTestConfig();

describe("calculateEIS", () => {
  it("applies the band contribution below the ceiling", () => {
    const result = calculateEIS({
      eisWage: d(3000),
      isEisExempt: false,
      config,
    });
    expect(result.employeeContribution.toString()).toBe("39.5");
    expect(result.isMaxContributionReached).toBe(false);
  });

  it("caps the contribution at the ceiling regardless of how far wage exceeds it", () => {
    const atCeiling = calculateEIS({
      eisWage: d(6000),
      isEisExempt: false,
      config,
    });
    const wellAbove = calculateEIS({
      eisWage: d(19088 + 3000),
      isEisExempt: false,
      config,
    });

    expect(wellAbove.employeeContribution.toString()).toBe(
      atCeiling.employeeContribution.toString(),
    );
    expect(wellAbove.isMaxContributionReached).toBe(true);
  });

  it("does not increase EIS once basic salary alone already exceeds the ceiling, even with weekend support added", () => {
    const withoutWeekendSupport = calculateEIS({
      eisWage: d(19088),
      isEisExempt: false,
      config,
    });
    const withWeekendSupport = calculateEIS({
      eisWage: d(19088 + 1000),
      isEisExempt: false,
      config,
    });

    expect(withWeekendSupport.employeeContribution.toString()).toBe(
      withoutWeekendSupport.employeeContribution.toString(),
    );
  });

  it("returns zero contributions and a null band when exempt, regardless of wage", () => {
    const result = calculateEIS({
      eisWage: d(19088),
      isEisExempt: true,
      config,
    });
    expect(result.employeeContribution.toString()).toBe("0");
    expect(result.employerContribution.toString()).toBe("0");
    expect(result.wageBandApplied).toBeNull();
    expect(result.isMaxContributionReached).toBe(false);
  });

  it.each([6000, 6001, 50000])(
    "wage=%i is capped at the ceiling contribution",
    (wage) => {
      const capped = calculateEIS({
        eisWage: d(6000),
        isEisExempt: false,
        config,
      });
      const actual = calculateEIS({
        eisWage: d(wage),
        isEisExempt: false,
        config,
      });
      expect(actual.employeeContribution.toString()).toBe(
        capped.employeeContribution.toString(),
      );
    },
  );
});
