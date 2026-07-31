import type { Money, PayrollConfigSnapshot, SocsoCategory } from "./types";
import { roundMoney } from "./rounding";

export interface SOCSOInput {
  socsoWage: Money; // wage subject to SOCSO, capped at statutory ceiling
  category: SocsoCategory; // CATEGORY_1 (below 60) or CATEGORY_2 (60+)
  config: Pick<PayrollConfigSnapshot, "socsoRates">;
}

export interface SOCSOResult {
  employeeContribution: Money;
  employerContribution: Money;
  wageBandApplied: { from: Money; to: Money | null };
  isMaxContributionReached: boolean;
}

/** Looks up the SOCSO contribution band for the wage/category and returns employee + employer amounts, respecting the wage ceiling. */
export function calculateSOCSO(input: SOCSOInput): SOCSOResult {
  const { socsoWage, category, config } = input;

  const rows = config.socsoRates
    .filter((r) => r.category === category)
    .slice()
    .sort((a, b) => a.wageFrom.comparedTo(b.wageFrom));

  if (rows.length === 0) {
    throw new Error(
      `No SOCSO rate rows configured for category ${category} — config data gap.`,
    );
  }

  // A wage above every row's wageTo has no matching band — fall back to the
  // topmost (highest wageFrom) row as the statutory ceiling. This is the
  // same branch whether the wage started above the ceiling or was pushed
  // there by an added allowance, so no special-casing is needed to satisfy
  // "extra weekend-support allowance must not increase SOCSO/EIS past the
  // max once the ceiling is already reached."
  const band =
    rows.find(
      (r) =>
        socsoWage.gte(r.wageFrom) &&
        (r.wageTo === null || socsoWage.lte(r.wageTo)),
    ) ?? rows[rows.length - 1];

  const isMaxContributionReached =
    band.wageTo !== null && socsoWage.gte(band.wageTo);

  return {
    employeeContribution: roundMoney(band.employeeContribution),
    employerContribution: roundMoney(band.employerContribution),
    wageBandApplied: {
      from: roundMoney(band.wageFrom),
      to: band.wageTo === null ? null : roundMoney(band.wageTo),
    },
    isMaxContributionReached,
  };
}
