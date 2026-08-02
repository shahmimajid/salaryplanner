import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/auth.config";

// Edge-safe — only the plain authConfig (no Prisma/bcryptjs) is usable here.
const { auth } = NextAuth(authConfig);

export { auth as proxy };

export const config = {
  matcher: ["/history/:path*", "/dashboard/:path*", "/profile/:path*"],
};
