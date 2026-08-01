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

1. Unauthenticated visitor lands on `/` → sees product pitch + disclaimer +
   sign-in/local-mode CTA (Phase 1 delivers this page as a static
   placeholder).
2. Auth (Auth.js, Phase 4) → onboarding sets up a `PayrollProfile` (marital
   status, children, EPF rate, citizenship, etc.), defaulting to the spec's
   example profile.
3. User creates a `SalaryEntry` for a payroll month → server resolves the
   active `PayrollConfiguration` for that month → the calculation engine
   produces a `SalaryCalculation` + `DeductionBreakdown[]` (Phase 2).
4. Dashboard shows summary cards/charts sourced from calculations
   (Phase 3). Weekend-support calculator and savings planner operate on the
   same `SalaryEntry`/derived net figures (Phase 3).
5. History view lists past calculations, supports CSV/PDF export, and is
   guaranteed stable because each `SalaryCalculation` pins the
   `PayrollConfiguration` version used (Phase 4).
6. Admin area (role = `ADMIN`) manages new `PayrollConfiguration` versions
   with effective dates, without mutating historical ones (Phase 4).
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
