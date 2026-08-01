"use server";

import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { prisma } from "@/lib/db/prisma";

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
