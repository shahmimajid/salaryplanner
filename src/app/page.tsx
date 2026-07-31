import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-1 flex-col justify-center gap-6 px-4 py-16">
      <div className="space-y-2 text-center">
        <p className="text-muted-foreground text-sm font-medium">
          Phase 1 — Scaffold
        </p>
        <h1 className="text-3xl font-bold tracking-tight">
          My Net Salary Planner
        </h1>
        <p className="text-muted-foreground">
          Understand your Malaysian net salary, weekend-support allowance, and
          savings plan — architecture, schema, and calculation types are in
          place; calculations and UI arrive in later phases.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Disclaimer</CardTitle>
          <CardDescription>
            Read before relying on any figures shown by this app.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          This application provides payroll and tax estimates for personal
          planning. Actual EPF, SOCSO, EIS and PCB deductions may differ
          according to official contribution tables, payroll configuration,
          cumulative remuneration, statutory updates and information submitted
          to the employer. Verify final payroll deductions with your employer,
          payroll provider, KWSP, PERKESO and LHDN.
        </CardContent>
      </Card>
    </main>
  );
}
