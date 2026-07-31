import { describe, expect, it } from "vitest";
import Decimal from "decimal.js";
import { loadLocalPayrollConfig } from "./load-local-config";

describe("loadLocalPayrollConfig", () => {
  it("parses the seed JSON into a Decimal-hydrated snapshot", () => {
    const config = loadLocalPayrollConfig();

    expect(config.version).toBe("2026.1");
    expect(config.effectiveFrom).toBe("2026-01-01");
    expect(config.effectiveTo).toBeNull();

    expect(config.epfRates).toHaveLength(3);
    expect(config.epfWageBands).toHaveLength(2);
    expect(config.socsoRates).toHaveLength(2);
    expect(config.eisRates).toHaveLength(1);
    expect(config.taxBrackets).toHaveLength(11);
    expect(config.taxReliefs).toHaveLength(4);
    expect(config.taxRebates).toHaveLength(1);

    expect(config.epfRates[0].employeeRatePercent).toBeInstanceOf(Decimal);
    expect(config.epfRates[0].employeeRatePercent.toString()).toBe("11");
  });

  it("caches the snapshot rather than re-parsing on every call", () => {
    const first = loadLocalPayrollConfig();
    const second = loadLocalPayrollConfig();
    expect(first).toBe(second);
  });
});
