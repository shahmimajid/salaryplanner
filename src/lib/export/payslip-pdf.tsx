import { Document, Page, View, Text, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { formatRinggit } from "@/lib/utils/currency";
import type { CalculationDetail } from "@/lib/history/load-calculation-detail";
import type { SalaryEntryFormValues } from "@/components/calculator/schema";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 2 },
  subtitle: { fontSize: 11, color: "#555", marginBottom: 10 },
  disclaimer: { fontSize: 8, color: "#777", marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontWeight: 700, marginTop: 14, marginBottom: 6 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
  },
  rowLabel: { color: "#333" },
  rowValue: { fontWeight: 400 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    marginTop: 2,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  totalLabel: { fontWeight: 700 },
  totalValue: { fontWeight: 700 },
  netPay: {
    marginTop: 24,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: "#111",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  netPayLabel: { fontSize: 13, fontWeight: 700 },
  netPayValue: { fontSize: 16, fontWeight: 700 },
});

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

/**
 * Pure rendering over already-computed data — loadCalculationDetail's
 * ownership check and versioned-config-pinned recompute are the route
 * handler's responsibility, not this function's. No new calculation logic
 * here.
 */
export async function renderPayslipPdf(
  detail: CalculationDetail,
  entryValues: SalaryEntryFormValues,
): Promise<Buffer> {
  const { data } = detail;

  const document = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>My Net Salary Planner</Text>
        <Text style={styles.subtitle}>Payslip-style estimate — {detail.payrollMonth}</Text>
        <Text style={styles.disclaimer}>
          This is a personal-planning estimate, not an official payslip. Actual EPF, SOCSO,
          EIS and PCB deductions may differ according to official contribution tables and
          your employer&apos;s payroll records.
        </Text>

        <Text style={styles.sectionTitle}>Income</Text>
        <Row label="Basic salary" value={formatRinggit(entryValues.basicSalary)} />
        {data.weekendSupport.grossAmount !== "0.00" ? (
          <Row label="Weekend-support allowance" value={formatRinggit(data.weekendSupport.grossAmount)} />
        ) : null}
        {entryValues.bonus > 0 ? (
          <Row label="Bonus" value={formatRinggit(entryValues.bonus)} />
        ) : null}
        {entryValues.commission > 0 ? (
          <Row label="Commission" value={formatRinggit(entryValues.commission)} />
        ) : null}
        {entryValues.otherTaxableIncome > 0 ? (
          <Row label="Other taxable income" value={formatRinggit(entryValues.otherTaxableIncome)} />
        ) : null}
        {entryValues.otherNonTaxableReimbursement > 0 ? (
          <Row
            label="Other non-taxable reimbursement"
            value={formatRinggit(entryValues.otherNonTaxableReimbursement)}
          />
        ) : null}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Gross salary</Text>
          <Text style={styles.totalValue}>{formatRinggit(data.grossSalary)}</Text>
        </View>

        <Text style={styles.sectionTitle}>Deductions</Text>
        <Row label="EPF (employee)" value={formatRinggit(data.epf)} />
        <Row label="SOCSO (employee)" value={formatRinggit(data.socso)} />
        <Row label="EIS (employee)" value={formatRinggit(data.eis)} />
        <Row label="PCB (income tax)" value={formatRinggit(data.pcb)} />
        {data.zakat !== "0.00" ? <Row label="Zakat" value={formatRinggit(data.zakat)} /> : null}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total deductions</Text>
          <Text style={styles.totalValue}>{formatRinggit(data.totalDeductions)}</Text>
        </View>

        <View style={styles.netPay}>
          <Text style={styles.netPayLabel}>Net pay</Text>
          <Text style={styles.netPayValue}>{formatRinggit(data.netSalary)}</Text>
        </View>

        <Text style={styles.sectionTitle}>Employer contribution</Text>
        <Row label="EPF (employer)" value={formatRinggit(data.epfEmployer)} />
      </Page>
    </Document>
  );

  return renderToBuffer(document);
}
