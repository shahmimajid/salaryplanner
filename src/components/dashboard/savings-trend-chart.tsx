"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { AccessibleChartFigure } from "@/components/dashboard/accessible-chart-figure";
import { formatRinggit } from "@/lib/utils/currency";
import type { MonthlySeriesPoint } from "@/lib/history/list-monthly-series";

export function SavingsTrendChart({ data }: { data: MonthlySeriesPoint[] }) {
  if (data.length === 0) {
    return null;
  }

  const rows = data.map((point) => ({
    payrollMonth: point.payrollMonth,
    totalSavings: Number(point.totalSavings),
  }));

  return (
    <AccessibleChartFigure
      title="Monthly savings trend"
      caption="Total savings allocated per saved month."
      rows={rows.map((r) => ({ label: r.payrollMonth, value: formatRinggit(r.totalSavings) }))}
    >
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={rows} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="payrollMonth" tickLine={false} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={72}
            tickFormatter={(v) => formatRinggit(Number(v))}
          />
          <Line
            type="monotone"
            dataKey="totalSavings"
            stroke="var(--chart-2)"
            strokeWidth={2}
            dot
          />
        </LineChart>
      </ResponsiveContainer>
    </AccessibleChartFigure>
  );
}
