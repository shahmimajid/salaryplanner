import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import { signOutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="border-b">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-sm font-semibold">
          My Net Salary Planner
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {session?.user ? (
            <>
              <span className="text-muted-foreground hidden sm:inline">
                {session.user.email}
              </span>
              <Link href="/dashboard" className="underline">
                Dashboard
              </Link>
              <Link href="/history" className="underline">
                History
              </Link>
              <form action={signOutAction}>
                <Button type="submit" variant="outline" size="sm">
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link href="/signin" className="underline">
                Sign in
              </Link>
              <Link href="/signup">
                <Button type="button" size="sm">
                  Sign up
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
