import Decimal from "decimal.js";
import { deriveZakat, type CalculateSalaryEntryResult } from "@/lib/payroll/run-pipeline";
import type { Money } from "@/lib/payroll/types";

function money(value: Money): string {
  return value.toFixed(2);
}

function rate(value: Money): string {
  return value.toFixed(3);
}

export interface SalaryCalculationViewModel {
  grossSalary: string;
  epf: string;
  epfEmployer: string;
  socso: string;
  socsoMaxReached: boolean;
  eis: string;
  eisMaxReached: boolean;
  pcb: string;
  zakat: string;
  totalDeductions: string;
  netSalary: string;
  effectiveDeductionRatePercent: string;
  effectiveTakeHomePercent: string;
  weekendSupport: {
    grossAmount: string;
    additionalEpf: string;
    additionalSocso: string;
    additionalSocsoCapped: boolean;
    additionalEis: string;
    additionalEisCapped: boolean;
    additionalPcb: string;
    netAdditionalIncome: string;
    percentRetained: string;
    comparison: {
      withoutWeekendSupport: { grossSalary: string; netSalary: string };
      withWeekendSupport: { grossSalary: string; netSalary: string };
    };
  };
}

/**
 * Converts the engine's Decimal-based result into plain strings — Server
 * Actions can only return serializable data, and Decimal instances aren't.
 * Per-statutory-component weekend-support deltas (and each's
 * "ceiling already reached" flag) are presentation-only derivations, computed
 * here by diffing the with/without pipeline runs rather than in the engine.
 */
export function toSalaryCalculationViewModel(
  result: CalculateSalaryEntryResult,
): SalaryCalculationViewModel {
  const {
    withWeekendSupport: w,
    withoutWeekendSupport: wo,
    weekendSupport,
  } = result;

  const zakat = deriveZakat(w);

  const percentRetained = new Decimal(100).minus(
    weekendSupport.effectiveMarginalDeductionRatePercent,
  );

  return {
    grossSalary: money(w.gross.grossIncomeTotal),
    epf: money(w.epf.employeeContribution),
    epfEmployer: money(w.epf.employerContribution),
    socso: money(w.socso.employeeContribution),
    socsoMaxReached: w.socso.isMaxContributionReached,
    eis: money(w.eis.employeeContribution),
    eisMaxReached: w.eis.isMaxContributionReached,
    pcb: money(w.pcb.currentMonthPcb),
    zakat: money(zakat),
    totalDeductions: money(w.netSalary.totalDeductions),
    netSalary: money(w.netSalary.netSalary),
    effectiveDeductionRatePercent: rate(
      w.netSalary.effectiveDeductionRatePercent,
    ),
    effectiveTakeHomePercent: rate(w.netSalary.effectiveTakeHomePercent),
    weekendSupport: {
      grossAmount: money(weekendSupport.weekendSupportGrossAmount),
      additionalEpf: money(
        w.epf.employeeContribution.minus(wo.epf.employeeContribution),
      ),
      additionalSocso: money(
        w.socso.employeeContribution.minus(wo.socso.employeeContribution),
      ),
      additionalSocsoCapped: wo.socso.isMaxContributionReached,
      additionalEis: money(
        w.eis.employeeContribution.minus(wo.eis.employeeContribution),
      ),
      additionalEisCapped: wo.eis.isMaxContributionReached,
      additionalPcb: money(w.pcb.currentMonthPcb.minus(wo.pcb.currentMonthPcb)),
      netAdditionalIncome: money(
        weekendSupport.netAdditionalIncomeFromWeekendSupport,
      ),
      percentRetained: rate(percentRetained),
      comparison: {
        withoutWeekendSupport: {
          grossSalary: money(wo.gross.grossIncomeTotal),
          netSalary: money(wo.netSalary.netSalary),
        },
        withWeekendSupport: {
          grossSalary: money(w.gross.grossIncomeTotal),
          netSalary: money(w.netSalary.netSalary),
        },
      },
    },
  };
}
