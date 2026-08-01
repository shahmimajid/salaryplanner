import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { compareSalaryEntries } from "@/lib/history/compare-salary-entries";
import { Card, CardContent } from "@/components/ui/card";
import { CompareView } from "@/components/history/compare-view";

export default async function CompareHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const user = await requireUser();
  const { a, b } = await searchParams;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
      <div className="mb-6 space-y-1">
        <Link href="/history" className="text-muted-foreground text-sm underline">
          ← Back to history
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Compare</h1>
      </div>

      {a && b ? (
        <CompareBody userId={user.id} a={a} b={b} />
      ) : (
        <Card>
          <CardContent className="text-muted-foreground py-10 text-center text-sm">
            Pick exactly two calculations from{" "}
            <Link href="/history" className="underline">
              your history
            </Link>{" "}
            to compare them side by side.
          </CardContent>
        </Card>
      )}
    </main>
  );
}

async function CompareBody({ userId, a, b }: { userId: string; a: string; b: string }) {
  const comparison = await compareSalaryEntries(userId, a, b);
  if (!comparison) {
    notFound();
  }
  return <CompareView comparison={comparison} />;
}
