import Link from "next/link";
import { requireUser } from "@/lib/auth/require-user";
import { listSalaryEntries } from "@/lib/history/list-salary-entries";
import { Card, CardContent } from "@/components/ui/card";
import { formatRinggit } from "@/lib/utils/currency";
import { formatDateDDMMYYYY } from "@/lib/utils/date";

function monthLabel(payrollMonth: string): string {
  const [year, month] = payrollMonth.split("-");
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    date,
  );
}

export default async function HistoryPage() {
  const user = await requireUser();
  const entries = await listSalaryEntries(user.id);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-2">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">History</h1>
          <p className="text-muted-foreground text-sm">Your saved calculations.</p>
        </div>
        <Link href="/dashboard" className="text-sm underline">
          New calculation
        </Link>
      </div>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-10 text-center text-sm">
            No saved calculations yet.{" "}
            <Link href="/dashboard" className="underline">
              Calculate your first one
            </Link>
            .
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {entries.map((entry) => (
            <Link key={entry.id} href={`/history/${entry.id}`}>
              <Card className="hover:bg-muted/30 transition-colors">
                <CardContent className="flex items-center justify-between gap-4 py-4">
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
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
