import Decimal from "decimal.js";
import type { PayrollProfileSnapshot } from "../types";

/**
 * The spec's own example default profile (§2): Malaysian citizen, below
 * 60, tax resident, married with a spouse who has no income, four
 * children below 18 each fully (100%) claimed, EPF employee rate 11%,
 * LINDUNG 24 Jam excluded, no zakat. There is no profile-editing UI or
 * persistence yet (Phase 4) — every calculation in local mode uses this
 * constant.
 */
export const DEFAULT_PAYROLL_PROFILE: PayrollProfileSnapshot = {
  citizenshipStatus: "CITIZEN",
  isBelow60: true,
  residencyStatus: "RESIDENT",
  maritalStatus: "MARRIED",
  spouseHasIncome: false,
  numberOfChildren: 4,
  childReliefClaims: [
    { belowAge18: true, reliefPercentageClaimed: 100 },
    { belowAge18: true, reliefPercentageClaimed: 100 },
    { belowAge18: true, reliefPercentageClaimed: 100 },
    { belowAge18: true, reliefPercentageClaimed: 100 },
  ],
  epfEmployeeRatePercent: new Decimal(11),
  lindung24JamOptIn: false,
  zakatEnabled: false,
};
