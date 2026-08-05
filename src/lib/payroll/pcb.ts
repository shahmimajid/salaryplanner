import Decimal from "decimal.js";
import type { Money, PayrollConfigSnapshot, ResidencyStatus } from "./types";
import { roundMoney, roundPcb } from "./rounding";

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

/**
 * LHDN's PCB formula subtracts "M" (Table 1's "Amount of the first
 * chargeable income for every range" — e.g. M=100,000 for the displayed
 * range "100,001-400,000") from chargeable income, not the range's display
 * lower bound itself. M is exactly the *previous* bracket's upper bound
 * (0 for the first bracket), so it's derived from bracket ordering rather
 * than stored — robust to either boundary convention this codebase's
 * config data has used (e.g. "100001.00" vs "100000.01").
 */
function findBracket(
  taxBrackets: PayrollConfigSnapshot["taxBrackets"],
  residencyStatus: ResidencyStatus,
  chargeableIncome: Money,
): { bracket: PayrollConfigSnapshot["taxBrackets"][number]; m: Money } | null {
  const rows = taxBrackets
    .filter((b) => b.residencyStatus === residencyStatus)
    .sort((a, b) => a.chargeableIncomeFrom.comparedTo(b.chargeableIncomeFrom));
  const index = rows.findIndex(
    (b) =>
      chargeableIncome.gte(b.chargeableIncomeFrom) &&
      (b.chargeableIncomeTo === null || chargeableIncome.lte(b.chargeableIncomeTo)),
  );
  if (index === -1) return null;
  const m = index === 0 ? new Decimal(0) : (rows[index - 1].chargeableIncomeTo ?? new Decimal(0));
  return { bracket: rows[index], m };
}

function annualTaxForBracket(match: NonNullable<ReturnType<typeof findBracket>>, chargeableIncome: Money): Money {
  return Decimal.max(
    match.bracket.cumulativeTaxBase.plus(
      chargeableIncome.minus(match.m).times(match.bracket.ratePercent).div(100),
    ),
    0,
  );
}

/**
 * Income-threshold rebates (e.g. Section 6A's RM400 individual/spouse
 * rebate for chargeable income <=RM35,000) are an ANNUAL entitlement, not a
 * per-month one — unlike zakat below, which is a genuinely per-month
 * self-reported payment. So these reduce the annual liability once, before
 * it's divided by 12, rather than being subtracted from a single month's
 * PCB the way zakat is. ZAKAT_REBATE is handled separately and skipped
 * here to avoid double-applying it.
 */
function applyThresholdRebates(
  annualTax: Money,
  chargeableIncome: Money,
  taxRebates: PayrollConfigSnapshot["taxRebates"],
): { adjustedTax: Money; applied: Array<{ code: string; amount: Money }> } {
  let tax = annualTax;
  const applied: Array<{ code: string; amount: Money }> = [];
  for (const row of taxRebates) {
    if (row.code === "ZAKAT_REBATE") continue;
    if (row.amount === null || row.incomeThreshold === null) continue;
    if (chargeableIncome.gt(row.incomeThreshold)) continue;
    const rebateApplied = Decimal.min(row.amount, tax);
    if (rebateApplied.gt(0)) {
      tax = tax.minus(rebateApplied);
      applied.push({ code: row.code, amount: rebateApplied });
    }
  }
  return { adjustedTax: tax, applied };
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

  const match = findBracket(
    config.taxBrackets,
    residencyStatus,
    projectedAnnualChargeableIncome,
  );
  if (!match) {
    throw new Error(
      `No tax bracket configured for chargeable income ${projectedAnnualChargeableIncome.toString()} (${residencyStatus}) — config gap, add an open-ended top bracket.`,
    );
  }
  const { bracket } = match;

  let annualTaxPayable = annualTaxForBracket(
    match,
    projectedAnnualChargeableIncome,
  );

  const { adjustedTax: annualTaxAfterThresholdRebates, applied: thresholdRebatesApplied } =
    applyThresholdRebates(annualTaxPayable, projectedAnnualChargeableIncome, config.taxRebates);
  annualTaxPayable = annualTaxAfterThresholdRebates;

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
  const rebatesApplied: Array<{ code: string; amount: Money }> = [...thresholdRebatesApplied];
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
    const matchWithBonus = findBracket(
      config.taxBrackets,
      residencyStatus,
      incomeWithBonus,
    );
    if (!matchWithBonus) {
      throw new Error(
        `No tax bracket configured for chargeable income ${incomeWithBonus.toString()} (${residencyStatus}) — config gap, add an open-ended top bracket.`,
      );
    }
    // Re-apply the same threshold rebates against the bonus-inclusive
    // income, since crossing the threshold (e.g. RM35,000) can disqualify
    // a rebate that applied to the base income alone — keeps the marginal
    // diff below consistent (both sides post-rebate) rather than
    // overstating the bonus's incremental PCB by the rebate amount.
    const { adjustedTax: annualTaxWithBonus } = applyThresholdRebates(
      annualTaxForBracket(matchWithBonus, incomeWithBonus),
      incomeWithBonus,
      config.taxRebates,
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
    currentMonthPcb: roundPcb(currentMonthPcb),
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
