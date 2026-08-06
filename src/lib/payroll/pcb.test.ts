import { describe, expect, it } from "vitest";
import Decimal from "decimal.js";
import { calculatePCB } from "./pcb";
import { buildRealisticTestConfig } from "./test-fixtures";

const d = (n: number) => new Decimal(n);
const config = buildRealisticTestConfig();

describe("calculatePCB", () => {
  it("computes month-1 PCB with no prior cumulative payments", () => {
    const result = calculatePCB({
      projectedAnnualChargeableIncome: d(158400.01), // bracket 100000.01-400000 @25% base9400
      residencyStatus: "RESIDENT",
      previousCumulativePcbPaid: d(0),
      monthsRemainingInYear: 12,
      zakatAmount: d(0),
      bonusOrIrregularPayment: null,
      config,
    });

    expect(result.annualTaxPayable.toString()).toBe("24000");
    expect(result.monthlyPcbBeforeRebates.toString()).toBe("2000");
    expect(result.currentMonthPcb.toString()).toBe("2000");
    expect(result.rebatesApplied).toEqual([]);
  });

  it("reconciles a steady income so current-month PCB matches the monthly rate", () => {
    const result = calculatePCB({
      projectedAnnualChargeableIncome: d(158400.01),
      residencyStatus: "RESIDENT",
      previousCumulativePcbPaid: d(10000), // 5 months already paid at 2000/mo
      monthsRemainingInYear: 7,
      zakatAmount: d(0),
      bonusOrIrregularPayment: null,
      config,
    });

    expect(result.currentMonthPcb.toString()).toBe("2000");
  });

  it("spreads a shortfall evenly across the remaining months (LHDN's official formula, not a one-month catch-up)", () => {
    const result = calculatePCB({
      projectedAnnualChargeableIncome: d(158400.01), // annualTaxPayable=24000
      residencyStatus: "RESIDENT",
      previousCumulativePcbPaid: d(5000), // less than the 12000 a steady 2000/mo pace would have paid by now
      monthsRemainingInYear: 7,
      zakatAmount: d(0),
      bonusOrIrregularPayment: null,
      config,
    });

    // (24000 - 5000) / 7 = 2714.2857... -> truncate 2dp -> round up to next 5 sen
    expect(result.currentMonthPcb.toString()).toBe("2714.3");
  });

  it("floors current-month PCB at zero when prior withholding already exceeds the full annual liability", () => {
    const result = calculatePCB({
      projectedAnnualChargeableIncome: d(158400.01), // annualTaxPayable=24000
      residencyStatus: "RESIDENT",
      previousCumulativePcbPaid: d(25000), // already paid more than the whole year's liability
      monthsRemainingInYear: 7,
      zakatAmount: d(0),
      bonusOrIrregularPayment: null,
      config,
    });

    expect(result.currentMonthPcb.toString()).toBe("0");
  });

  it("recomputes the annual liability fresh from a later month's own chargeable income, not a flat rate applied since month 1 (LHDN's official formula — pinned against a real Feb 2025 payslip)", () => {
    const result = calculatePCB({
      // February's own projected chargeable income (differs from January's,
      // since it reflects Feb's higher gross + the EPF-relief-cap
      // K/K1/K2 projection) — annualTaxPayable = (228776-100000)*25%+9400 = 41594.
      projectedAnnualChargeableIncome: d(228776),
      residencyStatus: "RESIDENT",
      previousCumulativePcbPaid: d(3025.3), // January's real PCB, per the payslip
      monthsRemainingInYear: 11, // Feb through Dec inclusive
      zakatAmount: d(0),
      bonusOrIrregularPayment: null,
      config,
    });

    // (41594 - 3025.30) / 11 = 3506.2454... -> truncate 2dp -> round up to next 5 sen
    expect(result.currentMonthPcb.toString()).toBe("3506.25");
  });

  it("applies an uncapped zakat rebate exactly against PCB owed", () => {
    const result = calculatePCB({
      projectedAnnualChargeableIncome: d(158400.01),
      residencyStatus: "RESIDENT",
      previousCumulativePcbPaid: d(0),
      monthsRemainingInYear: 12,
      zakatAmount: d(2000),
      bonusOrIrregularPayment: null,
      config,
    });

    expect(result.currentMonthPcb.toString()).toBe("0");
    expect(result.rebatesApplied).toHaveLength(1);
    expect(result.rebatesApplied[0].code).toBe("ZAKAT_REBATE");
    expect(result.rebatesApplied[0].amount.toString()).toBe("2000");
  });

  it("clips a zakat rebate larger than the PCB actually owed this month", () => {
    const result = calculatePCB({
      projectedAnnualChargeableIncome: d(158400.01),
      residencyStatus: "RESIDENT",
      previousCumulativePcbPaid: d(0),
      monthsRemainingInYear: 12,
      zakatAmount: d(5000),
      bonusOrIrregularPayment: null,
      config,
    });

    expect(result.currentMonthPcb.toString()).toBe("0");
    expect(result.rebatesApplied).toHaveLength(1);
    expect(result.rebatesApplied[0].code).toBe("ZAKAT_REBATE");
    expect(result.rebatesApplied[0].amount.toString()).toBe("2000");
  });

  it("applies the flat NON_RESIDENT rate", () => {
    const result = calculatePCB({
      projectedAnnualChargeableIncome: d(100000),
      residencyStatus: "NON_RESIDENT",
      previousCumulativePcbPaid: d(0),
      monthsRemainingInYear: 12,
      zakatAmount: d(0),
      bonusOrIrregularPayment: null,
      config,
    });

    expect(result.annualTaxPayable.toString()).toBe("30000");
    expect(result.currentMonthPcb.toString()).toBe("2500");
  });

  it("computes additional PCB for a bonus within the same bracket via marginal bracket difference", () => {
    const result = calculatePCB({
      projectedAnnualChargeableIncome: d(158400.01),
      residencyStatus: "RESIDENT",
      previousCumulativePcbPaid: d(0),
      monthsRemainingInYear: 12,
      zakatAmount: d(0),
      bonusOrIrregularPayment: d(50000),
      config,
    });

    // base annualTaxPayable=24000; with bonus, income=208400.01, still the
    // 25% bracket: 9400 + (208400.01-100000.01)*0.25 = 36500; diff = 12500
    // total current-month PCB = 2000 (base monthly) + 12500 (bonus diff)
    expect(result.currentMonthPcb.toString()).toBe("14500");
  });

  it("computes additional PCB for a bonus that spans into a higher bracket", () => {
    const result = calculatePCB({
      projectedAnnualChargeableIncome: d(100800.01), // annualTaxPayable=9600, monthly=800
      residencyStatus: "RESIDENT",
      previousCumulativePcbPaid: d(0),
      monthsRemainingInYear: 12,
      zakatAmount: d(0),
      bonusOrIrregularPayment: d(300000), // pushes into the 400000.01-600000 @26% bracket
      config,
    });

    // annualTaxWithBonus = 84400 + (400800.01-400000.01)*0.26 = 84608
    // diff = 84608 - 9600 = 75008; current month = 800 (base) + 75008
    expect(result.currentMonthPcb.toString()).toBe("75808");
    // bracketApplied still reflects the base (non-bonus) bracket — documented limitation
    expect(result.bracketApplied?.ratePercent.toString()).toBe("25");
  });

  it("applies an income-threshold rebate (e.g. Section 6A RM400) once against the annual liability, not per month", () => {
    const rebateConfig = buildRealisticTestConfig({
      taxRebates: [
        { code: "ZAKAT_REBATE", amount: null, incomeThreshold: null },
        { code: "INDIVIDUAL_REBATE_35K", amount: d(400), incomeThreshold: d(35000) },
      ],
    });

    const result = calculatePCB({
      // bracket 20000.01-35000 @3% base150: 150+(30000.01-20000.01)*0.03=450
      projectedAnnualChargeableIncome: d(30000.01),
      residencyStatus: "RESIDENT",
      previousCumulativePcbPaid: d(0),
      monthsRemainingInYear: 12,
      zakatAmount: d(0),
      bonusOrIrregularPayment: null,
      config: rebateConfig,
    });

    // annualTaxPayable before rebate = 450; rebate reduces the ANNUAL figure
    // once (to 50), then /12 for the month — not subtracted from a single
    // month's PCB the way zakat is.
    expect(result.annualTaxPayable.toString()).toBe("50");
    expect(result.monthlyPcbBeforeRebates.toString()).toBe("4.17"); // 50/12 rounded
    expect(result.rebatesApplied).toHaveLength(1);
    expect(result.rebatesApplied[0].code).toBe("INDIVIDUAL_REBATE_35K");
    expect(result.rebatesApplied[0].amount.toString()).toBe("400");
  });

  it("does not apply the income-threshold rebate once chargeable income exceeds the threshold", () => {
    const rebateConfig = buildRealisticTestConfig({
      taxRebates: [
        { code: "ZAKAT_REBATE", amount: null, incomeThreshold: null },
        { code: "INDIVIDUAL_REBATE_35K", amount: d(400), incomeThreshold: d(35000) },
      ],
    });

    const result = calculatePCB({
      projectedAnnualChargeableIncome: d(158400.01),
      residencyStatus: "RESIDENT",
      previousCumulativePcbPaid: d(0),
      monthsRemainingInYear: 12,
      zakatAmount: d(0),
      bonusOrIrregularPayment: null,
      config: rebateConfig,
    });

    expect(result.annualTaxPayable.toString()).toBe("24000");
    expect(result.rebatesApplied).toEqual([]);
  });

  it("subtracts M as the previous bracket's upper bound, not this bracket's own lower bound (LHDN MTD spec Table 1)", () => {
    // Table 1's displayed range "100,001-400,000" uses M=100,000, not
    // 100,001 — M is the previous bracket's chargeableIncomeTo.
    const officialBracketsConfig = buildRealisticTestConfig({
      taxBrackets: [
        {
          residencyStatus: "RESIDENT",
          chargeableIncomeFrom: d(0),
          chargeableIncomeTo: d(100000),
          ratePercent: d(0),
          cumulativeTaxBase: d(0),
        },
        {
          residencyStatus: "RESIDENT",
          chargeableIncomeFrom: d(100001),
          chargeableIncomeTo: null,
          ratePercent: d(25),
          cumulativeTaxBase: d(9400),
        },
      ],
    });

    const result = calculatePCB({
      projectedAnnualChargeableIncome: d(207656),
      residencyStatus: "RESIDENT",
      previousCumulativePcbPaid: d(0),
      monthsRemainingInYear: 12,
      zakatAmount: d(0),
      bonusOrIrregularPayment: null,
      config: officialBracketsConfig,
    });

    // (207656 - 100000) * 25% + 9400 = 36314 — using 100,001 instead would
    // give 36313.75.
    expect(result.annualTaxPayable.toString()).toBe("36314");
  });

  it("rounds the final PCB up to the next 5 sen (LHDN MTD spec), not to the nearest cent", () => {
    const result = calculatePCB({
      // annualTaxPayable=36314.02 (chosen to leave a non-5-sen remainder
      // after dividing by 12), monthly=3026.1683... -> truncates to
      // 3026.16 -> rounds up to 3026.20, not 3026.17.
      projectedAnnualChargeableIncome: d(207656.08),
      residencyStatus: "RESIDENT",
      previousCumulativePcbPaid: d(0),
      monthsRemainingInYear: 12,
      zakatAmount: d(0),
      bonusOrIrregularPayment: null,
      config,
    });

    expect(result.currentMonthPcb.toString()).toBe("3026.2");
  });

  it("throws a descriptive error when no bracket covers the chargeable income", () => {
    const gappyConfig = buildRealisticTestConfig({
      taxBrackets: [
        {
          residencyStatus: "RESIDENT",
          chargeableIncomeFrom: d(0),
          chargeableIncomeTo: d(5000),
          ratePercent: d(0),
          cumulativeTaxBase: d(0),
        },
      ],
    });

    expect(() =>
      calculatePCB({
        projectedAnnualChargeableIncome: d(100000),
        residencyStatus: "RESIDENT",
        previousCumulativePcbPaid: d(0),
        monthsRemainingInYear: 12,
        zakatAmount: d(0),
        bonusOrIrregularPayment: null,
        config: gappyConfig,
      }),
    ).toThrow(/No tax bracket configured/);
  });
});
