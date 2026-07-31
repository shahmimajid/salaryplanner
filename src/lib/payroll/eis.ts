import Decimal from "decimal.js";
import type { Money, PayrollConfigSnapshot } from "./types";
import { roundMoney } from "./rounding";

export interface EISInput {
  eisWage: Money; // wage subject to EIS, capped at statutory ceiling
  isEisExempt: boolean; // e.g. age at first registration exemption, civil servants
  config: Pick<PayrollConfigSnapshot, "eisRates">;
}

export interface EISResult {
  employeeContribution: Money;
  employerContribution: Money;
  wageBandApplied: { from: Money; to: Money | null } | null;
  isMaxContributionReached: boolean;
}

/** Looks up the EIS contribution band for the wage and returns employee + employer amounts, or zero if exempt. */
export function calculateEIS(input: EISInput): EISResult {
  const { eisWage, isEisExempt, config } = input;

  if (isEisExempt) {
    return {
      employeeContribution: new Decimal(0),
      employerContribution: new Decimal(0),
      wageBandApplied: null,
      isMaxContributionReached: false,
    };
  }

  const rows = config.eisRates
    .slice()
    .sort((a, b) => a.wageFrom.comparedTo(b.wageFrom));

  if (rows.length === 0) {
    throw new Error("No EIS rate rows configured — config data gap.");
  }

  // Same ceiling-fallback logic as SOCSO — see socso.ts for rationale.
  const band =
    rows.find(
      (r) =>
        eisWage.gte(r.wageFrom) && (r.wageTo === null || eisWage.lte(r.wageTo)),
    ) ?? rows[rows.length - 1];

  const isMaxContributionReached =
    band.wageTo !== null && eisWage.gte(band.wageTo);

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
