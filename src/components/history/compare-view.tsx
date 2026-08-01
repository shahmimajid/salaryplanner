import Decimal from "decimal.js";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatRinggit } from "@/lib/utils/currency";
import type { SalaryEntryComparison } from "@/lib/history/compare-salary-entries";

function moneyRow(label: string, aValue: string, bValue: string) {
  const delta = new Decimal(bValue).minus(aValue);
  const sign = delta.isPositive() ? "+" : "";
  return { label, aValue, bValue, delta: `${sign}${formatRinggit(delta.toString())}` };
}

export function CompareView({ comparison }: { comparison: SalaryEntryComparison }) {
  const { a, b } = comparison;

  const rows = [
    moneyRow("Gross salary", a.data.grossSalary, b.data.grossSalary),
    moneyRow("EPF (employee)", a.data.epf, b.data.epf),
    moneyRow("SOCSO (employee)", a.data.socso, b.data.socso),
    moneyRow("EIS (employee)", a.data.eis, b.data.eis),
    moneyRow("PCB", a.data.pcb, b.data.pcb),
    moneyRow("Zakat", a.data.zakat, b.data.zakat),
    moneyRow("Total deductions", a.data.totalDeductions, b.data.totalDeductions),
    moneyRow("Net salary", a.data.netSalary, b.data.netSalary),
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {a.payrollMonth} vs {b.payrollMonth}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">
              Side-by-side comparison of {a.payrollMonth} and {b.payrollMonth}
            </caption>
            <thead>
              <tr className="text-muted-foreground border-b text-left">
                <th className="py-2 font-medium">Figure</th>
                <th className="py-2 text-right font-medium">{a.payrollMonth}</th>
                <th className="py-2 text-right font-medium">{b.payrollMonth}</th>
                <th className="py-2 text-right font-medium">Change</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-b last:border-0">
                  <td className="py-2">{row.label}</td>
                  <td className="py-2 text-right">{formatRinggit(row.aValue)}</td>
                  <td className="py-2 text-right">{formatRinggit(row.bValue)}</td>
                  <td className="py-2 text-right font-medium">{row.delta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
