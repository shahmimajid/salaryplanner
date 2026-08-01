import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Required for Prisma 7's generated client to resolve correctly under Turbopack.
  serverExternalPackages: ["@prisma/client", "pg"],
  // Standalone output for the Docker build (Phase 5).
  output: "standalone",
};

// @serwist/turbopack (not @serwist/next — that's the webpack integration,
// and this app builds under Turbopack, Next 16's default) serves the
// service worker via a Route Handler (src/app/serwist/[path]/route.ts),
// not a static public/sw.js file — see src/sw.ts.
export default withSerwist(nextConfig);
