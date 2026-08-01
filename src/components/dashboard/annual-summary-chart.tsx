"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { AccessibleChartFigure } from "@/components/dashboard/accessible-chart-figure";
import { formatRinggit } from "@/lib/utils/currency";
import type { AnnualSummary } from "@/lib/history/annual-summary";

export function AnnualSummaryChart({ summary }: { summary: AnnualSummary }) {
  const rows = [
    { name: "Basic salary", value: Number(summary.totalBasicSalary) },
    { name: "Weekend support", value: Number(summary.totalWeekendSupportAllowance) },
    { name: "EPF", value: Number(summary.totalEpf) },
    { name: "SOCSO", value: Number(summary.totalSocso) },
    { name: "EIS", value: Number(summary.totalEis) },
    { name: "PCB", value: Number(summary.totalPcb) },
    { name: "Net salary", value: Number(summary.totalNetSalary) },
    { name: "Savings", value: Number(summary.totalSavings) },
  ].filter((row) => row.value > 0);

  if (rows.length === 0) {
    return null;
  }

  return (
    <AccessibleChartFigure
      title={`${summary.year} totals`}
      caption={`Across ${summary.monthCount} saved month${summary.monthCount === 1 ? "" : "s"}.`}
      rows={rows.map((r) => ({ label: r.name, value: formatRinggit(r.value) }))}
    >
      <ResponsiveContainer width="100%" height={40 * rows.length + 40}>
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 8, right: 72, left: 8, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" hide domain={[0, (dataMax: number) => dataMax * 1.35]} />
          <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={100} />
          <Bar dataKey="value" fill="var(--chart-2)" radius={[0, 4, 4, 0]}>
            <LabelList dataKey="value" position="right" formatter={(v) => formatRinggit(Number(v))} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </AccessibleChartFigure>
  );
}
