import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-2xl px-4 pb-16">
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
    </footer>
  );
}
