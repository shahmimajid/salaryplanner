import { describe, expect, it } from "vitest";
import Decimal from "decimal.js";
import { calculateGrossIncome } from "./gross-income";
import { calculateEPF } from "./epf";
import { calculateSOCSO } from "./socso";
import { calculateEIS } from "./eis";
import { calculateAnnualTaxableIncome } from "./tax-annual-income";
import { calculatePCB } from "./pcb";
import { calculateNetSalary } from "./net-salary";
import { calculateWeekendSupportNet } from "./weekend-support";
import { buildRealisticTestConfig, buildTestProfile } from "./test-fixtures";
import type {
  PayrollConfigSnapshot,
  PayrollProfileSnapshot,
  SocsoCategory,
} from "./types";

const d = (n: number) => new Decimal(n);

/**
 * Composes all 9 calculation-engine functions in the order a real caller
 * (Phase 3's salary-entry flow) is expected to use them. Test-only — not
 * exported from index.ts. See docs/architecture.md for the production
 * orchestration contract this mirrors.
 */
function runFullPipeline(input: {
  basicSalary: Decimal;
  weekendSupportAllowance: Decimal;
  bonus: Decimal;
  zakat: Decimal;
  previousCumulativeIncomeForYear: Decimal;
  previousCumulativePcbPaid: Decimal;
  monthsElapsedInYear: number;
  profile: PayrollProfileSnapshot;
  config: PayrollConfigSnapshot;
}) {
  const gross = calculateGrossIncome({
    basicSalary: input.basicSalary,
    fixedAllowance: d(0),
    weekendSupportAllowance: input.weekendSupportAllowance,
    bonus: input.bonus,
    commission: d(0),
    otherTaxableIncome: d(0),
    otherNonTaxableReimbursement: d(0),
  });

  const epfWage = gross.grossTaxableIncome; // bonus included in EPF wage
  const socsoEisWage = gross.grossTaxableIncome.minus(input.bonus); // bonus excluded

  const epf = calculateEPF({
    epfWage,
    profile: {
      citizenshipStatus: input.profile.citizenshipStatus,
      epfEmployeeRatePercent: input.profile.epfEmployeeRatePercent,
      isBelow60: input.profile.isBelow60,
    },
    config: input.config,
    epfAdjustment: d(0),
  });

  const socsoCategory: SocsoCategory = input.profile.isBelow60
    ? "CATEGORY_1"
    : "CATEGORY_2";
  const socso = calculateSOCSO({
    socsoWage: socsoEisWage,
    category: socsoCategory,
    config: input.config,
  });
  const eis = calculateEIS({
    eisWage: socsoEisWage,
    isEisExempt: false,
    config: input.config,
  });

  const monthsRemainingInYear = 12 - input.monthsElapsedInYear;

  const annualIncome = calculateAnnualTaxableIncome({
    currentMonthGrossTaxableIncome: gross.grossTaxableIncome.minus(input.bonus),
    currentMonthEpfEmployee: epf.employeeContribution,
    previousCumulativeIncomeForYear: input.previousCumulativeIncomeForYear,
    monthsRemainingInYear,
    profile: input.profile,
    config: input.config,
  });

  const pcb = calculatePCB({
    projectedAnnualChargeableIncome:
      annualIncome.projectedAnnualChargeableIncome,
    residencyStatus: input.profile.residencyStatus,
    previousCumulativePcbPaid: input.previousCumulativePcbPaid,
    monthsElapsedInYear: input.monthsElapsedInYear,
    monthsRemainingInYear,
    zakatAmount: input.zakat,
    bonusOrIrregularPayment: input.bonus.gt(0) ? input.bonus : null,
    config: input.config,
  });

  const netSalary = calculateNetSalary({
    grossSalary: gross.grossIncomeTotal,
    epfEmployee: epf.employeeContribution,
    socsoEmployee: socso.employeeContribution,
    eisEmployee: eis.employeeContribution,
    pcb: pcb.currentMonthPcb,
    zakat: input.zakat,
    otherDeductions: d(0),
  });

  return { gross, epf, socso, eis, annualIncome, pcb, netSalary };
}

