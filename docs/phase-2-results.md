# Phase 2 — Representative Calculation Results

Output of `src/lib/payroll/full-pipeline.test.ts`'s scenario-report test
(`pnpm vitest run src/lib/payroll/full-pipeline.test.ts -t "produces a scenario report"`),
run against the married-with-4-children default profile
(`buildTestProfile()`) and the realistic test fixture config
(`buildRealisticTestConfig()` — illustrative rates, distinct from and more
complete than the production seed; see `docs/assumptions.md`). This is the
literal "show test results for representative salary and weekend-support
scenarios" deliverable from the original spec's Phase 2 definition.

All figures are RM, illustrative/UNVERIFIED (see `docs/assumptions.md`) —
the mechanism (band lookups, cumulative PCB, capping, rounding) is what's
being demonstrated, not the exact real-world rates.

Regenerated 2026-08-06 after two rounding-rule fixes sourced from real
official documents this table's fixture also picks up: EPF now ceils to
the next whole ringgit (was 2dp round-half-up, e.g. `2099.68` → `2100.00`)
and PCB now rounds up to the next 5 sen (was nearest cent, e.g. `2888.67`
→ `2888.70`) — see `docs/assumptions.md` items 1 and 6.

| basicSalary | weekendSupportGross | grossSalary | epf     | socso | eis   | pcb     | netSalary | netWeekendSupport | takeHomePercent |
| ----------- | ------------------- | ----------- | ------- | ----- | ----- | ------- | --------- | ----------------- | --------------- |
| 19088.00    | 0.00                | 19088.00    | 2100.00 | 39.75 | 39.50 | 2888.70 | 14020.05  | 0.00              | 73.450          |
| 19088.00    | 500.00              | 19588.00    | 2155.00 | 39.75 | 39.50 | 3013.70 | 14340.05  | 320.00            | 73.208          |
| 19088.00    | 1000.00             | 20088.00    | 2210.00 | 39.75 | 39.50 | 3138.70 | 14660.05  | 640.00            | 72.979          |
| 19088.00    | 1500.00             | 20588.00    | 2265.00 | 39.75 | 39.50 | 3263.70 | 14980.05  | 960.00            | 72.761          |
| 19088.00    | 2000.00             | 21088.00    | 2320.00 | 39.75 | 39.50 | 3388.70 | 15300.05  | 1280.00           | 72.553          |
| 19088.00    | 3000.00             | 22088.00    | 2430.00 | 39.75 | 39.50 | 3638.70 | 15940.05  | 1920.00           | 72.166          |
| 23266.00    | 0.00                | 23266.00    | 2560.00 | 39.75 | 39.50 | 3933.20 | 16693.55  | 0.00              | 71.751          |
| 23266.00    | 500.00              | 23766.00    | 2615.00 | 39.75 | 39.50 | 4058.20 | 17013.55  | 320.00            | 71.588          |
| 23266.00    | 1000.00             | 24266.00    | 2670.00 | 39.75 | 39.50 | 4183.20 | 17333.55  | 640.00            | 71.431          |
| 23266.00    | 1500.00             | 24766.00    | 2725.00 | 39.75 | 39.50 | 4308.20 | 17653.55  | 960.00            | 71.281          |
| 23266.00    | 2000.00             | 25266.00    | 2780.00 | 39.75 | 39.50 | 4433.20 | 17973.55  | 1280.00           | 71.137          |
| 23266.00    | 3000.00             | 26266.00    | 2890.00 | 39.75 | 39.50 | 4683.20 | 18613.55  | 1920.00           | 70.866          |

Notes on reading this table:

- SOCSO/EIS employee contributions are flat across every row for a given
  salary tier because these salaries are already above the fixture's
  RM6,000 statutory ceiling — adding weekend-support allowance correctly
  does **not** push them higher (spec §4/§5 requirement, verified in
  `socso.test.ts`/`eis.test.ts`).
- `netWeekendSupport` happens to come out to exactly 64% of
  `weekendSupportGross` in every row above — but that ratio is **derived**,
  not hardcoded: it comes from running the full pipeline twice (with/without
  the allowance) and taking the real delta (11% marginal EPF + 25% marginal
  PCB + 0% marginal SOCSO/EIS, since both are already at their ceiling).
  The spec explicitly warns against assuming a fixed "RM1,000 → RM640 net"
  constant; this table shows the constant _emerging_ from real per-component
  math at this particular salary/bracket, not being assumed — a salary near
  a bracket boundary or a lower relief ceiling would produce a different
  ratio, and `pcb.test.ts`/`weekend-support.test.ts` cover those cases.
- `pcb` rises with weekend support because the allowance is included in
  EPF/annualized taxable income (though not in SOCSO/EIS wage, see
  `docs/architecture.md`'s orchestration contract).
