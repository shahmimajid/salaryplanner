# Key Assumptions & Unresolved Statutory Questions

The seed payroll configuration
(`prisma/seed-data/payroll-config.default.v2026.1.json`) is **illustrative
and UNVERIFIED** against current official Malaysian statutory sources
(KWSP/EPF, PERKESO/SOCSO, LHDN). Do not rely on it for real payroll
decisions. The following must be confirmed before this app can be trusted
for real use:

1. EPF employee/employer contribution rates and the low-wage table (KWSP
   Third Schedule) in the seed data are placeholder/illustrative and
   UNVERIFIED against current official tables. Phase 2 additionally
   extended the seed's RESIDENT tax bracket ladder with an illustrative
   open-ended top bracket (previously capped at RM35,000, which caused
   `calculatePCB` to throw for every one of the spec's own example
   salaries once annualized) and gave SOCSO/EIS nonzero illustrative
   contribution amounts at the existing RM6,000 ceiling (previously RM0,
   which was structurally correct but looked broken in any manual/UI
   check) — both still explicitly UNVERIFIED, not sourced from official
   tables.
2. Whether a reduced EPF employee-rate election (historically offered in
   some years, e.g. 9%) is currently active, and whether
   `PayrollProfile.epfEmployeeRatePercent` should validate against a set of
   config-defined allowed rates rather than being freeform.
3. Exact EPF wage-band lookup table and rounding rule for wages below the
   flat-percentage threshold — needs the current KWSP Third Schedule.
4. Current SOCSO wage ceiling and Category 1 vs Category 2 contribution
   tables, and the transition rule for an employee crossing age 60
   mid-year.
5. Current EIS wage ceiling/contribution table and which employment
   categories are exempt (e.g., civil servants, domestic workers,
   first-time registrants over 60).
6. Whether to implement LHDN's PCB via the formula method (Kaedah
   Pengiraan Berkomputer) or the published PCB schedule tables, including
   the separate "additional remuneration" (bonus/commission) PCB method —
   needs the current official LHDN PCB computation specification.
7. Full current-year tax relief schedule (self, spouse, per-child, EPF/life
   insurance, lifestyle, medical, SSPN, etc.) and amounts; and how a
   child-relief split between spouses (`childReliefClaims` percentages)
   should be validated (e.g., must sum to 100% per child).
8. Confirmation that zakat should be modeled as a **rebate** offsetting PCB
   directly (as designed in `TaxRebate`/`calculatePCB`) rather than a
   pre-tax deduction — the spec's wording ("zakat" listed alongside
   deductions) is ambiguous.
9. Cumulative PCB relies on the user self-reporting
   `previousCumulativeIncomeForYear` / `previousCumulativePcbPaid` — no
   integration with LHDN e-Data PCB/employer payroll systems is in scope
   through Phase 5.
10. Whether EPF contribution is currently mandatory or optional for
    non-citizen employees (rules have changed in recent years) and from
    what effective date — affects `EPFRate.citizenshipStatus` seed rows.
11. LINDUNG i-Saraan/24 Jam scheme is excluded by default per the spec; its
    premium table and eligibility rules need confirmation before it can be
    offered as an opt-in deduction.
12. Official rounding conventions per statutory body (EPF Third Schedule
    bands are pre-rounded; SOCSO/EIS tables are pre-rounded; PCB rounding
    direction) are not yet documented — each rule must cite its source once
    verified. Phase 2 picked a concrete interim default: every monetary
    result is rounded to 2 decimal places and every rate/percentage result
    to 3 decimal places, using `Decimal.ROUND_HALF_UP`, applied once at
    each calculation function's return boundary (`src/lib/payroll/rounding.ts`).
    This is a swappable default, not a verified official rule.
13. Rule for resolving which `PayrollConfiguration` version applies when a
    `SalaryEntry.payrollMonth` could plausibly straddle two versions —
    assumed "config effective as of the 1st of the payroll month," needs
    confirmation against the spec's own test scenarios (config
    effective-date change tests).
14. `WeekendSupportPaymentMethod` fields are embedded directly on
    `SalaryEntry` rather than a separate model, since the spec's model list
    doesn't include one. "Comparison mode" (multiple what-if scenarios) is
    assumed to be computed client-side/ephemerally in Phase 3 rather than
    persisted — revisit if users need to save multiple named scenarios.
15. `calculatePCB`'s bonus/lump-sum handling (`bonusOrIrregularPayment`) is
    a simplified marginal-bracket-difference method, not the official LHDN
    Kaedah 2 (Additional Remuneration) formula — it ignores prior bonuses
    paid earlier in the same year and the interaction between bonus timing
    and EPF relief. Needs replacing with the real method once sourced.
16. `calculateEPF`'s age-band matching only has `PayrollProfileSnapshot.isBelow60`
    (no raw age), so config rows are matched heuristically: a row with an
    upper bound (`maxAge`) is treated as the "below 60" row, one with a
    lower bound (`minAge`) as the "60+" row, and a row with neither bound
    as a citizenship-wide universal rate. Revisit if a config ever needs
    more than two age bands per citizenship status.
