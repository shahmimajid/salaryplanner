import { requireUser } from "@/lib/auth/require-user";
import { loadPayrollProfileFormValues } from "@/lib/profile/load-profile-form-values";
import { ProfileForm } from "@/components/profile/profile-form";
import { updateProfileAction } from "@/app/profile/actions";

export default async function ProfilePage() {
  const user = await requireUser();
  const initialValues = await loadPayrollProfileFormValues(user.id);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <div className="mb-6 space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground text-sm">
          Used to calculate your statutory deductions and tax reliefs.
        </p>
      </div>
      <ProfileForm initialValues={initialValues} action={updateProfileAction} />
    </main>
  );
}
