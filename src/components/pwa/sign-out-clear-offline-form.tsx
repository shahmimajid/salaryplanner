"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { clearDraftsForUser } from "@/lib/offline/db";
import { signOutAction } from "@/lib/auth/actions";

/**
 * Server Actions can't touch client-side storage — clears this user's
 * offline drafts before the actual sign-out submits, so a shared device
 * doesn't retain them across accounts. Awaited (via requestSubmit after
 * the clear resolves) rather than fire-and-forget, since sign-out's
 * redirect would otherwise race the IndexedDB delete.
 */
export function SignOutClearOfflineForm({ userId }: { userId: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={signOutAction}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={async () => {
          await clearDraftsForUser(userId).catch(() => {});
          formRef.current?.requestSubmit();
        }}
      >
        Sign out
      </Button>
    </form>
  );
}
