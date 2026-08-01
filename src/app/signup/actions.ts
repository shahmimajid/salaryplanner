"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/db/prisma";
import { signIn } from "@/lib/auth/auth";
import { checkRateLimit, RateLimitError } from "@/lib/auth/rate-limit";
import { defaultPayrollProfileCreateData } from "@/lib/payroll/config/profile-snapshot";
import { signUpFormSchema, type SignUpFormValues } from "@/app/signup/schema";

export type SignUpActionResult = { ok: true } | { ok: false; fieldErrors: Record<string, string[] | undefined> };

export async function registerAction(input: SignUpFormValues): Promise<SignUpActionResult> {
  const parsed = signUpFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { email, password } = parsed.data;

  try {
    checkRateLimit(`signup:${email}`, 5, 60 * 60 * 1000);
  } catch (error) {
    if (error instanceof RateLimitError) {
      return { ok: false, fieldErrors: { email: [error.message] } };
    }
    throw error;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, fieldErrors: { email: ["An account with this email already exists."] } };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      payrollProfile: { create: defaultPayrollProfileCreateData() },
    },
  });

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  } catch (error) {
    // next-auth's own redirect on success is implemented by throwing a
    // special NEXT_REDIRECT error — it must propagate, not be swallowed.
    if (error instanceof AuthError) {
      return {
        ok: false,
        fieldErrors: { email: ["Account created, but sign-in failed — try signing in."] },
      };
    }
    throw error;
  }

  return { ok: true };
}
