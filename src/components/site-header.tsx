import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import { Button } from "@/components/ui/button";
import { InstallPromptButton } from "@/components/pwa/install-prompt-button";
import { SignOutClearOfflineForm } from "@/components/pwa/sign-out-clear-offline-form";

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="border-b">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-sm font-semibold">
          My Net Salary Planner
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <InstallPromptButton />
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
              <SignOutClearOfflineForm userId={session.user.id} />
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