17. `calculateEIS`'s `isEisExempt` flag has no backing profile field or UI
    yet — Phase 2's orchestration always passes `false`. Needs a real
    exemption rule/data source (e.g. age-at-first-registration, civil
    servant status) before it can be set meaningfully.
18. `calculateAnnualTaxableIncome`'s EPF_LIFE_INSURANCE relief annualizes
    the _current month's_ EPF employee contribution rather than actual
    year-to-date EPF, since no `previousCumulativeEpfForYear` input exists
    yet — will overstate/understate the relief for anyone whose EPF wage
    varies month to month.
19. **Resolved in Phase 5.** `PayrollProfileSnapshot`/`PayrollProfile` still
    has no "preferred monthly savings target" field — instead, `SavingsPlan`
    (already scoped one-per-`SalaryEntry`, not per-profile) gained a
    `monthlySavingsTarget Decimal?` column. The planner's "Monthly savings
    target" input persists there when saved on `/dashboard`; it remains
    ephemeral in local mode, same as before. "Emergency fund target" is
    still not a distinct persisted field — `EMERGENCY_FUND` is one of the
    `SavingsCategory` allocation rows instead, which already captures a
    per-month amount for it.
20. **Resolved in Phase 5.** All 6 of spec §7's required charts now exist:
    the 3 original single-calculation charts (Phase 3) plus monthly savings
    trend, salary/support history (`src/components/dashboard/history-trends.tsx`,
    always visible on `/dashboard` for signed-in users), and the annual
    totals chart on `/history/annual` — sourced from
    `src/lib/history/list-monthly-series.ts`.
21. `PayrollProfile` is **not versioned per calculation** — history detail
    (`src/lib/history/load-calculation-detail.ts`) recomputes against the
    *pinned* `PayrollConfiguration` but always the user's *current*
    `PayrollProfile` row. This is moot today (no profile-editing UI exists,
    so the profile never changes after signup), but becomes a real
    correctness gap the moment profile editing ships: editing a profile
    would silently change how every past calculation recomputes on
    re-view. Flagged as a hard requirement for that future work (either
    version the profile the same way configuration is versioned, or
    snapshot the resolved profile fields onto `SalaryEntry`/
    `SalaryCalculation` at save time). **Phase 5 note**: this now also
    applies to the edit flow (`/history/[id]/edit`) — re-saving a month
    recomputes against the *current* profile, the same caveat as history
    detail's recompute, no longer purely hypothetical now that a real
    re-save path exists.
22. **Resolved.** Session cookies are now `Secure` — the app is served over
    `https://planner.starlahubs.xyz` via a reverse proxy (TLS terminated
    upstream; `AUTH_URL` set to the `https://` domain, `trustHost: true` in
    `auth.config.ts`). The Phase 4/5 bare-`http://<ip>:<port>` deployment is
    no longer how this app is publicly accessed — the raw IP:port only
    works for direct host-local checks now, not signed-in flows (a `Secure`
    cookie won't round-trip over plain HTTP).
23. The login/signup rate limiter (`src/lib/auth/rate-limit.ts`) is an
    **in-memory, single-instance, keyed-by-email** sliding window. It resets
    on every redeploy/restart, doesn't share state across multiple app
    instances, and can't see a real client IP (no reverse proxy supplying
    trustworthy `X-Forwarded-For` in the current deployment). Sufficient to
    blunt casual brute-forcing today; a real fix needs Redis (or similar)
    behind a reverse proxy that terminates and forwards real client IPs —
    out of scope for Phase 4.
24. Audit logging (spec §12) is deferred entirely — it scopes to admin
    config-editing, and no admin UI exists yet (see item 6 in
    `docs/architecture.md`'s user flow). Nothing meaningful to log until
    that ships; deferred consistently with Phase 4's "core history scope
    only" decision rather than built speculatively ahead of the feature it
    would audit.
25. The annual summary's "average effective deduction rate"
    (`computeAnnualSummary`) is an **equal-weighted average of each month's
    own rate**, not income-weighted (`totalDeductions / totalGross`, which
    would let a higher-income month count more). Explicit decision, not an
    oversight — the literal "average of the monthly rates" reading, and
    simpler to explain against the number shown.
26. **Duplicate** and **edit** have no dedicated schema support for
    "this entry was duplicated from that one" or "this is an edit, not an
    original" — both are pure application logic over the existing
    `SalaryEntry`/`SalaryCalculation` upsert-by-`(userId, payrollMonth)`
    behavior. Duplicate targeting a month that already has a saved entry
    **overwrites it**, exactly like any other resave — the duplicate
    picker's collision warning is the only thing standing between the user
    and that overwrite, so the confirmation step is load-bearing, not
    decorative.
27. `SalaryEntryForm`'s offline draft path (Phase 5) has no computed
    preview — the calculation engine only runs server-side (it needs a
    resolved `PayrollConfigSnapshot` from Prisma), so an offline submission
    can only capture the raw form input, not a live estimate. The user
    only sees figures once the draft syncs. Savings-plan data is never
    captured in an offline draft either, since the savings step itself
    only becomes reachable after a server-computed result exists.
