import { describe, expect, it } from "vitest";
import { salaryHistoryToCsv } from "./to-csv";
import type { SalaryEntryExportRow } from "./list-salary-entries-for-export";

function row(overrides: Partial<SalaryEntryExportRow> = {}): SalaryEntryExportRow {
  return {
    payrollMonth: "2026-01",
    basicSalary: "5000",
    weekendSupportAllowance: "0",
    grossSalary: "5000",
    epf: "550",
    socso: "39.75",
    eis: "39.5",
    pcb: "100",
    zakat: "0",
    totalDeductions: "729.25",
    netSalary: "4270.75",
    netWeekendSupportIncome: "0",
    effectiveDeductionRatePercent: "14.585",
    totalSavings: "500.00",
    ...overrides,
  };
}

describe("salaryHistoryToCsv", () => {
  it("includes a header row and one line per entry", () => {
    const csv = salaryHistoryToCsv([row()]);
    const lines = csv.trim().split("\r\n");

    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe(
      "Payroll month,Basic salary,Weekend-support allowance,Gross salary,EPF,SOCSO,EIS,PCB,Zakat,Total deductions,Net salary,Net weekend-support income,Effective deduction rate %,Total savings",
    );
    expect(lines[1]).toBe("2026-01,5000,0,5000,550,39.75,39.5,100,0,729.25,4270.75,0,14.585,500.00");
  });

  it("returns just the header for an empty row set", () => {
    const csv = salaryHistoryToCsv([]);
    expect(csv.trim().split("\r\n")).toHaveLength(1);
  });

  it("quotes and escapes a field containing a comma, quote, or newline", () => {
    const csv = salaryHistoryToCsv([row({ payrollMonth: 'has,"comma"\nand newline' })]);
    const [, dataLine] = csv.trim().split("\r\n");

    expect(dataLine.startsWith('"has,""comma""')).toBe(true);
  });
});
