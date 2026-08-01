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
