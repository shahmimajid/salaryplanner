import Decimal from "decimal.js";
import type {
  CitizenshipStatus,
  Money,
  PayrollConfigSnapshot,
  PayrollProfileSnapshot,
} from "./types";
import { roundRate } from "./rounding";

/**
 * PayrollProfileSnapshot only exposes isBelow60 (not a raw age), so a
 * config row is treated as the "below 60" row if it declares an upper
 * bound (maxAge), the "60+" row if it declares a lower bound (minAge),
 * and a row with neither bound set is a citizenship-wide universal rate
 * that applies regardless of age (e.g. NON_CITIZEN in the seed data).
 * Shared by both EPFRate and EPFWageBand lookups — KWSP's Third Schedule
 * publishes a separate fixed-amount wage-band table per Part (citizenship +
 * age band), same as it publishes separate percentage rates.
 */
function findMatchingRow<
  T extends { citizenshipStatus: CitizenshipStatus; minAge: number | null; maxAge: number | null },
>(rows: T[], citizenshipStatus: CitizenshipStatus, isBelow60: boolean): T | undefined {
  const candidates = rows.filter((row) => row.citizenshipStatus === citizenshipStatus);
  return (
    candidates.find((row) => (isBelow60 ? row.maxAge !== null : row.minAge !== null)) ??
    candidates.find((row) => row.minAge === null && row.maxAge === null)
  );
}

/**
 * EPF contributions round UP to the next whole ringgit — not the 2dp
 * ROUND_HALF_UP the rest of the engine uses (docs/assumptions.md #12). This
 * is explicit in every Part of the KWSP Third Schedule: "The total
 * contribution which includes cents shall be rounded to the next ringgit."
 * Confirmed against the official table (e.g. wage-band 220.01–240.00:
 * 240×13%=31.2 rounds to 31 under ROUND_HALF_UP, but the table shows 32).
 */
function ceilToRinggit(value: Money): Money {
  return value.toDecimalPlaces(0, Decimal.ROUND_UP);
}

export interface EPFInput {
  epfWage: Money; // wage subject to EPF (typically basic + fixed allowance + certain payments, excl. some allowances)
  profile: Pick<
    PayrollProfileSnapshot,
    "citizenshipStatus" | "epfEmployeeRatePercent" | "isBelow60"
  >;
  config: Pick<PayrollConfigSnapshot, "epfRates" | "epfWageBands">;
  epfAdjustment: Money; // manual override/adjustment from SalaryEntry.epfAdjustment
}

export interface EPFResult {
  employeeContribution: Money;
  employerContribution: Money;
  appliedRatePercent: Money;
  appliedWageBandUsed: boolean; // true if resolved via table lookup rather than pure percentage
}

/** Resolves EPF employee/employer contribution for a wage using rate % or wage-band table lookup, applying any manual adjustment. */
export function calculateEPF(input: EPFInput): EPFResult {
  const { epfWage, profile, config, epfAdjustment } = input;

  const rateRow = findMatchingRow(config.epfRates, profile.citizenshipStatus, profile.isBelow60);

  if (!rateRow) {
    throw new Error(
      `No EPF rate row matches profile (citizenshipStatus=${profile.citizenshipStatus}, isBelow60=${profile.isBelow60}) — config data gap.`,
    );
  }

  let appliedWageBandUsed = false;
  let employeeBeforeAdjustment = new Decimal(0);
  let employerBeforeAdjustment = new Decimal(0);

  const hasStatutoryParticipation =
    rateRow.employeeRatePercent.gt(0) || rateRow.employerRatePercent.gt(0);

  if (hasStatutoryParticipation) {
    const bandsForProfile = config.epfWageBands.filter(
      (b) => b.citizenshipStatus === profile.citizenshipStatus,
    );
    const applicableBands = profile.isBelow60
      ? bandsForProfile.filter((b) => b.maxAge !== null)
      : bandsForProfile.filter((b) => b.minAge !== null);
    const universalBands = bandsForProfile.filter(
      (b) => b.minAge === null && b.maxAge === null,
    );
    const band = (applicableBands.length > 0 ? applicableBands : universalBands).find(
      (b) =>
        epfWage.gte(b.wageFrom) && (b.wageTo === null || epfWage.lte(b.wageTo)),
    );
    if (band) {
      employeeBeforeAdjustment = band.employeeContribution;
      employerBeforeAdjustment = band.employerContribution;
      appliedWageBandUsed = true;
    }
  }

  if (!appliedWageBandUsed) {
    employeeBeforeAdjustment = epfWage
      .times(profile.epfEmployeeRatePercent)
      .div(100);

    // KWSP's employer rate is wage-tiered for some rows (e.g. 13% at wages
    // <=RM5,000, 12% above) — only wages strictly above the threshold get
    // the "above" rate; rows without a threshold keep the flat rate.
    const employerRatePercent =
      rateRow.employerRateThreshold !== null &&
      rateRow.employerRateThreshold !== undefined &&
      rateRow.employerRateAbovePercent !== null &&
      rateRow.employerRateAbovePercent !== undefined &&
      epfWage.gt(rateRow.employerRateThreshold)
        ? rateRow.employerRateAbovePercent
        : rateRow.employerRatePercent;

    employerBeforeAdjustment = epfWage.times(employerRatePercent).div(100);
  }

  const employeeContribution = Decimal.max(
    employeeBeforeAdjustment.plus(epfAdjustment),
    0,
  );
  const employerContribution = employerBeforeAdjustment;

  const appliedRatePercent = epfWage.gt(0)
    ? employeeBeforeAdjustment.div(epfWage).times(100)
    : new Decimal(0);

  return {
    employeeContribution: ceilToRinggit(employeeContribution),
    employerContribution: ceilToRinggit(employerContribution),
    appliedRatePercent: roundRate(appliedRatePercent),
    appliedWageBandUsed,
  };
}
