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
Server Actions, and the CSV/PDF export Route Handlers (`src/app/api/export/`).

## User flow (target end-state, built incrementally across phases)

1. Unauthenticated visitor lands on `/` → the full local-mode calculator
   (Phase 3), no account, nothing persisted. This stays available
   indefinitely, not just as a placeholder — spec §12's "run locally
   without an account" privacy mode has standing value even for signed-in
   users who want a throwaway what-if calculation.
2. Auth (Auth.js, Credentials provider, Phase 4) → sign-up creates a `User`
   + a default `PayrollProfile` (marital status, children, EPF rate,
   citizenship, etc.) seeded from the same defaults local mode uses.
   `/profile` lets a user edit it later. Every `SalaryCalculation` pins the
   exact profile snapshot in effect when it was saved
   (`SalaryCalculation.profileSnapshot`), so editing never retroactively
   changes how a past calculation displays — only future calculations pick
   up the new profile.
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
   *pinned* `PayrollConfiguration` version *and* the *pinned*
   `PayrollProfile` snapshot (both fixed at save time — a later config
   change or profile edit can never retroactively change a past
   calculation's displayed figures) rather than storing extra derived
   columns, reusing `ResultsPanel`/`Dashboard` with zero new UI code.
   Delete requires an explicit confirmation dialog (Phase 4).
   **Phase 5** adds: `/history/[id]/edit` (locks the payroll month, reusing
   `saveSalaryEntry`'s same-month-collapse behavior on purpose);
   `/history/[id]`'s "Duplicate" picker (a target-month dialog that warns
   before overwriting an existing month, then pre-fills `/dashboard`);
   `/history/compare?a=&b=` (side-by-side diff, pure reuse of
   `loadCalculationDetail` called twice); year filtering and
   `/history/annual` (sums `SalaryEntry`+`SalaryCalculation`+
   `SavingsPlan.allocations` for a calendar year); and CSV
   (`/api/export/history`) / payslip-PDF (`/api/export/payslip/[id]`)
   export Route Handlers.
6. **Admin area (role = `ADMIN`, `/admin`)** manages `PayrollConfiguration`
   versions. Creation is **duplicate-and-edit**: `/admin/new` starts from an
   existing version's full nested data (defaulting to the currently-active
   one, or a chosen source via `?duplicateFrom=`) with `version`/
   `effectiveFrom`/`effectiveTo` blanked for re-entry, rather than a blank
   11-tax-bracket form. Once created, a `PayrollConfiguration` and its 7
   child arrays (EPF rates, EPF wage bands, SOCSO rates, EIS rates, tax
   brackets, tax reliefs, tax rebates) are **immutable** — the only
   permitted post-creation mutation is lifecycle-only (`isActive`/
   `effectiveTo`, via `/admin/[id]`'s `ConfigLifecycleForm`), which never
   touches nested rate data. `/admin/new` optionally retires the source
   version in the same transaction (sets its `effectiveTo` to the day
   before the new version's `effectiveFrom`) via a default-checked
   checkbox — not required for correctness (`resolveConfig()` already
   takes the newest `effectiveFrom` first), just avoids two simultaneously
   "active" rows. Both config creation and lifecycle updates write an
   `AuditLog` row (`action: CONFIG_CHANGE`) in the same transaction as the
   data change. Role is carried on the JWT (`session.user.role`, set at
   sign-in) and checked both at the edge (`auth.config.ts`'s `authorized()`
   callback redirects a non-admin `/admin` request to `/dashboard`) and
   again in `requireAdmin()` at every admin data-access point — see
   `docs/assumptions.md` for the JWT role-staleness tradeoff this implies.
7. **PWA (Phase 5)**: installable (manifest + generated icons), a service
   worker (`src/sw.ts`, served via `src/app/serwist/[path]/route.ts` —
   `@serwist/turbopack`'s Route-Handler-based integration, not a static
   `public/sw.js`), offline access to previously-visited pages, offline
   draft creation on `/dashboard` with automatic sync on reconnect, and an
   update-available banner. See "PWA caching strategy" and "Offline sync
   model" below.
8. **Savings plans (Phase 5)** persist per `SalaryEntry` (`SavingsPlan` +
   `SavingsAllocation`, wiring up models that existed unused since Phase
   1). The planner stays fully ephemeral in local mode; on `/dashboard` an
   explicit "Save savings plan" button persists it, recomputing
   server-side from the entry's stored net salary — never trusting
   client-sent amounts.
9. Three more dashboard charts (Phase 5) — monthly savings trend, salary/
   support history (`src/components/dashboard/history-trends.tsx`, always
   visible on `/dashboard` for signed-in users) and the annual totals bar
   chart on `/history/annual` — complete spec §7's 6 required charts,
   sourced from `src/lib/history/list-monthly-series.ts` (one shared
   per-month query reused by the first two).

## PWA caching strategy

`src/sw.ts` defines explicit per-route-class `runtimeCaching` rules
(security-sensitive, not left to Serwist's generic defaults):

- Static assets (`_next/static`, `/icons/*`): cache-first — safe, hashed,
  immutable filenames.
- `/` (local mode): network-first with a cache fallback — nothing here is
  per-user, so it's safe to reopen offline.
- `/api/auth/*`, `/api/export/*`, and any Server Action POST (Server
  Actions POST to the same URL as the page, so the authenticated-page rule
  below is scoped to `GET` only — a POST simply matches nothing and goes
  straight to the network): explicit `NetworkOnly`, never cached.
- `/dashboard`, `/history/**` (authenticated HTML): network-first, **no
  implicit full-page caching** — avoids a shared-device data-leak risk. The
  service worker itself never opportunistically retains one user's
  authenticated HTML.

## Offline sync model

Offline draft creation is scoped to `/dashboard`'s salary-entry form only
(`SalaryEntryForm`'s `offlineCapable` prop) — local mode has nothing to
sync, and the calculation engine only runs server-side, so an offline
submission can't show a computed preview, only capture the raw input.

- **Storage**: `src/lib/offline/db.ts`, a typed IndexedDB wrapper (`idb`)
  around a `drafts` store keyed by a client-generated `localId`, scoped by
  `userId`.
- **Sync trigger**: the browser `online` event (not the Background Sync
  API — Safari doesn't support it), plus once on mount if already online.
  `src/lib/offline/sync-drafts.ts`'s `syncPendingDrafts()` does the work.
- **Conflict handling**: before syncing each draft, `checkPayrollMonthAvailability`
  (also used by the duplicate picker) checks whether the target month now
  has a saved entry (e.g. saved from another device while offline). If so,
  the draft is marked as a conflict requiring explicit user resolution
  ("Overwrite" or "Discard" in `offline-drafts-banner.tsx`) rather than
  silently overwriting. Drafts targeting an open month sync automatically.
- **Sign-out hygiene**: `SignOutClearOfflineForm` clears this user's
  offline drafts before the sign-out `Server Action` runs, so a shared
  device doesn't retain them across accounts.

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
