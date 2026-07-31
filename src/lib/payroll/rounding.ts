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
