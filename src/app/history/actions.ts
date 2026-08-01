"use server";

import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { prisma } from "@/lib/db/prisma";
import { payrollMonthToDate } from "@/lib/utils/date";

export interface PayrollMonthAvailability {
  exists: boolean;
  grossSalary?: string;
  netSalary?: string;
}

/** Used by duplicate's month picker (and offline sync's conflict check) to warn before an overwrite, rather than silently colliding with saveSalaryEntry's own same-month-collapses-to-one-row upsert behavior. */
export async function checkPayrollMonthAvailability(
  month: string,
): Promise<PayrollMonthAvailability> {
  const user = await requireUser();
  const entry = await prisma.salaryEntry.findFirst({
    where: { userId: user.id, payrollMonth: payrollMonthToDate(month) },
    include: { calculations: { where: { isCurrent: true }, take: 1 } },
  });
  const calculation = entry?.calculations[0];
  if (!entry || !calculation) {
    return { exists: false };
  }
  return {
    exists: true,
    grossSalary: calculation.grossSalary.toString(),
    netSalary: calculation.netSalary.toString(),
  };
}

export async function deleteSalaryEntryAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id"));

  // deleteMany + ownership filter is atomic — avoids a find-then-delete
  // race, and count===0 means "not found or not yours" either way, never
  // distinguishing which (no information leak).
  const deleted = await prisma.salaryEntry.deleteMany({ where: { id, userId: user.id } });
  if (deleted.count === 0) {
    notFound();
  }

  revalidatePath("/history");
  redirect("/history");
}
