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

export function GrossVsNetChart({
  grossSalary,
  netSalary,
}: {
  grossSalary: string;
  netSalary: string;
}) {
  const data = [
    { name: "Gross salary", value: Number(grossSalary) },
    { name: "Net salary", value: Number(netSalary) },
  ];

  return (
    <AccessibleChartFigure
      title="Gross salary vs net salary"
      rows={data.map((d) => ({ label: d.name, value: formatRinggit(d.value) }))}
    >
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={data}
          margin={{ top: 24, right: 8, left: 8, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} />
          <YAxis hide />
          <Bar dataKey="value" fill="var(--chart-2)" radius={[4, 4, 0, 0]}>
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
