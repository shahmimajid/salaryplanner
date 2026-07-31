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

| basicSalary | weekendSupportGross | grossSalary | epf     | socso | eis   | pcb     | netSalary | netWeekendSupport | takeHomePercent |
| ----------- | ------------------- | ----------- | ------- | ----- | ----- | ------- | --------- | ----------------- | --------------- |
| 19088.00    | 0.00                | 19088.00    | 2099.68 | 39.75 | 39.50 | 2888.67 | 14020.40  | 0.00              | 73.451          |
| 19088.00    | 500.00              | 19588.00    | 2154.68 | 39.75 | 39.50 | 3013.67 | 14340.40  | 320.00            | 73.210          |
| 19088.00    | 1000.00             | 20088.00    | 2209.68 | 39.75 | 39.50 | 3138.67 | 14660.40  | 640.00            | 72.981          |
| 19088.00    | 1500.00             | 20588.00    | 2264.68 | 39.75 | 39.50 | 3263.67 | 14980.40  | 960.00            | 72.763          |
| 19088.00    | 2000.00             | 21088.00    | 2319.68 | 39.75 | 39.50 | 3388.67 | 15300.40  | 1280.00           | 72.555          |
| 19088.00    | 3000.00             | 22088.00    | 2429.68 | 39.75 | 39.50 | 3638.67 | 15940.40  | 1920.00           | 72.168          |
| 23266.00    | 0.00                | 23266.00    | 2559.26 | 39.75 | 39.50 | 3933.17 | 16694.32  | 0.00              | 71.754          |
| 23266.00    | 500.00              | 23766.00    | 2614.26 | 39.75 | 39.50 | 4058.17 | 17014.32  | 320.00            | 71.591          |
| 23266.00    | 1000.00             | 24266.00    | 2669.26 | 39.75 | 39.50 | 4183.17 | 17334.32  | 640.00            | 71.435          |
| 23266.00    | 1500.00             | 24766.00    | 2724.26 | 39.75 | 39.50 | 4308.17 | 17654.32  | 960.00            | 71.285          |
| 23266.00    | 2000.00             | 25266.00    | 2779.26 | 39.75 | 39.50 | 4433.17 | 17974.32  | 1280.00           | 71.140          |
| 23266.00    | 3000.00             | 26266.00    | 2889.26 | 39.75 | 39.50 | 4683.17 | 18614.32  | 1920.00           | 70.868          |

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
