import Decimal from "decimal.js";
import type {
  Money,
  PayrollConfigSnapshot,
  PayrollProfileSnapshot,
} from "./types";
import { roundMoney, roundRate } from "./rounding";

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

  // PayrollProfileSnapshot only exposes isBelow60 (not a raw age), so a
  // config row is treated as the "below 60" row if it declares an upper
  // bound (maxAge), the "60+" row if it declares a lower bound (minAge),
  // and a row with neither bound set is a citizenship-wide universal rate
  // that applies regardless of age (e.g. NON_CITIZEN in the seed data).
  const candidates = config.epfRates.filter(
    (row) => row.citizenshipStatus === profile.citizenshipStatus,
  );
  const rateRow =
    candidates.find((row) =>
      profile.isBelow60 ? row.maxAge !== null : row.minAge !== null,
    ) ?? candidates.find((row) => row.minAge === null && row.maxAge === null);

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
    const band = config.epfWageBands.find(
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
    employeeContribution: roundMoney(employeeContribution),
    employerContribution: roundMoney(employerContribution),
    appliedRatePercent: roundRate(appliedRatePercent),
    appliedWageBandUsed,
  };
}
