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
  currentMonthSocsoEmployee: Money; // TP1-gated relief, this month's contribution only — see SOCSO_RELIEF below
  previousCumulativeIncomeForYear: Money;
  previousCumulativeEpfForYear: Money; // actual EPF withheld in prior months this year — LHDN's "K"
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
    currentMonthSocsoEmployee,
    previousCumulativeIncomeForYear,
    previousCumulativeEpfForYear,
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

    // LHDN's official MTD formula (K/K1/K2 terms): K = actual EPF withheld
    // in prior months this year, K1 = this month's EPF, K2 = a residual
    // relief-budget projection for the n months strictly after this one —
    // min[(cap - K - K1) / n, K1], which can go *negative* once K+K1 alone
    // already exceeds the cap (confirmed via a real Feb 2025 payslip:
    // Jan+Feb EPF alone totaled RM4,268, over the RM4,000 cap — the old
    // simplified "annualize this month's EPF only" formula didn't know
    // that and understated the annual tax liability by ~RM400/month).
    const epfRow = findRelief(config.taxReliefs, "EPF_LIFE_INSURANCE");
    if (epfRow) {
      const K = previousCumulativeEpfForYear;
      const K1 = currentMonthEpfEmployee;
      const n = monthsRemainingInYear - 1;
      const rawEpfRelief =
        n > 0
          ? K.plus(K1).plus(
              Decimal.min(epfRow.maxAmount.minus(K).minus(K1).div(n), K1).times(n),
            )
          : K.plus(K1);
      const applied = Decimal.min(Decimal.max(rawEpfRelief, 0), epfRow.maxAmount);
      if (applied.gt(0)) {
        reliefBreakdown.push({
          code: "EPF_LIFE_INSURANCE",
          amountApplied: applied,
        });
      }
    }

    // SOCSO contribution relief (LHDN MTD spec, up to RM350/year) is a
    // TP1-optional deduction, not automatic like SELF/SPOUSE/CHILD/EPF —
    // gated behind profile.claimsSocsoRelief. Per the spec's own formula
    // (LP1 = "allowable deductions for the current month"), TP1-optional
    // deductions credit only what's been claimed so far, month by month —
    // unlike EPF's forward-projected relief, this uses just this month's
    // contribution, not an annualized projection. Correct for month 1 of
    // the year; understates the full-year relief for later months since
    // there's no previousCumulativeSocsoReliefClaimed input yet to track
    // what earlier months already claimed (same class of gap as item 18).
    if (profile.claimsSocsoRelief) {
      const socsoReliefRow = findRelief(config.taxReliefs, "SOCSO_RELIEF");
      if (socsoReliefRow && socsoReliefRow.maxAmount.gt(0)) {
        const applied = Decimal.min(currentMonthSocsoEmployee, socsoReliefRow.maxAmount);
        if (applied.gt(0)) {
          reliefBreakdown.push({ code: "SOCSO_RELIEF", amountApplied: applied });
        }
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
