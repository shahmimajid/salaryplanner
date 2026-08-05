import Decimal from "decimal.js";
import type { Money } from "./types";

export const MONEY_DP = 2; // sen
export const RATE_DP = 3; // matches @db.Decimal(6,3) columns

/**
 * Rounds a monetary amount using ROUND_HALF_UP — Phase 2's documented
 * default (docs/assumptions.md #12), chosen because it's decimal.js's own
 * default and a common convention for MY statutory tables, not yet
 * confirmed against official KWSP/PERKESO/LHDN rounding directions. Mode
 * is passed explicitly per call rather than via global Decimal.set() so
 * this module has no process-wide side effects.
 */
export function roundMoney(value: Money, dp: number = MONEY_DP): Money {
  return value.toDecimalPlaces(dp, Decimal.ROUND_HALF_UP);
}

export function roundRate(value: Money, dp: number = RATE_DP): Money {
  return value.toDecimalPlaces(dp, Decimal.ROUND_HALF_UP);
}

/**
 * LHDN's official PCB rounding rule (Specification for MTD Calculations
 * Using Computerized Calculation, Terms and Conditions #1-2): truncate to
 * 2dp (never round), then round UP to the next 5 sen — e.g. 287.02 -> 287.05,
 * 152.06 -> 152.10. Distinct from roundMoney's ROUND_HALF_UP-to-the-cent,
 * which the rest of the engine uses.
 */
export function roundPcb(value: Money): Money {
  const truncated = value.toDecimalPlaces(MONEY_DP, Decimal.ROUND_DOWN);
  return truncated.dividedBy(0.05).toDecimalPlaces(0, Decimal.ROUND_UP).times(0.05).toDecimalPlaces(MONEY_DP);
}
