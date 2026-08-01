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
import type { SalaryCalculationViewModel } from "@/components/calculator/to-view-model";

export function WeekendSupportChart({
  data,
}: {
  data: SalaryCalculationViewModel;
}) {
  const ws = data.weekendSupport;
  if (ws.grossAmount === "0.00") {
    return null;
  }

  const rows = [
    { name: "Gross weekend support", value: Number(ws.grossAmount) },
    { name: "Net weekend support", value: Number(ws.netAdditionalIncome) },
  ];
  const deducted = Number(ws.grossAmount) - Number(ws.netAdditionalIncome);

  return (
    <AccessibleChartFigure
      title="Weekend-support gross vs net"
      caption={`${formatRinggit(deducted)} went to statutory deductions (EPF/SOCSO/EIS/PCB).`}
      rows={rows.map((r) => ({ label: r.name, value: formatRinggit(r.value) }))}
    >
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={rows}
          margin={{ top: 24, right: 8, left: 8, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} />
          <YAxis hide />
          <Bar dataKey="value" fill="var(--chart-4)" radius={[4, 4, 0, 0]}>
            <LabelList
              dataKey="value"
              position="top"
              formatter={(v) => formatRinggit(Number(v))}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </AccessibleChartFigure>
  );
}
