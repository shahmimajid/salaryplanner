import { requireUser } from "@/lib/auth/require-user";
import { listSalaryEntriesForExport } from "@/lib/export/list-salary-entries-for-export";
import { salaryHistoryToCsv } from "@/lib/export/to-csv";

export async function GET(request: Request): Promise<Response> {
  const user = await requireUser();
  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");
  const year = yearParam ? Number(yearParam) : undefined;

  const rows = await listSalaryEntriesForExport(user.id, year);
  const csv = salaryHistoryToCsv(rows);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="salary-history-${year ?? "all"}.csv"`,
    },
  });
}
