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

export function DeductionBreakdownChart({
  data,
}: {
  data: SalaryCalculationViewModel;
}) {
  // Horizontal bars with axis labels, not a pie chart — this app's chart
  // color tokens are an achromatic (zero-chroma) grayscale ramp, so pie
  // slices would be indistinguishable by color alone. Zero-value
  // components are filtered out to avoid clutter (e.g. zakat when unused).
  const allRows = [
    { name: "EPF", value: Number(data.epf) },
    { name: "SOCSO", value: Number(data.socso) },
    { name: "EIS", value: Number(data.eis) },
    { name: "PCB", value: Number(data.pcb) },
    { name: "Zakat", value: Number(data.zakat) },
  ];
  const rows = allRows.filter((row) => row.value > 0);

  if (rows.length === 0) {
    return null;
  }

  return (
    <AccessibleChartFigure
      title="Deduction breakdown"
      rows={rows.map((r) => ({ label: r.name, value: formatRinggit(r.value) }))}
    >
      <ResponsiveContainer width="100%" height={40 * rows.length + 40}>
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 8, right: 64, left: 8, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          {/* Extra headroom on the domain (not just chart margin) so the
              on-bar RM label never gets clipped regardless of container
              width or value magnitude. */}
          <XAxis
            type="number"
            hide
            domain={[0, (dataMax: number) => dataMax * 1.35]}
          />
          <YAxis
            type="category"
            dataKey="name"
            tickLine={false}
            axisLine={false}
            width={60}
          />
          <Bar dataKey="value" fill="var(--chart-3)" radius={[0, 4, 4, 0]}>
            <LabelList
              dataKey="value"
              position="right"
              formatter={(v) => formatRinggit(Number(v))}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </AccessibleChartFigure>
  );
}
