import { describe, expect, it } from "vitest";
import Decimal from "decimal.js";
import { roundMoney, roundPcb, roundRate } from "./rounding";

describe("roundMoney", () => {
  it("rounds .xx5 boundaries up (away from zero)", () => {
    expect(roundMoney(new Decimal("10.005")).toString()).toBe("10.01");
    expect(roundMoney(new Decimal("500.005")).toString()).toBe("500.01");
  });

  it("passes exact 2dp values through unchanged", () => {
    expect(roundMoney(new Decimal("19088.00")).toString()).toBe("19088");
  });

  it("rounds down when below the halfway point", () => {
    expect(roundMoney(new Decimal("10.004")).toString()).toBe("10");
  });
});

describe("roundRate", () => {
  it("rounds to 3 decimal places by default", () => {
    expect(roundRate(new Decimal("11.23456")).toString()).toBe("11.235");
  });
});

describe("roundPcb", () => {
  // LHDN's official MTD spec (Terms and Conditions #1-2): truncate to 2dp
  // (never round), then round UP to the next 5 sen.
  it("rounds 1-4 cents up to 5 cents", () => {
    expect(roundPcb(new Decimal("287.02")).toString()).toBe("287.05");
  });

  it("rounds 6-9 cents up to the next 10 cents", () => {
    expect(roundPcb(new Decimal("152.06")).toString()).toBe("152.1");
  });

  it("truncates (never rounds) beyond 2dp before applying the 5-cent ceiling", () => {
    // 123.459 truncates to 123.45 (already a multiple of 5 cents, unchanged
    // by the ceiling step) — if this instead rounded to 2dp first (123.46),
    // it would wrongly land on 123.50.
    expect(roundPcb(new Decimal("123.459")).toString()).toBe("123.45");
  });

  it("leaves an exact multiple of 5 cents unchanged", () => {
    expect(roundPcb(new Decimal("3025.30")).toString()).toBe("3025.3");
  });

  it("leaves a whole ringgit amount unchanged", () => {
    expect(roundPcb(new Decimal("2000")).toString()).toBe("2000");
  });
});
