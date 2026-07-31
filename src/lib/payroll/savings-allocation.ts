import type { AllocationType, Money, SavingsCategory } from "./types";

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

/** Resolves each requested savings allocation (fixed or percentage-based) against net salary/weekend-support income, applying the "save all weekend-support net income" override when set. */
export function calculateSavingsAllocation(
  _input: SavingsAllocationInput,
): SavingsAllocationResult {
  throw new Error("Not implemented — Phase 2");
}
