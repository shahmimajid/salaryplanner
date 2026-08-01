import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { loadCalculationDetail } from "@/lib/history/load-calculation-detail";
import { loadSalaryEntryFormValues } from "@/lib/history/load-salary-entry-form-values";
import { renderPayslipPdf } from "@/lib/export/payslip-pdf";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ salaryEntryId: string }> },
): Promise<Response> {
  const user = await requireUser();
  const { salaryEntryId } = await params;

  const [detail, entryValues] = await Promise.all([
    loadCalculationDetail(user.id, salaryEntryId),
    loadSalaryEntryFormValues(user.id, salaryEntryId),
  ]);
  if (!detail || !entryValues) {
    notFound();
  }

  const pdfBuffer = await renderPayslipPdf(detail, entryValues);

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="payslip-${detail.payrollMonth}.pdf"`,
    },
  });
}
