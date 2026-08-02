import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-user";
import { listPayrollConfigurations } from "@/lib/admin/list-payroll-configurations";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminPage() {
  await requireAdmin();
  const configs = await listPayrollConfigurations();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-2">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Payroll configurations</h1>
          <p className="text-muted-foreground text-sm">
            Versioned EPF/SOCSO/EIS rates and tax brackets used by the calculator.
          </p>
        </div>
        <Link href="/admin/new" className="text-sm underline">
          New configuration
        </Link>
      </div>

      {configs.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-10 text-center text-sm">
            No configurations yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {configs.map((config) => (
            <Link key={config.id} href={`/admin/${config.id}`}>
              <Card className="transition-colors hover:bg-accent/50">
                <CardContent className="flex items-center justify-between gap-3 py-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 font-medium">
                      {config.label}
                      {config.isActive ? <Badge>Active</Badge> : null}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      v{config.version} · {config.effectiveFrom} –{" "}
                      {config.effectiveTo ?? "open-ended"}
                    </div>
                  </div>
                  <div className="text-muted-foreground text-xs">{config.createdByEmail}</div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