function runWithAndWithoutWeekendSupport(
  basicSalary: Decimal,
  weekendSupportAllowance: Decimal,
  profile: PayrollProfileSnapshot,
  config: PayrollConfigSnapshot,
) {
  const commonInput = {
    basicSalary,
    bonus: d(0),
    zakat: d(0),
    previousCumulativeIncomeForYear: d(0),
    previousCumulativePcbPaid: d(0),
    monthsElapsedInYear: 0,
    profile,
    config,
  };

  const without = runFullPipeline({
    ...commonInput,
    weekendSupportAllowance: d(0),
  });
  const withWS = runFullPipeline({ ...commonInput, weekendSupportAllowance });

  const weekendSupport = calculateWeekendSupportNet({
    paymentMethod: "MANUAL_TOTAL",
    fixedRatePerDay: null,
    weekendDaysCount: null,
    manualTotalAmount: weekendSupportAllowance,
    fixedMonthlyAmount: null,
    grossSalaryWithoutWeekendSupport: without.gross.grossIncomeTotal,
    netSalaryWithoutWeekendSupport: without.netSalary.netSalary,
    netSalaryWithWeekendSupport: withWS.netSalary.netSalary,
  });

  return { without, withWS, weekendSupport };
}

const config = buildRealisticTestConfig();
const profile = buildTestProfile();

const SALARIES = [d(19088), d(23266)];
const WEEKEND_SUPPORT_AMOUNTS = [
  d(0),
  d(500),
  d(1000),
  d(1500),
  d(2000),
  d(3000),
];

