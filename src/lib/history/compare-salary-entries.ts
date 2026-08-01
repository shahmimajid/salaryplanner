import { loadCalculationDetail, type CalculationDetail } from "@/lib/history/load-calculation-detail";

export interface SalaryEntryComparison {
  a: CalculationDetail;
  b: CalculationDetail;
}

/**
 * Pure reuse of loadCalculationDetail, called twice — inherits its
 * ownership check and versioned-config-pinned recompute unchanged. Returns
 * null if either lookup fails (not found or not owned), same
 * not-distinguishing-why convention as the rest of history/.
 */
export async function compareSalaryEntries(
  userId: string,
  idA: string,
  idB: string,
): Promise<SalaryEntryComparison | null> {
  const [a, b] = await Promise.all([
    loadCalculationDetail(userId, idA),
    loadCalculationDetail(userId, idB),
  ]);
  if (!a || !b) return null;
  return { a, b };
}
