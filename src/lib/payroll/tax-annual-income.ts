import Decimal from "decimal.js";
import type {
  Money,
  PayrollConfigSnapshot,
  PayrollProfileSnapshot,
} from "./types";
import { roundMoney } from "./rounding";

export interface AnnualTaxableIncomeInput {
  currentMonthGrossTaxableIncome: Money;
  currentMonthEpfEmployee: Money; // deductible up to relief cap
  previousCumulativeIncomeForYear: Money;
  monthsRemainingInYear: number; // for projecting annualized income
  profile: PayrollProfileSnapshot;
  config: Pick<PayrollConfigSnapshot, "taxReliefs">;
}

export interface AnnualTaxableIncomeResult {
  projectedAnnualGrossIncome: Money;
  totalReliefsApplied: Money;
  projectedAnnualChargeableIncome: Money;
  reliefBreakdown: Array<{ code: string; amountApplied: Money }>;
}

function findRelief(
  taxReliefs: PayrollConfigSnapshot["taxReliefs"],
  code: string,
) {
  return taxReliefs.find((r) => r.code === code) ?? null;
}

/** Projects full-year chargeable income (gross minus applicable reliefs) used as the PCB calculation base. */
export function calculateAnnualTaxableIncome(
  input: AnnualTaxableIncomeInput,
): AnnualTaxableIncomeResult {
  const {
    currentMonthGrossTaxableIncome,
    currentMonthEpfEmployee,
    previousCumulativeIncomeForYear,
    monthsRemainingInYear,
    profile,
    config,
  } = input;

  const projectedAnnualGrossIncome = currentMonthGrossTaxableIncome
    .times(monthsRemainingInYear)
    .plus(previousCumulativeIncomeForYear);

  const reliefBreakdown: Array<{ code: string; amountApplied: Money }> = [];

  // Malaysian personal reliefs apply to tax residents only.
  if (profile.residencyStatus === "RESIDENT") {
    const selfRow = findRelief(config.taxReliefs, "SELF");
    if (selfRow && selfRow.maxAmount.gt(0)) {
      reliefBreakdown.push({ code: "SELF", amountApplied: selfRow.maxAmount });
    }

    const spouseRow = findRelief(config.taxReliefs, "SPOUSE");
    if (
      spouseRow &&
      profile.maritalStatus === "MARRIED" &&
      !profile.spouseHasIncome
    ) {
      reliefBreakdown.push({
        code: "SPOUSE",
        amountApplied: spouseRow.maxAmount,
      });
    }

    // Source of truth is childReliefClaims (not numberOfChildren) to avoid
    // the two drifting out of sync. Claims for children 18+ are excluded —
    // Phase 2 does not yet model any relief for dependents 18 and over.
    const childRow = findRelief(config.taxReliefs, "CHILD_BELOW_18");
    if (childRow) {
      const childTotal = profile.childReliefClaims
        .filter((claim) => claim.belowAge18)
        .reduce((sum, claim) => {
          const claimed = childRow.maxAmount
            .times(claim.reliefPercentageClaimed)
            .div(100);
          return sum.plus(Decimal.min(claimed, childRow.maxAmount));
        }, new Decimal(0));
      if (childTotal.gt(0)) {
        reliefBreakdown.push({
          code: "CHILD_BELOW_18",
          amountApplied: childTotal,
        });
      }
    }

    // Simplified: annualizes this month's EPF employee contribution rather
    // than using actual year-to-date EPF, since this function has no
    // previousCumulativeEpfForYear input (docs/assumptions.md gap).
    const epfRow = findRelief(config.taxReliefs, "EPF_LIFE_INSURANCE");
    if (epfRow) {
      const annualizedEpf = currentMonthEpfEmployee.times(
        monthsRemainingInYear,
      );
      const applied = Decimal.min(annualizedEpf, epfRow.maxAmount);
      if (applied.gt(0)) {
        reliefBreakdown.push({
          code: "EPF_LIFE_INSURANCE",
          amountApplied: applied,
        });
      }
    }

    // TP1 reliefs are out of scope for Phase 2 — no profile field or config
    // code exists yet for them (docs/assumptions.md).
  }

  const totalReliefsApplied = reliefBreakdown.reduce(
    (sum, r) => sum.plus(r.amountApplied),
    new Decimal(0),
  );

  const projectedAnnualChargeableIncome = Decimal.max(
    projectedAnnualGrossIncome.minus(totalReliefsApplied),
    0,
  );

  return {
    projectedAnnualGrossIncome: roundMoney(projectedAnnualGrossIncome),
    totalReliefsApplied: roundMoney(totalReliefsApplied),
    projectedAnnualChargeableIncome: roundMoney(
      projectedAnnualChargeableIncome,
    ),
    reliefBreakdown: reliefBreakdown.map((r) => ({
      code: r.code,
      amountApplied: roundMoney(r.amountApplied),
    })),
  };
}
