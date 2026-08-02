import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-user";
import { listPayrollConfigurations } from "@/lib/admin/list-payroll-configurations";
import { loadPayrollConfigurationForEdit } from "@/lib/admin/load-config-for-edit";
import { ConfigForm } from "@/components/admin/config-form";
import { createConfigAction } from "@/app/admin/actions";

function pickDefaultSourceId(
  configs: Awaited<ReturnType<typeof listPayrollConfigurations>>,
): string | undefined {
  return configs.find((c) => c.isActive)?.id ?? configs[0]?.id;
}

export default async function AdminNewConfigPage({
  searchParams,
}: {
  searchParams: Promise<{ duplicateFrom?: string }>;
}) {
  await requireAdmin();
  const { duplicateFrom } = await searchParams;
  const configs = await listPayrollConfigurations();
  const sourceId = duplicateFrom ?? pickDefaultSourceId(configs);

  if (!sourceId) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight">New configuration</h1>
        <p className="text-muted-foreground mt-4 text-sm">
          No existing configuration to duplicate from yet. Seed one directly first.
        </p>
      </main>
    );
  }

  const source = await loadPayrollConfigurationForEdit(sourceId);
  if (!source) {
    notFound();
  }
  const sourceListItem = configs.find((c) => c.id === sourceId);

  const initialValues = {
    ...source,
    version: "",
    effectiveFrom: "",
    effectiveTo: null,
    retirePreviousConfigId: null,
  };

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <div className="mb-6 space-y-1">
        <Link href="/admin" className="text-muted-foreground text-sm underline">
          ← Back to configurations
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">New configuration</h1>
        <p className="text-muted-foreground text-sm">
          Starting from {sourceListItem?.label ?? source.label} (v{source.version}). Adjust the
          fields that changed, then create the new version.
        </p>
      </div>

      {configs.length > 1 ? (
        <form action="/admin/new" method="get" className="mb-6 flex items-center gap-2 text-sm">
          <label htmlFor="duplicateFrom" className="text-muted-foreground">
            Duplicate from
          </label>
          <select
            id="duplicateFrom"
            name="duplicateFrom"
            defaultValue={sourceId}
            className="border-input h-9 rounded-md border bg-transparent px-3 text-sm"
          >
            {configs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label} (v{c.version})
              </option>
            ))}
          </select>
          <button type="submit" className="rounded-md border px-2.5 py-1">
            Load
          </button>
        </form>
      ) : null}

      <ConfigForm
        initialValues={initialValues}
        action={createConfigAction}
        retireSource={sourceListItem ? { id: sourceListItem.id, version: sourceListItem.version } : null}
      />
    </main>
  );
}
