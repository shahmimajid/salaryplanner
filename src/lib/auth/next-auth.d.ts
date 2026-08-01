import type { DefaultSession } from "next-auth";

// Standard Auth.js v5 module augmentation — session.user.id is set by the
// jwt/session callbacks in auth.config.ts, but next-auth's own types don't
// know that, so requireUser() callers would otherwise see `id` as optional.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
