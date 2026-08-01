# Real deployment artifact, built and run via docker-compose's `app`/
# `migrate` services (profile "full") — see docker-compose.yml. The
# service worker (src/sw.ts) is bundled by esbuild during `pnpm build`
# (Serwist's Turbopack integration) and served as a prerendered Route
# Handler under .next/standalone — no extra copy step needed here.

FROM node:24-alpine AS base
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# prisma.config.ts's env("DATABASE_URL") throws synchronously if unset, so
# `prisma generate` needs *a* value at build time even though it never
# connects — the real DATABASE_URL from docker-compose overrides this at
# container start.
ARG DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public"
ENV DATABASE_URL=${DATABASE_URL}
RUN pnpm db:generate
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
