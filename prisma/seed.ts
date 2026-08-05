import "dotenv/config";
import {
  PrismaClient,
  type CitizenshipStatus,
  type ResidencyStatus,
  type SocsoCategory,
} from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import payrollConfigJson from "./seed-data/payroll-config.default.v2026.1.json";

// JSON module imports widen enum-like string fields to `string`, so the raw
// import is cast to this shape once, matching the Prisma enum types.
interface SeedPayrollConfig {
  version: string;
  label: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
  sourceReference: string;
  notes: string | null;
  epfRates: Array<{
    citizenshipStatus: CitizenshipStatus;
    minAge: number | null;
    maxAge: number | null;
    employeeRatePercent: number;
    employerRatePercent: number;
    notes?: string;
  }>;
  epfWageBands: Array<{
    citizenshipStatus: CitizenshipStatus;
    minAge: number | null;
    maxAge: number | null;
    wageFrom: number;
    wageTo: number | null;
    employeeContribution: number;
    employerContribution: number;
  }>;
  socsoRates: Array<{
    category: SocsoCategory;
    wageFrom: number;
    wageTo: number | null;
    employeeContribution: number;
    employerContribution: number;
  }>;
  eisRates: Array<{
    wageFrom: number;
    wageTo: number | null;
    employeeContribution: number;
    employerContribution: number;
  }>;
  taxBrackets: Array<{
    residencyStatus: ResidencyStatus;
    chargeableIncomeFrom: number;
    chargeableIncomeTo: number | null;
    ratePercent: number;
    cumulativeTaxBase: number;
  }>;
  taxReliefs: Array<{
    code: string;
    label: string;
    maxAmount: number;
    description: string | null;
  }>;
  taxRebates: Array<{
    code: string;
    label: string;
    amount: number | null;
    incomeThreshold: number | null;
    description: string | null;
  }>;
}

const payrollConfig = payrollConfigJson as SeedPayrollConfig;

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const systemUser = await prisma.user.upsert({
    where: { email: "seed-system@salaryplanner.local" },
    update: {},
    create: {
      email: "seed-system@salaryplanner.local",
      name: "Seed System",
      role: "ADMIN",
    },
  });

  const existing = await prisma.payrollConfiguration.findUnique({
    where: { version: payrollConfig.version },
  });
  if (existing) {
    console.log(
      `Payroll configuration ${payrollConfig.version} already seeded, skipping.`,
    );
    return;
  }

  await prisma.payrollConfiguration.create({
    data: {
      version: payrollConfig.version,
      label: payrollConfig.label,
      effectiveFrom: new Date(payrollConfig.effectiveFrom),
      effectiveTo: payrollConfig.effectiveTo
        ? new Date(payrollConfig.effectiveTo)
        : null,
      isActive: payrollConfig.isActive,
      sourceReference: payrollConfig.sourceReference,
      notes: payrollConfig.notes,
      createdById: systemUser.id,
      epfRates: { create: payrollConfig.epfRates },
      epfWageBands: { create: payrollConfig.epfWageBands },
      socsoRates: { create: payrollConfig.socsoRates },
      eisRates: { create: payrollConfig.eisRates },
      taxBrackets: { create: payrollConfig.taxBrackets },
      taxReliefs: { create: payrollConfig.taxReliefs },
      taxRebates: { create: payrollConfig.taxRebates },
    },
  });

  console.log(`Seeded payroll configuration ${payrollConfig.version}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
