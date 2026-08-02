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
      const { pathname } = request.nextUrl;
      const protectedPrefixes = ["/history", "/dashboard", "/profile", "/admin"];
      const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
      if (!isProtected) return true;
      if (!auth?.user) return false; // default /signin redirect

      // Role check reads only the already-decoded JWT — no DB round-trip,
      // safe on the Edge runtime. A promote/demote only takes effect on
      // next sign-in (JWT sessions can't be invalidated mid-session).
      if (pathname.startsWith("/admin") && auth.user.role !== "ADMIN") {
        return Response.redirect(new URL("/dashboard", request.url));
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && typeof token.id === "string") {
        session.user.id = token.id;
      }
      if (session.user && typeof token.role === "string") {
        session.user.role = token.role as "USER" | "ADMIN";
      }
      return session;
    },
  },
  providers: [], // Node-only providers are added in auth.ts
} satisfies NextAuthConfig;
