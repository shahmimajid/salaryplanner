# My Net Salary Planner

A web app that helps a Malaysian employee understand their monthly net
salary after statutory deductions, how much a weekend-support allowance is
actually worth after deductions, how to allocate net pay toward savings and
expenses, and the gap between gross additional income and actual take-home
pay.

## Tech Stack

Next.js 16 (App Router, TypeScript) · Tailwind CSS 4 + shadcn/ui · Prisma 7 +
PostgreSQL · Auth.js · Recharts · Zod · Vitest + Playwright · Docker ·
PWA-ready

## Project Status

**Phase 1 of 5** — architecture, folder structure, Prisma schema, versioned
payroll-configuration format, and calculation-engine type signatures only.
No statutory math is implemented yet (every `calculate*` function throws
`"Not implemented — Phase 2"`). See [`docs/architecture.md`](docs/architecture.md)
and [`docs/assumptions.md`](docs/assumptions.md).

## Getting Started

```bash
corepack enable && pnpm install
cp .env.example .env
docker compose up -d        # starts local Postgres
pnpm db:migrate
pnpm db:seed                # loads illustrative/UNVERIFIED payroll config
pnpm dev                    # http://localhost:3000
```

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
src/lib/payroll/     Framework-agnostic payroll calculation engine
src/lib/db/          Prisma client singleton
src/lib/auth/        Auth.js configuration (wired in Phase 4)
docs/                Architecture notes, statutory assumptions, original spec
tests/e2e/           Playwright end-to-end tests
```

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
