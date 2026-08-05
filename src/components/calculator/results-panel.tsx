import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DetailRow as Row } from "@/components/calculator/detail-row";
import { formatRinggit } from "@/lib/utils/currency";
import type { SalaryCalculationViewModel } from "@/components/calculator/to-view-model";

export function ResultsPanel({ data }: { data: SalaryCalculationViewModel }) {
  const ws = data.weekendSupport;

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Net salary</CardTitle>
          <CardDescription>
            What you actually take home this month.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Row
            label="Net salary"
            value={formatRinggit(data.netSalary)}
            emphasis
          />
          {ws.grossAmount !== "0.00" ? (
            <Row
              label="Net weekend-support amount"
              value={formatRinggit(ws.netAdditionalIncome)}
              tooltip="How much of the weekend-support allowance you actually keep after statutory deductions."
              emphasis
            />
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Deduction breakdown</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2.5">
          <Row
            label="Gross salary"
            value={formatRinggit(data.grossSalary)}
            tooltip="Total income before any statutory deductions."
          />
          <Row
            label="EPF (employee)"
            value={formatRinggit(data.epf)}
            tooltip="Employees Provident Fund — mandatory retirement savings contribution."
          />
          <Row
            label="EPF (employer)"
            value={formatRinggit(data.epfEmployer)}
            tooltip="Your employer's EPF contribution — for reference only, paid on top of your salary, not deducted from it or included in the totals below. Shown to make comparing against your actual payslip easier."
          />
          <Row
            label={`SOCSO (employee)${data.socsoMaxReached ? " · max reached" : ""}`}
            value={formatRinggit(data.socso)}
            tooltip="Social Security Organisation — insurance for employment injury/invalidity, capped at a statutory wage ceiling."
          />
          <Row
            label={`EIS (employee)${data.eisMaxReached ? " · max reached" : ""}`}
            value={formatRinggit(data.eis)}
            tooltip="Employment Insurance System — capped at a statutory wage ceiling."
          />
          <Row
            label="PCB (estimated)"
            value={formatRinggit(data.pcb)}
            tooltip="Potongan Cukai Bulanan — estimated monthly tax deduction. The actual payslip amount may differ; payroll uses cumulative PCB rules and current LHDN tables."
          />
          {data.zakat !== "0.00" ? (
            <Row label="Zakat" value={formatRinggit(data.zakat)} />
          ) : null}
          <Separator />
          <Row
            label="Total deductions"
            value={formatRinggit(data.totalDeductions)}
          />
          <Row
            label="Effective deduction rate"
            value={`${data.effectiveDeductionRatePercent}%`}
            tooltip="Total deductions as a percentage of gross salary."
          />
          <Row
            label="Effective take-home %"
            value={`${data.effectiveTakeHomePercent}%`}
          />
        </CardContent>
      </Card>

      {ws.grossAmount !== "0.00" ? (
        <Card>
          <CardHeader>
            <CardTitle>Weekend-support comparison</CardTitle>
            <CardDescription>
              Salary without vs. with weekend support.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2.5">
            <Row
              label="Gross weekend-support amount"
              value={formatRinggit(ws.grossAmount)}
            />
            <Row
              label={`Additional EPF caused by weekend support`}
              value={formatRinggit(ws.additionalEpf)}
              tooltip="How much extra EPF this weekend-support allowance triggers on top of your base salary's EPF."
            />
            <Row
              label={`Additional SOCSO caused by weekend support${ws.additionalSocsoCapped ? " · RM0 because contribution ceiling already reached" : ""}`}
              value={formatRinggit(ws.additionalSocso)}
            />
            <Row
              label={`Additional EIS caused by weekend support${ws.additionalEisCapped ? " · RM0 because contribution ceiling already reached" : ""}`}
              value={formatRinggit(ws.additionalEis)}
            />
            <Row
              label="Additional PCB caused by weekend support"
              value={formatRinggit(ws.additionalPcb)}
              tooltip="How much extra estimated tax this weekend-support allowance triggers, based on your cumulative tax position."
            />
            <Separator />
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="grid gap-1">
                <span className="text-muted-foreground text-xs">
                  Without weekend support
                </span>
                <span className="text-sm font-medium">
                  {formatRinggit(ws.comparison.withoutWeekendSupport.netSalary)}{" "}
                  net
                </span>
              </div>
              <div className="grid gap-1">
                <span className="text-muted-foreground text-xs">
                  With weekend support
                </span>
                <span className="text-sm font-medium">
                  {formatRinggit(ws.comparison.withWeekendSupport.netSalary)}{" "}
                  net
                </span>
              </div>
            </div>
            <Row
              label="Net weekend-support amount"
              value={formatRinggit(ws.netAdditionalIncome)}
              tooltip="The real, engine-computed net addition — not assumed to be a fixed percentage of the gross amount."
            />
            <Row
              label="Percentage of weekend support retained"
              value={`${ws.percentRetained}%`}
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
