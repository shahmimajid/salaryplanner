# Architecture

## Overview

Single Next.js 16 app (App Router, TypeScript, `src/` layout). No separate
backend — all server logic lives in Route Handlers (`src/app/api/**/route.ts`)
and Server Actions colocated with pages. Prisma is the only data-access
layer, called exclusively from server-side code (Server Components, Route
Handlers, Server Actions) — never from the client.

A framework-agnostic **calculation engine** (`src/lib/payroll/`) is
deliberately decoupled from Prisma/Next: it takes plain typed inputs
(including a resolved `PayrollConfigSnapshot`) and returns plain typed
outputs, so it can be unit-tested in isolation and reused by Route Handlers,
Server Actions, and (later) a PDF/CSV export job.

## User flow (target end-state, built incrementally across phases)

1. Unauthenticated visitor lands on `/` → the full local-mode calculator
   (Phase 3), no account, nothing persisted. This stays available
   indefinitely, not just as a placeholder — spec §12's "run locally
   without an account" privacy mode has standing value even for signed-in
   users who want a throwaway what-if calculation.
2. Auth (Auth.js, Credentials provider, Phase 4) → sign-up creates a `User`
   + a default `PayrollProfile` (marital status, children, EPF rate,
   citizenship, etc.) seeded from the same defaults local mode uses.
   Profile editing is not yet implemented — every account uses the seeded
   default until that ships.
3. Authenticated user submits a salary entry on `/dashboard` → server
   resolves the active `PayrollConfiguration` → the calculation engine
   produces a `SalaryCalculation` + `DeductionBreakdown[]` (Phase 2 engine,
   Phase 4 persistence). Same user + same payroll month updates the
   existing `SalaryEntry` in place (via `SalaryCalculation.isCurrent`)
   rather than duplicating it.
4. Dashboard shows summary cards/charts sourced from the calculation
   (Phase 3 UI, reused unchanged for authenticated users).
5. `/history` lists past calculations (payroll month, gross, net,
   calculated-at); `/history/[id]` **recomputes at view time** against the
   *pinned* `PayrollConfiguration` version rather than storing extra
   derived columns, reusing `ResultsPanel`/`Dashboard` with zero new UI
   code. Delete requires an explicit confirmation dialog (Phase 4). CSV/PDF
   export, edit, duplicate, compare, and annual summary are deferred past
   Phase 4's core scope.
6. Admin area (role = `ADMIN`) manages new `PayrollConfiguration` versions
   with effective dates, without mutating historical ones (not yet built).
7. PWA shell, offline drafts, install prompts (Phase 5).

## Why a separate calculation engine

Statutory payroll math (EPF/SOCSO/EIS/PCB) is the highest-risk, most
test-sensitive part of this app. Keeping it as pure functions
(`src/lib/payroll/*`) with no framework or database dependency means:

- It can be unit/property tested exhaustively without a database or HTTP
  layer.
- The same functions serve the salary-entry flow, the weekend-support
  comparison mode, and future export/report generation.
- Nothing here reaches into Prisma directly — callers resolve a
  `PayrollConfigSnapshot` first (via `resolveConfig()`, or
  `loadLocalPayrollConfig()` in Phase 3's local mode) and pass it in,
  keeping the engine deterministic and side-effect free.
- Derived/presentational figures that aren't part of a statutory
  function's own contract — e.g. the savings planner's expense-vs-savings
  classification, or a chart's data shaping — stay in `src/components/`,
  not `src/lib/payroll/`. The engine returns exactly what each calculation
  function's tests assert; everything else is UI-layer composition.

## Versioned configuration

Every `SalaryCalculation` stores which `PayrollConfiguration.version` it
used. Statutory rate changes create a _new_ configuration version rather
than mutating an existing one, so historical calculations never silently
change when rates are updated. See `docs/assumptions.md` for which values
in the seed configuration are still unverified against official sources.
