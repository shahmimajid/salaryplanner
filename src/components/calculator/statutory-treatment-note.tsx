/**
 * Single source of truth for which statutory calculations (EPF/SOCSO/EIS/
 * PCB) each income field feeds into — kept as data, not scattered inline
 * JSX, so it stays easy to keep in sync with the engine's actual behavior
 * (gross-income.ts, run-pipeline.ts). Wording verified against code, not
 * assumed — see docs/assumptions.md for the sourcing behind each rule.
 */
export const STATUTORY_TREATMENT_NOTES = {
  basicSalary: "Included in EPF, SOCSO, EIS, and PCB.",
  fixedAllowance: "Included in EPF, SOCSO, EIS, and PCB.",
  weekendSupportAllowance: "Included in EPF, SOCSO, EIS, and PCB.",
  bonus:
    "Included in EPF. Excluded from SOCSO/EIS wages. PCB is estimated separately as a lump sum, not the regular monthly method.",
  commission: "Included in EPF, SOCSO, EIS, and PCB.",
  overtime:
    "Excluded from EPF wages (EPF Act Third Schedule). Included in SOCSO, EIS, and PCB — the SOCSO/EIS inclusion is this app's assumption, not yet confirmed against an official source.",
  otherTaxableIncome: "Included in EPF, SOCSO, EIS, and PCB.",
  otherNonTaxableReimbursement:
    "Not treated as income for EPF, SOCSO, EIS, or PCB — a non-taxable reimbursement.",
} as const;

export function StatutoryTreatmentNote({
  field,
}: {
  field: keyof typeof STATUTORY_TREATMENT_NOTES;
}) {
  return (
    <p className="text-muted-foreground text-xs">
      {STATUTORY_TREATMENT_NOTES[field]}
    </p>
  );
}
