import { SalaryEntryForm } from "@/components/calculator/salary-entry-form";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
      <div className="mb-6 space-y-1 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          My Net Salary Planner
        </h1>
        <p className="text-muted-foreground text-sm">
          Understand your Malaysian net salary and weekend-support allowance
          after statutory deductions.
        </p>
      </div>
      <SalaryEntryForm />
    </main>
  );
}
