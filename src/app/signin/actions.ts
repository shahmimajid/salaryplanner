"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth/auth";
import { signInFormSchema, type SignInFormValues } from "@/app/signin/schema";

export type SignInActionResult = { ok: true } | { ok: false; error: string };

export async function signInAction(input: SignInFormValues): Promise<SignInActionResult> {
  const parsed = signInFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Enter a valid email and password." };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      // Deliberately generic — not "email not found" vs "wrong password" —
      // to avoid account enumeration via the login form.
      return { ok: false, error: "Invalid email or password." };
    }
    throw error; // NEXT_REDIRECT on success — must propagate
  }

  return { ok: true };
}
