"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatRinggit } from "@/lib/utils/currency";
import {
  checkPayrollMonthAvailability,
  type PayrollMonthAvailability,
} from "@/app/history/actions";

export function DuplicateEntryButton({ salaryEntryId }: { salaryEntryId: string }) {
  const router = useRouter();
  const [month, setMonth] = useState("");
  const [availability, setAvailability] = useState<PayrollMonthAvailability | null>(null);
  const [checking, setChecking] = useState(false);

  async function handleMonthChange(value: string) {
    setMonth(value);
    setAvailability(null);
    if (!value) return;
    setChecking(true);
    const result = await checkPayrollMonthAvailability(value);
    setChecking(false);
    setAvailability(result);
  }

  function handleContinue() {
    router.push(`/dashboard?duplicateFrom=${salaryEntryId}&month=${month}`);
  }

  return (
    <AlertDialog
      onOpenChange={(open) => {
        if (!open) {
          setMonth("");
          setAvailability(null);
        }
      }}
    >
      <AlertDialogTrigger asChild>
        <Button variant="outline">Duplicate</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Duplicate to another month</AlertDialogTitle>
          <AlertDialogDescription>
            Choose the target payroll month. You&apos;ll land on the dashboard with
            this entry&apos;s values pre-filled to review before saving.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid gap-2">
          <Label htmlFor="duplicate-target-month">Target payroll month</Label>
          <Input
            id="duplicate-target-month"
            type="month"
            value={month}
            onChange={(e) => handleMonthChange(e.target.value)}
          />
          {checking ? (
            <p className="text-muted-foreground text-xs">Checking…</p>
          ) : availability?.exists ? (
            <p className="text-destructive text-xs">
              A calculation already exists for this month (
              {formatRinggit(availability.netSalary ?? "0")} net) — duplicating will
              overwrite it.
            </p>
          ) : null}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button onClick={handleContinue} disabled={!month}>
            Continue
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
