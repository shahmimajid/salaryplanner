import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Required for Prisma 7's generated client to resolve correctly under Turbopack.
  serverExternalPackages: ["@prisma/client", "pg"],
  // Standalone output for the Docker build (Phase 5).
  output: "standalone",
  // PWA (manifest + service worker) wraps this config in Phase 5, e.g. via
  // @serwist/next's withSerwist().
};

export default nextConfig;