describe("full pipeline — representative salary and weekend-support scenarios", () => {
  it.each(
    SALARIES.flatMap((salary) =>
      WEEKEND_SUPPORT_AMOUNTS.map((ws) => [salary, ws] as const),
    ),
  )("salary=%s weekendSupport=%s stays internally consistent", (salary, ws) => {
    const { without, withWS, weekendSupport } = runWithAndWithoutWeekendSupport(
      salary,
      ws,
      profile,
      config,
    );

    expect(withWS.netSalary.netSalary.lte(withWS.gross.grossIncomeTotal)).toBe(
      true,
    );
    expect(withWS.netSalary.effectiveTakeHomePercent.gte(0)).toBe(true);
    expect(withWS.netSalary.effectiveTakeHomePercent.lte(100)).toBe(true);

    if (ws.gt(0)) {
      expect(withWS.netSalary.netSalary.gt(without.netSalary.netSalary)).toBe(
        true,
      );
      expect(weekendSupport.netAdditionalIncomeFromWeekendSupport.gt(0)).toBe(
        true,
      );
    } else {
      expect(
        weekendSupport.netAdditionalIncomeFromWeekendSupport.toString(),
      ).toBe("0");
    }
  });

  it("produces a scenario report for RM19,088 and RM23,266 across the weekend-support sweep", () => {
    const rows = SALARIES.flatMap((salary) =>
      WEEKEND_SUPPORT_AMOUNTS.map((ws) => {
        const { withWS, weekendSupport } = runWithAndWithoutWeekendSupport(
          salary,
          ws,
          profile,
          config,
        );
        return {
          basicSalary: salary.toFixed(2),
          weekendSupportGross: ws.toFixed(2),
          grossSalary: withWS.gross.grossIncomeTotal.toFixed(2),
          epf: withWS.epf.employeeContribution.toFixed(2),
          socso: withWS.socso.employeeContribution.toFixed(2),
          eis: withWS.eis.employeeContribution.toFixed(2),
          pcb: withWS.pcb.currentMonthPcb.toFixed(2),
          netSalary: withWS.netSalary.netSalary.toFixed(2),
          netWeekendSupport:
            weekendSupport.netAdditionalIncomeFromWeekendSupport.toFixed(2),
          takeHomePercent: withWS.netSalary.effectiveTakeHomePercent.toFixed(3),
        };
      }),
    );

    // This table IS the Phase 2 "show test results for representative
    // scenarios" deliverable — see docs/phase-2-results.md.
    console.table(rows);

    expect(rows).toHaveLength(SALARIES.length * WEEKEND_SUPPORT_AMOUNTS.length);
  });

  it("gives a family with full reliefs a lower PCB than a single taxpayer at the same salary", () => {
    const married = runFullPipeline({
      basicSalary: d(19088),
      weekendSupportAllowance: d(0),
      bonus: d(0),
      zakat: d(0),
      previousCumulativeIncomeForYear: d(0),
      previousCumulativePcbPaid: d(0),
      monthsElapsedInYear: 0,
      profile: buildTestProfile(),
      config,
    });

    const single = runFullPipeline({
      basicSalary: d(19088),
      weekendSupportAllowance: d(0),
      bonus: d(0),
      zakat: d(0),
      previousCumulativeIncomeForYear: d(0),
      previousCumulativePcbPaid: d(0),
      monthsElapsedInYear: 0,
      profile: buildTestProfile({
        maritalStatus: "SINGLE",
        spouseHasIncome: false,
        childReliefClaims: [],
      }),
      config,
    });

    expect(married.pcb.currentMonthPcb.lt(single.pcb.currentMonthPcb)).toBe(
      true,
    );
  });

  it("increases PCB correctly for a bonus scenario", () => {
    const withoutBonus = runFullPipeline({
      basicSalary: d(19088),
      weekendSupportAllowance: d(0),
      bonus: d(0),
      zakat: d(0),
      previousCumulativeIncomeForYear: d(0),
      previousCumulativePcbPaid: d(0),
      monthsElapsedInYear: 0,
      profile,
      config,
    });

    const withBonus = runFullPipeline({
      basicSalary: d(19088),
      weekendSupportAllowance: d(0),
      bonus: d(5000),
      zakat: d(0),
      previousCumulativeIncomeForYear: d(0),
      previousCumulativePcbPaid: d(0),
      monthsElapsedInYear: 0,
      profile,
      config,
    });

    expect(
      withBonus.pcb.currentMonthPcb.gt(withoutBonus.pcb.currentMonthPcb),
    ).toBe(true);
    // Bonus is included in gross/net but excluded from the annualized PCB base.
    expect(withBonus.gross.grossIncomeTotal.toString()).toBe(
      withoutBonus.gross.grossIncomeTotal.plus(5000).toString(),
    );
  });

  it("reduces net PCB burden for a zakat scenario", () => {
    const withoutZakat = runFullPipeline({
      basicSalary: d(19088),
      weekendSupportAllowance: d(0),
      bonus: d(0),
      zakat: d(0),
      previousCumulativeIncomeForYear: d(0),
      previousCumulativePcbPaid: d(0),
      monthsElapsedInYear: 0,
      profile,
      config,
    });

    const withZakat = runFullPipeline({
      basicSalary: d(19088),
      weekendSupportAllowance: d(0),
      bonus: d(0),
      zakat: d(200),
      previousCumulativeIncomeForYear: d(0),
      previousCumulativePcbPaid: d(0),
      monthsElapsedInYear: 0,
      profile,
      config,
    });

    expect(
      withZakat.pcb.currentMonthPcb.lte(withoutZakat.pcb.currentMonthPcb),
    ).toBe(true);
  });

  it("produces different results across a config effective-date change, proving no hidden constants", () => {
    // The employee-side EPF rate always comes from profile.epfEmployeeRatePercent
    // (the user's elected rate), never the config row — so this test bumps the
    // *employer* rate instead, which the config row does drive.
    const configV1 = buildRealisticTestConfig({ version: "test-v1" });
    const configV2 = buildRealisticTestConfig({
      version: "test-v2",
      epfRates: configV1.epfRates.map((r) =>
        r.citizenshipStatus === "CITIZEN" && r.maxAge === 59
          ? { ...r, employerRatePercent: d(15) } // employer rate bumped in the newer config
          : r,
      ),
    });

    const resultV1 = runFullPipeline({
      basicSalary: d(19088),
      weekendSupportAllowance: d(0),
      bonus: d(0),
      zakat: d(0),
      previousCumulativeIncomeForYear: d(0),
      previousCumulativePcbPaid: d(0),
      monthsElapsedInYear: 0,
      profile,
      config: configV1,
    });

    const resultV2 = runFullPipeline({
      basicSalary: d(19088),
      weekendSupportAllowance: d(0),
      bonus: d(0),
      zakat: d(0),
      previousCumulativeIncomeForYear: d(0),
      previousCumulativePcbPaid: d(0),
      monthsElapsedInYear: 0,
      profile,
      config: configV2,
    });

    expect(resultV1.epf.employerContribution.toString()).not.toBe(
      resultV2.epf.employerContribution.toString(),
    );
  });
});
