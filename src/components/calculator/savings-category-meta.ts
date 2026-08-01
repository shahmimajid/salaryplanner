import type { SavingsCategory } from "@/lib/payroll/types";

export type SavingsCategoryGroup = "EXPENSE" | "SAVINGS";

interface SavingsCategoryMeta {
  label: string;
  group: SavingsCategoryGroup;
  tooltip: string;
}

// Ordered so the form renders expenses first, then savings — mirrors how
// spec §6 lists the categories. calculateSavingsAllocation itself has no
// notion of "expense vs savings"; that split is presentation logic, kept
// here rather than in src/lib/payroll/ (see docs/architecture.md).
export const SAVINGS_CATEGORY_META: Record<
  SavingsCategory,
  SavingsCategoryMeta
> = {
  HOUSING: {
    label: "Housing",
    group: "EXPENSE",
    tooltip: "Rent, mortgage, or housing-related payments.",
  },
  CAR: {
    label: "Car",
    group: "EXPENSE",
    tooltip: "Car loan, fuel, and vehicle-related expenses.",
  },
  UTILITIES: {
    label: "Utilities",
    group: "EXPENSE",
    tooltip: "Electricity, water, internet, and phone bills.",
  },
  FOOD: { label: "Food", group: "EXPENSE", tooltip: "Groceries and dining." },
  CHILDREN: {
    label: "Children",
    group: "EXPENSE",
    tooltip: "School fees, childcare, and other child-related costs.",
  },
  INSURANCE_TAKAFUL: {
    label: "Insurance / takaful",
    group: "EXPENSE",
    tooltip: "Insurance or takaful premiums.",
  },
  DEBT: {
    label: "Debt payments",
    group: "EXPENSE",
    tooltip: "Loan repayments and other debt obligations.",
  },
  PERSONAL_SPENDING: {
    label: "Personal spending",
    group: "EXPENSE",
    tooltip: "Discretionary personal spending.",
  },
  INVESTMENT: {
    label: "Investment",
    group: "SAVINGS",
    tooltip: "Money set aside for investing.",
  },
  EMERGENCY_FUND: {
    label: "Emergency fund",
    group: "SAVINGS",
    tooltip: "Money set aside for unexpected expenses.",
  },
  GENERAL_SAVINGS: {
    label: "General savings",
    group: "SAVINGS",
    tooltip: "General, unearmarked savings.",
  },
  WEEKEND_SUPPORT_SAVINGS: {
    label: "Weekend-support savings",
    group: "SAVINGS",
    tooltip: "Savings specifically funded by your weekend-support allowance.",
  },
};

export const SAVINGS_CATEGORIES = Object.keys(
  SAVINGS_CATEGORY_META,
) as SavingsCategory[];
