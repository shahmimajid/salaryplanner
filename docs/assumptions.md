# Key Assumptions & Unresolved Statutory Questions

The seed payroll configuration
(`prisma/seed-data/payroll-config.default.v2026.1.json`) is **illustrative
and UNVERIFIED** against current official Malaysian statutory sources
(KWSP/EPF, PERKESO/SOCSO, LHDN). Do not rely on it for real payroll
decisions. The following must be confirmed before this app can be trusted
for real use:

1. EPF employee/employer contribution rates and the low-wage table (KWSP
   Third Schedule) in the seed data are placeholder/illustrative and
   UNVERIFIED against current official tables.
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
    verified.
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
