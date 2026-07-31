import { describe, expect, it } from "vitest";
import Decimal from "decimal.js";
import { calculateNetSalary } from "./net-salary";

describe("calculateNetSalary", () => {
  it("is not yet implemented (Phase 2)", () => {
    expect(() =>
      calculateNetSalary({
        grossSalary: new Decimal(0),
        epfEmployee: new Decimal(0),
        socsoEmployee: new Decimal(0),
        eisEmployee: new Decimal(0),
        pcb: new Decimal(0),
        zakat: new Decimal(0),
        otherDeductions: new Decimal(0),
      }),
    ).toThrow("Not implemented — Phase 2");
  });
});
