import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js config — used directly by middleware.ts (which runs on
 * the Edge runtime and cannot bundle Prisma/bcryptjs), and spread into the
 * full Node-only config in auth.ts. No providers/adapter here; those need
 * Node-only dependencies and live in auth.ts.
 */
export const authConfig = {
  pages: {
    signIn: "/signin",
  },
  session: {
    // Credentials provider doesn't support Auth.js's "database" session
    // strategy (it has no OAuth-style durable session the adapter can
    // track) — JWT is required.
    strategy: "jwt",
  },
  // Required for a bare Docker deployment (no platform like Vercel that
  // Auth.js can auto-detect the host from).
  trustHost: true,
  callbacks: {
    authorized({ auth, request }) {
      const protectedPrefixes = ["/history", "/dashboard"];
      const isProtected = protectedPrefixes.some((prefix) =>
        request.nextUrl.pathname.startsWith(prefix),
      );
      return !isProtected || !!auth?.user;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && typeof token.id === "string") {
        session.user.id = token.id;
      }
      return session;
    },
  },
  providers: [], // Node-only providers are added in auth.ts
} satisfies NextAuthConfig;
