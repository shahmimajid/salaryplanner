"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { AccessibleChartFigure } from "@/components/dashboard/accessible-chart-figure";
import { formatRinggit } from "@/lib/utils/currency";
import type { MonthlySeriesPoint } from "@/lib/history/list-monthly-series";

export function SalaryHistoryChart({ data }: { data: MonthlySeriesPoint[] }) {
  if (data.length === 0) {
    return null;
  }

  const rows = data.map((point) => ({
    payrollMonth: point.payrollMonth,
    grossSalary: Number(point.grossSalary),
    netSalary: Number(point.netSalary),
    weekendSupportNetAmount: Number(point.weekendSupportNetAmount),
  }));

  const tableRows = rows.flatMap((r) => [
    { label: `${r.payrollMonth} — gross`, value: formatRinggit(r.grossSalary) },
    { label: `${r.payrollMonth} — net`, value: formatRinggit(r.netSalary) },
    { label: `${r.payrollMonth} — weekend-support net`, value: formatRinggit(r.weekendSupportNetAmount) },
  ]);

  return (
    <AccessibleChartFigure
      title="Salary and support history"
      caption="Gross, net, and net weekend-support income across saved months."
      rows={tableRows}
    >
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={rows} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="payrollMonth" tickLine={false} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={72}
            tickFormatter={(v) => formatRinggit(Number(v))}
          />
          <Legend />
          {/* Achromatic palette — each series also gets a distinct
              strokeDasharray so lines are readable without relying on
              colour alone, since per-point on-mark labels aren't practical
              with this many data points. */}
          <Line
            type="monotone"
            dataKey="grossSalary"
            name="Gross salary"
            stroke="var(--chart-2)"
            strokeWidth={2}
            strokeDasharray="0"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="netSalary"
            name="Net salary"
            stroke="var(--chart-3)"
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="weekendSupportNetAmount"
            name="Weekend-support net"
            stroke="var(--chart-4)"
            strokeWidth={2}
            strokeDasharray="2 2"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </AccessibleChartFigure>
  );
}
