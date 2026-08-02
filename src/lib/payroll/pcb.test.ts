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
      monthsElapsedInYear: 0,
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
      monthsElapsedInYear: 5,
      monthsRemainingInYear: 7,
      zakatAmount: d(0),
      bonusOrIrregularPayment: null,
      config,
    });

    expect(result.currentMonthPcb.toString()).toBe("2000");
  });

  it("catches up a shortfall when income increases mid-year", () => {
    const result = calculatePCB({
      projectedAnnualChargeableIncome: d(158400.01), // now implies 2000/mo
      residencyStatus: "RESIDENT",
      previousCumulativePcbPaid: d(5000), // only 1000/mo was withheld for the first 5 months
      monthsElapsedInYear: 5,
      monthsRemainingInYear: 7,
      zakatAmount: d(0),
      bonusOrIrregularPayment: null,
      config,
    });

    // cumulativeShouldHaveBeenWithheld = 2000*6 = 12000; owed this month = 12000-5000 = 7000
    expect(result.currentMonthPcb.toString()).toBe("7000");
  });

  it("floors current-month PCB at zero when prior withholding already overpaid", () => {
    const result = calculatePCB({
      projectedAnnualChargeableIncome: d(158400.01), // implies 2000/mo
      residencyStatus: "RESIDENT",
      previousCumulativePcbPaid: d(20000), // overpaid relative to 12000 that should be withheld by month 6
      monthsElapsedInYear: 5,
      monthsRemainingInYear: 7,
      zakatAmount: d(0),
      bonusOrIrregularPayment: null,
      config,
    });

    expect(result.currentMonthPcb.toString()).toBe("0");
  });

  it("applies an uncapped zakat rebate exactly against PCB owed", () => {
    const result = calculatePCB({
      projectedAnnualChargeableIncome: d(158400.01),
      residencyStatus: "RESIDENT",
      previousCumulativePcbPaid: d(0),
      monthsElapsedInYear: 0,
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
      monthsElapsedInYear: 0,
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
      monthsElapsedInYear: 0,
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
      monthsElapsedInYear: 0,
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
      monthsElapsedInYear: 0,
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
      monthsElapsedInYear: 0,
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
      monthsElapsedInYear: 0,
      monthsRemainingInYear: 12,
      zakatAmount: d(0),
      bonusOrIrregularPayment: null,
      config: rebateConfig,
    });

    expect(result.annualTaxPayable.toString()).toBe("24000");
    expect(result.rebatesApplied).toEqual([]);
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
        monthsElapsedInYear: 0,
        monthsRemainingInYear: 12,
        zakatAmount: d(0),
        bonusOrIrregularPayment: null,
        config: gappyConfig,
      }),
    ).toThrow(/No tax bracket configured/);
  });
});
