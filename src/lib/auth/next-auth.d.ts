import type { DefaultSession } from "next-auth";
import type { Role } from "@/generated/prisma/client";

// Standard Auth.js v5 module augmentation — session.user.id/role are set by
// the jwt/session callbacks in auth.config.ts, but next-auth's own types
// don't know that, so callers would otherwise see them as optional/absent.
declare module "next-auth" {
  interface User {
    role: Role;
  }
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }
}
