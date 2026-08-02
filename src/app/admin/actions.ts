"use server";

import { requireAdmin } from "@/lib/auth/require-user";
import {
  createPayrollConfiguration,
  type CreateConfigResult,
} from "@/lib/admin/create-payroll-configuration";
import {
  updateConfigLifecycle,
  type LifecycleResult,
} from "@/lib/admin/update-config-lifecycle";
import type {
  ConfigLifecycleFormValues,
  PayrollConfigFormValues,
} from "@/components/admin/config-schema";

export async function createConfigAction(
  input: PayrollConfigFormValues,
): Promise<CreateConfigResult> {
  const user = await requireAdmin();
  return createPayrollConfiguration(user.id, input);
}

export async function updateConfigLifecycleAction(
  id: string,
  input: ConfigLifecycleFormValues,
): Promise<LifecycleResult> {
  const user = await requireAdmin();
  return updateConfigLifecycle(user.id, id, input);
}
