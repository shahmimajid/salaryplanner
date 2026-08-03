import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ConfigLifecycleFormValues } from "@/components/admin/config-schema";

const payrollConfigurationUpdate = vi.fn();
const payrollConfigurationFindFirst = vi.fn();
const auditLogCreate = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    $transaction: async (fn: (tx: unknown) => unknown) =>
      fn({
        payrollConfiguration: {
          update: (...args: unknown[]) => payrollConfigurationUpdate(...args),
          findFirst: (...args: unknown[]) => payrollConfigurationFindFirst(...args),
        },
        auditLog: { create: (...args: unknown[]) => auditLogCreate(...args) },
      }),
  },
}));

const { updateConfigLifecycle } = await import("./update-config-lifecycle");

const VALID_INPUT: ConfigLifecycleFormValues = {
  isActive: false,
  effectiveTo: "2026-12-31",
};

beforeEach(() => {
  vi.clearAllMocks();
  payrollConfigurationFindFirst.mockResolvedValue(null);
});

describe("updateConfigLifecycle", () => {
  it("updates only isActive and effectiveTo — never the nested rate arrays", async () => {
    const result = await updateConfigLifecycle("user-1", "config-1", VALID_INPUT);

    expect(result.ok).toBe(true);
    expect(payrollConfigurationUpdate).toHaveBeenCalledWith({
      where: { id: "config-1" },
      data: { isActive: false, effectiveTo: new Date("2026-12-31") },
    });
    expect(auditLogCreate).toHaveBeenCalledTimes(1);
    expect(auditLogCreate.mock.calls[0][0]).toMatchObject({
      data: {
        userId: "user-1",
        action: "CONFIG_CHANGE",
        entityType: "PayrollConfiguration",
        entityId: "config-1",
      },
    });
  });

  it("clears effectiveTo when null is submitted", async () => {
    const result = await updateConfigLifecycle("user-1", "config-1", {
      isActive: true,
      effectiveTo: null,
    });

    expect(result.ok).toBe(true);
    expect(payrollConfigurationUpdate).toHaveBeenCalledWith({
      where: { id: "config-1" },
      data: { isActive: true, effectiveTo: null },
    });
  });

  it("rejects activating a config while a different one is already active", async () => {
    payrollConfigurationFindFirst.mockResolvedValueOnce({ id: "config-other", version: "2025.9" });

    const result = await updateConfigLifecycle("user-1", "config-1", {
      isActive: true,
      effectiveTo: null,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors.isActive?.[0]).toMatch(/2025\.9 is already active/);
    }
    expect(payrollConfigurationUpdate).not.toHaveBeenCalled();
  });

  it("excludes the config being updated from its own active-conflict check", async () => {
    const result = await updateConfigLifecycle("user-1", "config-1", {
      isActive: true,
      effectiveTo: null,
    });

    expect(result.ok).toBe(true);
    expect(payrollConfigurationFindFirst).toHaveBeenCalledWith({
      where: { isActive: true, id: { not: "config-1" } },
    });
  });

  it("skips the active-conflict check entirely when deactivating", async () => {
    const result = await updateConfigLifecycle("user-1", "config-1", VALID_INPUT);

    expect(result.ok).toBe(true);
    expect(payrollConfigurationFindFirst).not.toHaveBeenCalled();
  });
});
