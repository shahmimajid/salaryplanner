import type { SalaryEntryExportRow } from "@/lib/export/list-salary-entries-for-export";

const COLUMNS: Array<{ header: string; key: keyof SalaryEntryExportRow }> = [
  { header: "Payroll month", key: "payrollMonth" },
  { header: "Basic salary", key: "basicSalary" },
  { header: "Weekend-support allowance", key: "weekendSupportAllowance" },
  { header: "Gross salary", key: "grossSalary" },
  { header: "EPF", key: "epf" },
  { header: "SOCSO", key: "socso" },
  { header: "EIS", key: "eis" },
  { header: "PCB", key: "pcb" },
  { header: "Zakat", key: "zakat" },
  { header: "Total deductions", key: "totalDeductions" },
  { header: "Net salary", key: "netSalary" },
  { header: "Net weekend-support income", key: "netWeekendSupportIncome" },
  { header: "Effective deduction rate %", key: "effectiveDeductionRatePercent" },
  { header: "Total savings", key: "totalSavings" },
];

/** RFC 4180 field escaping: wrap in quotes if it contains a comma, quote, or newline; double any internal quotes. */
function escapeField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function salaryHistoryToCsv(rows: SalaryEntryExportRow[]): string {
  const lines = [COLUMNS.map((c) => escapeField(c.header)).join(",")];
  for (const row of rows) {
    lines.push(COLUMNS.map((c) => escapeField(row[c.key])).join(","));
  }
  return lines.join("\r\n") + "\r\n";
}
