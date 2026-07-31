import { describe, expect, it } from "vitest";
import Decimal from "decimal.js";
import { roundMoney, roundRate } from "./rounding";

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
