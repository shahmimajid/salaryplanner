"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { formatRinggit } from "@/lib/utils/currency";
import { formatDateDDMMYYYY } from "@/lib/utils/date";
import type { SalaryEntrySummary } from "@/lib/history/list-salary-entries";

function monthLabel(payrollMonth: string): string {
  const [year, month] = payrollMonth.split("-");
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function HistoryList({ entries }: { entries: SalaryEntrySummary[] }) {
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  }

  return (
    <div className="grid gap-3">
      {selected.length > 0 ? (
        <div className="bg-muted/30 flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
          <span>
            {selected.length === 2
              ? "2 calculations selected."
              : "Select one more calculation to compare."}
          </span>
          <Button asChild size="sm" disabled={selected.length !== 2}>
            <Link href={`/history/compare?a=${selected[0]}&b=${selected[1] ?? ""}`}>
              Compare selected
            </Link>
          </Button>
        </div>
      ) : null}

      {entries.map((entry) => (
        <Card key={entry.id} className="hover:bg-muted/30 transition-colors">
          <CardContent className="flex items-center gap-4 py-4">
            <Checkbox
              checked={selected.includes(entry.id)}
              onCheckedChange={() => toggle(entry.id)}
              aria-label={`Select ${monthLabel(entry.payrollMonth)} to compare`}
            />
            <Link href={`/history/${entry.id}`} className="flex flex-1 items-center justify-between gap-4">
              <div>
                <p className="font-medium">{monthLabel(entry.payrollMonth)}</p>
                <p className="text-muted-foreground text-xs">
                  Calculated {formatDateDDMMYYYY(entry.calculatedAt)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{formatRinggit(entry.netSalary)} net</p>
                <p className="text-muted-foreground text-xs">
                  {formatRinggit(entry.grossSalary)} gross
                </p>
              </div>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
