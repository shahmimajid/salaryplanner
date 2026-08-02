import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRinggit } from "@/lib/utils/currency";
import type { PayrollConfigFormValues } from "@/components/admin/config-schema";

const CITIZENSHIP_LABELS = {
  CITIZEN: "Citizen",
  PERMANENT_RESIDENT: "Permanent resident",
  NON_CITIZEN: "Non-citizen",
} as const;

const SOCSO_CATEGORY_LABELS = {
  CATEGORY_1: "Category 1",
  CATEGORY_2: "Category 2",
} as const;

const RESIDENCY_LABELS = {
  RESIDENT: "Tax resident",
  NON_RESIDENT: "Non-resident",
} as const;

function money(value: number | null): string {
  return value === null ? "—" : formatRinggit(value);
}

/**
 * Read-only — nothing here is editable (see ConfigLifecycleForm for the one
 * exception: isActive/effectiveTo). Plain semantic tables, no react-hook-form.
 */
export function ConfigDetail({ config }: { config: PayrollConfigFormValues }) {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <span className="text-muted-foreground">Source reference: </span>
            {config.sourceReference}
          </div>
          {config.notes ? (
            <div className="sm:col-span-2">
              <span className="text-muted-foreground">Notes: </span>
              {config.notes}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">EPF rates</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground border-b text-left">
                <th className="py-1.5 pr-2">Citizenship</th>
                <th className="py-1.5 pr-2">Age</th>
                <th className="py-1.5 pr-2">Employee %</th>
                <th className="py-1.5 pr-2">Employer %</th>
                <th className="py-1.5">Notes</th>
              </tr>
            </thead>
            <tbody>
              {config.epfRates.map((row, index) => (
                <tr key={index} className="border-b last:border-0">
                  <td className="py-1.5 pr-2">{CITIZENSHIP_LABELS[row.citizenshipStatus]}</td>
                  <td className="py-1.5 pr-2">
                    {row.minAge ?? "—"}–{row.maxAge ?? "—"}
                  </td>
                  <td className="py-1.5 pr-2">{row.employeeRatePercent}%</td>
                  <td className="py-1.5 pr-2">
                    {row.employerRatePercent}%
                    {row.employerRateThreshold !== null && row.employerRateAbovePercent !== null
                      ? ` (${row.employerRateAbovePercent}% above ${formatRinggit(row.employerRateThreshold)})`
                      : ""}
                  </td>
                  <td className="py-1.5">{row.notes ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">EPF wage bands</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground border-b text-left">
                <th className="py-1.5 pr-2">Wage from</th>
                <th className="py-1.5 pr-2">Wage to</th>
                <th className="py-1.5 pr-2">Employee</th>
                <th className="py-1.5">Employer</th>
              </tr>
            </thead>
            <tbody>
              {config.epfWageBands.map((row, index) => (
                <tr key={index} className="border-b last:border-0">
                  <td className="py-1.5 pr-2">{formatRinggit(row.wageFrom)}</td>
                  <td className="py-1.5 pr-2">{money(row.wageTo)}</td>
                  <td className="py-1.5 pr-2">{formatRinggit(row.employeeContribution)}</td>
                  <td className="py-1.5">{formatRinggit(row.employerContribution)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">SOCSO rates</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground border-b text-left">
                <th className="py-1.5 pr-2">Category</th>
                <th className="py-1.5 pr-2">Wage from</th>
                <th className="py-1.5 pr-2">Wage to</th>
                <th className="py-1.5 pr-2">Employee</th>
                <th className="py-1.5">Employer</th>
              </tr>
            </thead>
            <tbody>
              {config.socsoRates.map((row, index) => (
                <tr key={index} className="border-b last:border-0">
                  <td className="py-1.5 pr-2">{SOCSO_CATEGORY_LABELS[row.category]}</td>
                  <td className="py-1.5 pr-2">{formatRinggit(row.wageFrom)}</td>
                  <td className="py-1.5 pr-2">{money(row.wageTo)}</td>
                  <td className="py-1.5 pr-2">{formatRinggit(row.employeeContribution)}</td>
                  <td className="py-1.5">{formatRinggit(row.employerContribution)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">EIS rates</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground border-b text-left">
                <th className="py-1.5 pr-2">Wage from</th>
                <th className="py-1.5 pr-2">Wage to</th>
                <th className="py-1.5 pr-2">Employee</th>
                <th className="py-1.5">Employer</th>
              </tr>
            </thead>
            <tbody>
              {config.eisRates.map((row, index) => (
                <tr key={index} className="border-b last:border-0">
                  <td className="py-1.5 pr-2">{formatRinggit(row.wageFrom)}</td>
                  <td className="py-1.5 pr-2">{money(row.wageTo)}</td>
                  <td className="py-1.5 pr-2">{formatRinggit(row.employeeContribution)}</td>
                  <td className="py-1.5">{formatRinggit(row.employerContribution)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tax brackets</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground border-b text-left">
                <th className="py-1.5 pr-2">Residency</th>
                <th className="py-1.5 pr-2">Income from</th>
                <th className="py-1.5 pr-2">Income to</th>
                <th className="py-1.5 pr-2">Rate</th>
                <th className="py-1.5">Cumulative tax at start</th>
              </tr>
            </thead>
            <tbody>
              {config.taxBrackets.map((row, index) => (
                <tr key={index} className="border-b last:border-0">
                  <td className="py-1.5 pr-2">{RESIDENCY_LABELS[row.residencyStatus]}</td>
                  <td className="py-1.5 pr-2">{formatRinggit(row.chargeableIncomeFrom)}</td>
                  <td className="py-1.5 pr-2">{money(row.chargeableIncomeTo)}</td>
                  <td className="py-1.5 pr-2">{row.ratePercent}%</td>
                  <td className="py-1.5">{formatRinggit(row.cumulativeTaxBase)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tax reliefs</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground border-b text-left">
                <th className="py-1.5 pr-2">Code</th>
                <th className="py-1.5 pr-2">Label</th>
                <th className="py-1.5 pr-2">Max amount</th>
                <th className="py-1.5">Description</th>
              </tr>
            </thead>
            <tbody>
              {config.taxReliefs.map((row, index) => (
                <tr key={index} className="border-b last:border-0">
                  <td className="py-1.5 pr-2">{row.code}</td>
                  <td className="py-1.5 pr-2">{row.label}</td>
                  <td className="py-1.5 pr-2">{formatRinggit(row.maxAmount)}</td>
                  <td className="py-1.5">{row.description ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tax rebates</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground border-b text-left">
                <th className="py-1.5 pr-2">Code</th>
                <th className="py-1.5 pr-2">Label</th>
                <th className="py-1.5 pr-2">Amount</th>
                <th className="py-1.5 pr-2">Income threshold</th>
                <th className="py-1.5">Description</th>
              </tr>
            </thead>
            <tbody>
              {config.taxRebates.map((row, index) => (
                <tr key={index} className="border-b last:border-0">
                  <td className="py-1.5 pr-2">{row.code}</td>
                  <td className="py-1.5 pr-2">{row.label}</td>
                  <td className="py-1.5 pr-2">{money(row.amount)}</td>
                  <td className="py-1.5 pr-2">{money(row.incomeThreshold)}</td>
                  <td className="py-1.5">{row.description ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
