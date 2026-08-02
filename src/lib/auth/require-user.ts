import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";

/**
 * Defense-in-depth session check for Server Components/Actions — middleware
 * already gates /history and /dashboard, but every authenticated data
 * access re-checks here too rather than trusting routing alone.
 */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin");
  }
  return session.user;
}

/**
 * Same defense-in-depth reasoning as requireUser() — proxy.ts's authorized()
 * callback already redirects a non-admin away from /admin, but every
 * authenticated data access re-checks here too rather than trusting
 * routing alone.
 */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }
  return session.user;
}
