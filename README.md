# My Net Salary Planner

A web app that helps a Malaysian employee understand their monthly net
salary after statutory deductions, how much a weekend-support allowance is
actually worth after deductions, how to allocate net pay toward savings and
expenses, and the gap between gross additional income and actual take-home
pay.

## Tech Stack

Next.js 16 (App Router, TypeScript) · Tailwind CSS 4 + shadcn/ui · Prisma 7 +
PostgreSQL · Auth.js · Recharts · Zod · Vitest + Playwright · Docker ·
Serwist (installable PWA + service worker) · `@react-pdf/renderer` (payslip
export) · `idb` (offline drafts)

## Project Status

**Phase 5 of 5** — full history (save/list/view/delete/edit/duplicate/
compare/filter-by-year/annual-totals), all 6 spec dashboard charts,
persisted savings plans, CSV/PDF export, and an installable PWA with
offline draft creation + sync are live alongside Phase 3's local
(no-account) calculator, still available unchanged at `/`. See
[`docs/architecture.md`](docs/architecture.md) and
[`docs/assumptions.md`](docs/assumptions.md).

## Getting Started

```bash
corepack enable && pnpm install
cp .env.example .env
docker compose up -d        # starts local Postgres
pnpm db:migrate
pnpm db:seed                # loads illustrative/UNVERIFIED payroll config
pnpm dev                    # http://localhost:3000
```

## Deployment

The `app` and `migrate` services in `docker-compose.yml` are gated behind
the `full` Compose profile, so local development (`docker compose up -d`,
Postgres only) is unaffected. To build and run the full stack:

```bash
docker compose --profile full build app migrate
docker compose --profile full up -d postgres
docker compose --profile full run --rm migrate                  # prisma migrate deploy
docker compose --profile full run --rm migrate npx tsx prisma/seed.ts
docker compose --profile full up -d app
```

Requires `DATABASE_URL`, `AUTH_SECRET` (`openssl rand -base64 32`), and
`AUTH_URL` in `.env` — see `.env.example`. Auth.js only sets the `Secure`
cookie flag over `https://`; deploying behind plain HTTP is an accepted
interim gap documented in [`docs/assumptions.md`](docs/assumptions.md).

## Scripts

| Script                         | Description                              |
| ------------------------------ | ---------------------------------------- |
| `pnpm dev`                     | Start the Next.js dev server             |
| `pnpm build`                   | Production build                         |
| `pnpm start`                   | Start the production server              |
| `pnpm lint` / `lint:fix`       | ESLint                                   |
| `pnpm format` / `format:check` | Prettier                                 |
| `pnpm typecheck`               | `tsc --noEmit`                           |
| `pnpm test` / `test:watch`     | Vitest (calculation engine unit tests)   |
| `pnpm test:e2e`                | Playwright end-to-end tests              |
| `pnpm db:generate`             | Regenerate the Prisma client             |
| `pnpm db:migrate`              | Apply migrations in development          |
| `pnpm db:migrate:deploy`       | Apply migrations in production           |
| `pnpm db:push`                 | Push schema without a migration          |
| `pnpm db:seed`                 | Load the versioned payroll configuration |
| `pnpm db:studio`               | Open Prisma Studio                       |

## Project Structure

```
prisma/            Prisma schema, migrations, seed script and seed data
src/app/            Next.js App Router pages, layouts, and API routes
src/components/ui/   shadcn/ui components
src/components/pwa/  Install prompt, update banner, offline sync/drafts UI
src/lib/payroll/     Framework-agnostic payroll calculation engine
src/lib/db/          Prisma client singleton
src/lib/auth/        Auth.js configuration, rate limiting, session helpers
src/lib/history/     Persistence + recompute-at-view-time for saved calculations
src/lib/savings/     Savings-plan persistence
src/lib/export/      CSV/PDF export
src/lib/offline/     IndexedDB draft queue + sync
src/sw.ts            Service worker source (bundled by Serwist at build time)
scripts/             One-off dev scripts (PWA icon generation)
docs/                Architecture notes, statutory assumptions, original spec
tests/e2e/           Playwright end-to-end tests
```

## PWA / Offline

Install from the browser's install prompt (or the "Install app" button in
the header on Chromium/Edge; iOS Safari shows an "Add to Home Screen" hint
instead, since it has no install-prompt event). Once installed:

- Previously-visited pages are available offline (network-first with a
  cache fallback).
- On `/dashboard`, submitting while offline saves the entry as a local
  draft instead of failing — a banner shows unsynced drafts and syncs them
  automatically as soon as the connection returns. If the target month was
  also saved from elsewhere in the meantime, the draft is flagged as a
  conflict for you to overwrite or discard, rather than silently
  clobbering it.
- A banner appears when a new version has been installed in the
  background — reload to pick it up.

## Disclaimer

> This application provides payroll and tax estimates for personal planning.
> Actual EPF, SOCSO, EIS and PCB deductions may differ according to official
> contribution tables, payroll configuration, cumulative remuneration,
> statutory updates and information submitted to the employer. Verify final
> payroll deductions with your employer, payroll provider, KWSP, PERKESO and
> LHDN.

## Original Specification

See [`docs/spec/original-prompt.md`](docs/spec/original-prompt.md) for the
full product/technical spec this project was designed against.

## License

MIT — see [LICENSE](LICENSE).
