// TEST-ONLY SYNTHETIC FIXTURE — not used in production seeding
// (prisma/seed-data/*.json is separate). Do not import outside *.test.ts.
//
// Distinct from the production seed: this config is shaped so realistic
// RM19k-23k monthly / ~RM230k-280k annualized salaries exercise every
// branch of the calculation engine non-degenerately (percentage-based EPF,
// capped SOCSO/EIS, a non-empty tax bracket), rather than the production
// seed's deliberately sparse illustrative tables.

import Decimal from "decimal.js";
import type { PayrollConfigSnapshot, PayrollProfileSnapshot } from "./types";

function d(value: number): Decimal {
  return new Decimal(value);
}

export function buildRealisticTestConfig(
  overrides?: Partial<PayrollConfigSnapshot>,
): PayrollConfigSnapshot {
  const base: PayrollConfigSnapshot = {
    version: "test-2026.1",
    effectiveFrom: "2026-01-01",
    effectiveTo: null,
    epfRates: [
      {
        citizenshipStatus: "CITIZEN",
        minAge: null,
        maxAge: 59,
        employeeRatePercent: d(11),
        employerRatePercent: d(13),
      },
      {
        citizenshipStatus: "CITIZEN",
        minAge: 60,
        maxAge: null,
        employeeRatePercent: d(5.5),
        employerRatePercent: d(4),
      },
      {
        citizenshipStatus: "NON_CITIZEN",
        minAge: null,
        maxAge: null,
        employeeRatePercent: d(0),
        employerRatePercent: d(0),
      },
    ],
    // Deliberately tiny — only exercised by low-wage tests; realistic
    // RM19k+ salaries always fall through to the percentage path.
    epfWageBands: [
      {
        citizenshipStatus: "CITIZEN",
        minAge: null,
        maxAge: null,
        wageFrom: d(0),
        wageTo: d(10),
        employeeContribution: d(0),
        employerContribution: d(0),
      },
      {
        citizenshipStatus: "CITIZEN",
        minAge: null,
        maxAge: null,
        wageFrom: d(10.01),
        wageTo: d(20),
        employeeContribution: d(1),
        employerContribution: d(3),
      },
      {
        citizenshipStatus: "CITIZEN",
        minAge: null,
        maxAge: null,
        wageFrom: d(20.01),
        wageTo: d(50),
        employeeContribution: d(3),
        employerContribution: d(6),
      },
    ],
    socsoRates: [
      {
        category: "CATEGORY_1",
        wageFrom: d(0),
        wageTo: d(6000),
        employeeContribution: d(39.75),
        employerContribution: d(139.25),
      },
      {
        category: "CATEGORY_2",
        wageFrom: d(0),
        wageTo: d(6000),
        employeeContribution: d(0),
        employerContribution: d(59.4),
      },
    ],
    eisRates: [
      {
        wageFrom: d(0),
        wageTo: d(6000),
        employeeContribution: d(39.5),
        employerContribution: d(39.5),
      },
    ],
    taxBrackets: [
      {
        residencyStatus: "RESIDENT",
        chargeableIncomeFrom: d(0),
        chargeableIncomeTo: d(5000),
        ratePercent: d(0),
        cumulativeTaxBase: d(0),
      },
      {
        residencyStatus: "RESIDENT",
        chargeableIncomeFrom: d(5000.01),
        chargeableIncomeTo: d(20000),
        ratePercent: d(1),
        cumulativeTaxBase: d(0),
      },
      {
        residencyStatus: "RESIDENT",
        chargeableIncomeFrom: d(20000.01),
        chargeableIncomeTo: d(35000),
        ratePercent: d(3),
        cumulativeTaxBase: d(150),
      },
      {
        residencyStatus: "RESIDENT",
        chargeableIncomeFrom: d(35000.01),
        chargeableIncomeTo: d(50000),
        ratePercent: d(6),
        cumulativeTaxBase: d(600),
      },
      {
        residencyStatus: "RESIDENT",
        chargeableIncomeFrom: d(50000.01),
        chargeableIncomeTo: d(70000),
        ratePercent: d(11),
        cumulativeTaxBase: d(1500),
      },
      {
        residencyStatus: "RESIDENT",
        chargeableIncomeFrom: d(70000.01),
        chargeableIncomeTo: d(100000),
        ratePercent: d(19),
        cumulativeTaxBase: d(3700),
      },
      {
        residencyStatus: "RESIDENT",
        chargeableIncomeFrom: d(100000.01),
        chargeableIncomeTo: d(400000),
        ratePercent: d(25),
        cumulativeTaxBase: d(9400),
      },
      {
        residencyStatus: "RESIDENT",
        chargeableIncomeFrom: d(400000.01),
        chargeableIncomeTo: d(600000),
        ratePercent: d(26),
        cumulativeTaxBase: d(84400),
      },
      {
        residencyStatus: "RESIDENT",
        chargeableIncomeFrom: d(600000.01),
        chargeableIncomeTo: d(2000000),
        ratePercent: d(28),
        cumulativeTaxBase: d(136400),
      },
      {
        residencyStatus: "RESIDENT",
        chargeableIncomeFrom: d(2000000.01),
        chargeableIncomeTo: null,
        ratePercent: d(30),
        cumulativeTaxBase: d(528400),
      },
      {
        residencyStatus: "NON_RESIDENT",
        chargeableIncomeFrom: d(0),
        chargeableIncomeTo: null,
        ratePercent: d(30),
        cumulativeTaxBase: d(0),
      },
    ],
    taxReliefs: [
      { code: "SELF", maxAmount: d(9000) },
      { code: "SPOUSE", maxAmount: d(4000) },
      { code: "CHILD_BELOW_18", maxAmount: d(2000) },
      { code: "EPF_LIFE_INSURANCE", maxAmount: d(7000) },
    ],
    taxRebates: [{ code: "ZAKAT_REBATE", amount: null, incomeThreshold: null }],
  };

  return { ...base, ...overrides };
}

export function buildTestProfile(
  overrides?: Partial<PayrollProfileSnapshot>,
): PayrollProfileSnapshot {
  const base: PayrollProfileSnapshot = {
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
    epfEmployeeRatePercent: d(11),
    lindung24JamOptIn: false,
    zakatEnabled: false,
  };

  return { ...base, ...overrides };
}
