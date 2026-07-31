import Decimal from "decimal.js";
import type { Money, PayrollConfigSnapshot, ResidencyStatus } from "./types";
import { roundMoney } from "./rounding";

export interface PCBInput {
  projectedAnnualChargeableIncome: Money;
  residencyStatus: ResidencyStatus;
  previousCumulativePcbPaid: Money;
  monthsElapsedInYear: number;
  monthsRemainingInYear: number;
  zakatAmount: Money; // rebate against PCB, not a relief
  bonusOrIrregularPayment: Money | null; // triggers separate lump-sum PCB method if present
  config: Pick<PayrollConfigSnapshot, "taxBrackets" | "taxRebates">;
}

export interface PCBResult {
  annualTaxPayable: Money;
  monthlyPcbBeforeRebates: Money;
  rebatesApplied: Array<{ code: string; amount: Money }>;
  currentMonthPcb: Money; // final PCB to withhold this month, cumulative-method reconciled
  bracketApplied: { from: Money; to: Money | null; ratePercent: Money } | null;
}

function findBracket(
  taxBrackets: PayrollConfigSnapshot["taxBrackets"],
  residencyStatus: ResidencyStatus,
  chargeableIncome: Money,
) {
  return (
    taxBrackets
      .filter((b) => b.residencyStatus === residencyStatus)
      .find(
        (b) =>
          chargeableIncome.gte(b.chargeableIncomeFrom) &&
          (b.chargeableIncomeTo === null ||
            chargeableIncome.lte(b.chargeableIncomeTo)),
      ) ?? null
  );
}

function annualTaxForBracket(
  bracket: NonNullable<ReturnType<typeof findBracket>>,
  chargeableIncome: Money,
): Money {
  return Decimal.max(
    bracket.cumulativeTaxBase.plus(
      chargeableIncome
        .minus(bracket.chargeableIncomeFrom)
        .times(bracket.ratePercent)
        .div(100),
    ),
    0,
  );
}

/** Computes Potongan Cukai Bulanan (monthly tax deduction) using the cumulative method against projected annual chargeable income, applying rebates including zakat. */
export function calculatePCB(input: PCBInput): PCBResult {
  const {
    projectedAnnualChargeableIncome,
    residencyStatus,
    previousCumulativePcbPaid,
    monthsElapsedInYear,
    zakatAmount,
    bonusOrIrregularPayment,
    config,
  } = input;

  const bracket = findBracket(
    config.taxBrackets,
    residencyStatus,
    projectedAnnualChargeableIncome,
  );
  if (!bracket) {
    throw new Error(
      `No tax bracket configured for chargeable income ${projectedAnnualChargeableIncome.toString()} (${residencyStatus}) — config gap, add an open-ended top bracket.`,
    );
  }

  const annualTaxPayable = annualTaxForBracket(
    bracket,
    projectedAnnualChargeableIncome,
  );

  // Standard cumulative method: spread the annual liability over all 12
  // months, then reconcile against what's already been withheld this year.
  const monthlyPcbBeforeRebates = annualTaxPayable.div(12);

  const monthsIncludingCurrent = monthsElapsedInYear + 1;
  const cumulativeShouldHaveBeenWithheld = monthlyPcbBeforeRebates.times(
    monthsIncludingCurrent,
  );
  const currentMonthPcbBeforeRebate = Decimal.max(
    cumulativeShouldHaveBeenWithheld.minus(previousCumulativePcbPaid),
    0,
  );

  // Zakat offsets PCB directly as a rebate (docs/assumptions.md #8), capped
  // at both the config's rebate amount (if set) and the PCB actually owed
  // this month — never reported as "applied" beyond what there was to offset.
  const rebatesApplied: Array<{ code: string; amount: Money }> = [];
  const zakatRow =
    config.taxRebates.find((r) => r.code === "ZAKAT_REBATE") ?? null;
  if (zakatRow && zakatAmount.gt(0)) {
    const rebateCandidate =
      zakatRow.amount !== null
        ? Decimal.min(zakatAmount, zakatRow.amount)
        : zakatAmount;
    const rebateApplied = Decimal.min(
      rebateCandidate,
      currentMonthPcbBeforeRebate,
    );
    if (rebateApplied.gt(0)) {
      rebatesApplied.push({ code: "ZAKAT_REBATE", amount: rebateApplied });
    }
  }

  const rebateTotal = rebatesApplied.reduce(
    (sum, r) => sum.plus(r.amount),
    new Decimal(0),
  );
  let currentMonthPcb = Decimal.max(
    currentMonthPcbBeforeRebate.minus(rebateTotal),
    0,
  );

  // Bonus / lump-sum: simplified marginal-diff method (NOT the official
  // LHDN Kaedah 2 formula — docs/assumptions.md #6). Re-run the bracket
  // lookup with the bonus included in chargeable income and take the
  // marginal annual-tax difference, which correctly captures the bonus
  // spanning into a higher bracket.
  if (bonusOrIrregularPayment !== null && bonusOrIrregularPayment.gt(0)) {
    const incomeWithBonus = projectedAnnualChargeableIncome.plus(
      bonusOrIrregularPayment,
    );
    const bracketWithBonus = findBracket(
      config.taxBrackets,
      residencyStatus,
      incomeWithBonus,
    );
    if (!bracketWithBonus) {
      throw new Error(
        `No tax bracket configured for chargeable income ${incomeWithBonus.toString()} (${residencyStatus}) — config gap, add an open-ended top bracket.`,
      );
    }
    const annualTaxWithBonus = annualTaxForBracket(
      bracketWithBonus,
      incomeWithBonus,
    );
    const additionalPcbForBonus = Decimal.max(
      annualTaxWithBonus.minus(annualTaxPayable),
      0,
    );
    currentMonthPcb = currentMonthPcb.plus(additionalPcbForBonus);
  }

  return {
    annualTaxPayable: roundMoney(annualTaxPayable),
    monthlyPcbBeforeRebates: roundMoney(monthlyPcbBeforeRebates),
    rebatesApplied: rebatesApplied.map((r) => ({
      code: r.code,
      amount: roundMoney(r.amount),
    })),
    currentMonthPcb: roundMoney(currentMonthPcb),
    bracketApplied: {
      from: roundMoney(bracket.chargeableIncomeFrom),
      to:
        bracket.chargeableIncomeTo === null
          ? null
          : roundMoney(bracket.chargeableIncomeTo),
      ratePercent: bracket.ratePercent,
    },
  };
}
