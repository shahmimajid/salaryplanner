import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-user";
import { loadPayrollConfigurationForEdit } from "@/lib/admin/load-config-for-edit";
import { ConfigDetail } from "@/components/admin/config-detail";
import { ConfigLifecycleForm } from "@/components/admin/config-lifecycle-form";
import { updateConfigLifecycleAction } from "@/app/admin/actions";
import type { ConfigLifecycleFormValues } from "@/components/admin/config-schema";

export default async function AdminConfigDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAdmin();
  const config = await loadPayrollConfigurationForEdit(id);

  if (!config) {
    notFound();
  }

  async function updateLifecycle(values: ConfigLifecycleFormValues) {
    "use server";
    return updateConfigLifecycleAction(id, values);
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-2">
        <div className="space-y-1">
          <Link href="/admin" className="text-muted-foreground text-sm underline">
            ← Back to configurations
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">{config.label}</h1>
          <p className="text-muted-foreground text-sm">Version {config.version}</p>
        </div>
        <Link href={`/admin/new?duplicateFrom=${id}`} className="text-sm underline">
          Duplicate as new version
        </Link>
      </div>

      <div className="grid gap-6">
        <ConfigLifecycleForm
          initialValues={{ isActive: config.isActive, effectiveTo: config.effectiveTo }}
          action={updateLifecycle}
        />
        <ConfigDetail config={config} />
      </div>
    </main>
  );
}
