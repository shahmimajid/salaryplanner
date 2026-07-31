import Decimal from "decimal.js";
import type { AllocationType, Money, SavingsCategory } from "./types";
import { roundMoney } from "./rounding";

export interface SavingsAllocationRequest {
  category: SavingsCategory;
  allocationType: AllocationType;
  amount: Money | null; // used when allocationType = FIXED_AMOUNT
  percentage: Money | null; // used when allocationType = PERCENTAGE
}

export interface SavingsAllocationInput {
  netSalary: Money;
  netWeekendSupportIncome: Money;
  saveAllNetWeekendSupport: boolean;
  requests: SavingsAllocationRequest[];
}

export interface SavingsAllocationResult {
  allocations: Array<{ category: SavingsCategory; computedAmount: Money }>;
  totalAllocated: Money;
  unallocatedRemainder: Money;
}

const WEEKEND_SUPPORT_SAVINGS: SavingsCategory = "WEEKEND_SUPPORT_SAVINGS";

/** Resolves each requested savings allocation (fixed or percentage-based) against net salary/weekend-support income, applying the "save all weekend-support net income" override when set. */
export function calculateSavingsAllocation(
  input: SavingsAllocationInput,
): SavingsAllocationResult {
  const {
    netSalary,
    netWeekendSupportIncome,
    saveAllNetWeekendSupport,
    requests,
  } = input;

  const allocations = requests.map((req) => {
    const computedAmount =
      req.allocationType === "FIXED_AMOUNT"
        ? (req.amount ?? new Decimal(0))
        : netSalary.times(req.percentage ?? new Decimal(0)).div(100);
    return { category: req.category, computedAmount };
  });

  if (saveAllNetWeekendSupport) {
    // "Save all net weekend-support income" forces the entire amount into
    // the WEEKEND_SUPPORT_SAVINGS category, overriding whatever that
    // request's own type/amount/percentage said. If no such request was
    // supplied, one is synthesized.
    const existing = allocations.find(
      (a) => a.category === WEEKEND_SUPPORT_SAVINGS,
    );
    if (existing) {
      existing.computedAmount = netWeekendSupportIncome;
    } else {
      allocations.push({
        category: WEEKEND_SUPPORT_SAVINGS,
        computedAmount: netWeekendSupportIncome,
      });
    }
  }

  const totalAllocated = allocations.reduce(
    (sum, a) => sum.plus(a.computedAmount),
    new Decimal(0),
  );

  // Not clamped at zero — overallocation surfaces as a negative remainder
  // so a future UI can warn the user rather than hiding the overage.
  const unallocatedRemainder = netSalary.minus(totalAllocated);

  return {
    allocations: allocations.map((a) => ({
      category: a.category,
      computedAmount: roundMoney(a.computedAmount),
    })),
    totalAllocated: roundMoney(totalAllocated),
    unallocatedRemainder: roundMoney(unallocatedRemainder),
  };
}
