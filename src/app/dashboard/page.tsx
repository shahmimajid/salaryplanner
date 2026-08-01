import Link from "next/link";
import { requireUser } from "@/lib/auth/require-user";
import { DashboardForm } from "@/app/dashboard/dashboard-form";

export default async function DashboardPage() {
  await requireUser();

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-2">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Calculations here are saved to your account.
          </p>
        </div>
        <Link href="/history" className="text-sm underline">
          View history
        </Link>
      </div>
      <DashboardForm />
    </main>
  );
}
