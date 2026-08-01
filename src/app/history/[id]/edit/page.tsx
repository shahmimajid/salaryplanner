import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { loadSalaryEntryFormValues } from "@/lib/history/load-salary-entry-form-values";
import { loadSavingsPlanFormValues } from "@/lib/savings/load-savings-plan";
import { EditEntryForm } from "@/components/history/edit-entry-form";

export default async function EditHistoryEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const initialValues = await loadSalaryEntryFormValues(user.id, id);
  if (!initialValues) {
    notFound();
  }
  const savingsPlanInitialValues = await loadSavingsPlanFormValues(user.id, id);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
      <div className="mb-6 space-y-1">
        <Link href={`/history/${id}`} className="text-muted-foreground text-sm underline">
          ← Back to this calculation
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Edit calculation</h1>
      </div>
      <EditEntryForm
        salaryEntryId={id}
        initialValues={initialValues}
        savingsPlanInitialValues={savingsPlanInitialValues}
      />
    </main>
  );
}
