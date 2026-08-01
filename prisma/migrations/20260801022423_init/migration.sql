-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED');

-- CreateEnum
CREATE TYPE "ResidencyStatus" AS ENUM ('RESIDENT', 'NON_RESIDENT');

-- CreateEnum
CREATE TYPE "CitizenshipStatus" AS ENUM ('CITIZEN', 'PERMANENT_RESIDENT', 'NON_CITIZEN');

-- CreateEnum
CREATE TYPE "SocsoCategory" AS ENUM ('CATEGORY_1', 'CATEGORY_2');

-- CreateEnum
CREATE TYPE "WeekendSupportPaymentMethod" AS ENUM ('FIXED_PER_DAY', 'FIXED_MONTHLY', 'MANUAL_TOTAL');

-- CreateEnum
CREATE TYPE "DeductionCategory" AS ENUM ('EPF_EMPLOYEE', 'SOCSO_EMPLOYEE', 'EIS_EMPLOYEE', 'PCB', 'ZAKAT', 'OTHER');

-- CreateEnum
CREATE TYPE "SavingsCategory" AS ENUM ('HOUSING', 'CAR', 'UTILITIES', 'FOOD', 'CHILDREN', 'INSURANCE_TAKAFUL', 'DEBT', 'INVESTMENT', 'EMERGENCY_FUND', 'GENERAL_SAVINGS', 'WEEKEND_SUPPORT_SAVINGS', 'PERSONAL_SPENDING');

-- CreateEnum
CREATE TYPE "AllocationType" AS ENUM ('FIXED_AMOUNT', 'PERCENTAGE');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'CONFIG_CHANGE', 'EXPORT');

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified" TIMESTAMP(3),
    "name" TEXT,
    "image" TEXT,
    "password_hash" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "citizenship_status" "CitizenshipStatus" NOT NULL DEFAULT 'CITIZEN',
    "is_below_60" BOOLEAN NOT NULL DEFAULT true,
    "residency_status" "ResidencyStatus" NOT NULL DEFAULT 'RESIDENT',
    "marital_status" "MaritalStatus" NOT NULL DEFAULT 'MARRIED',
    "spouse_has_income" BOOLEAN NOT NULL DEFAULT false,
    "number_of_children" INTEGER NOT NULL DEFAULT 4,
    "child_relief_claims" JSONB NOT NULL DEFAULT '[]',
    "epf_employee_rate_percent" DECIMAL(6,3) NOT NULL DEFAULT 11.000,
    "lindung_24_jam_opt_in" BOOLEAN NOT NULL DEFAULT false,
    "zakat_enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salary_entries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "payroll_month" DATE NOT NULL,
    "basic_salary" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "fixed_allowance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "weekend_support_allowance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "weekend_support_payment_method" "WeekendSupportPaymentMethod",
    "weekend_support_days_count" INTEGER,
    "weekend_support_rate_per_day" DECIMAL(12,2),
    "bonus" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "commission" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "other_taxable_income" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "other_non_taxable_reimbursement" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "epf_adjustment" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "zakat" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "previous_cumulative_income_for_year" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "previous_cumulative_pcb_paid" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salary_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salary_calculations" (
    "id" TEXT NOT NULL,
    "salary_entry_id" TEXT NOT NULL,
    "payroll_configuration_id" TEXT NOT NULL,
    "gross_salary" DECIMAL(12,2) NOT NULL,
    "epf_employee" DECIMAL(12,2) NOT NULL,
    "socso_employee" DECIMAL(12,2) NOT NULL,
    "eis_employee" DECIMAL(12,2) NOT NULL,
    "pcb" DECIMAL(12,2) NOT NULL,
    "zakat" DECIMAL(12,2) NOT NULL,
    "other_deductions" DECIMAL(12,2) NOT NULL,
    "total_deductions" DECIMAL(12,2) NOT NULL,
    "net_salary" DECIMAL(12,2) NOT NULL,
    "net_weekend_support_income" DECIMAL(12,2) NOT NULL,
    "effective_deduction_rate_percent" DECIMAL(6,3) NOT NULL,
    "effective_take_home_percent" DECIMAL(6,3) NOT NULL,
    "is_current" BOOLEAN NOT NULL DEFAULT true,
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "salary_calculations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deduction_breakdowns" (
    "id" TEXT NOT NULL,
    "salary_calculation_id" TEXT NOT NULL,
    "category" "DeductionCategory" NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "deduction_breakdowns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "savings_plans" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "salary_entry_id" TEXT,
    "name" TEXT NOT NULL,
    "effective_month" DATE NOT NULL,
    "save_all_net_weekend_support" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "savings_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "savings_allocations" (
    "id" TEXT NOT NULL,
    "savings_plan_id" TEXT NOT NULL,
    "category" "SavingsCategory" NOT NULL,
    "allocation_type" "AllocationType" NOT NULL,
    "amount" DECIMAL(12,2),
    "percentage" DECIMAL(5,2),
    "computed_amount" DECIMAL(12,2),
    "notes" TEXT,

    CONSTRAINT "savings_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_configurations" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "source_reference" TEXT NOT NULL,
    "notes" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payroll_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "epf_rates" (
    "id" TEXT NOT NULL,
    "payroll_configuration_id" TEXT NOT NULL,
    "citizenship_status" "CitizenshipStatus" NOT NULL,
    "min_age" INTEGER,
    "max_age" INTEGER,
    "employee_rate_percent" DECIMAL(6,3) NOT NULL,
    "employer_rate_percent" DECIMAL(6,3) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "epf_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "epf_wage_bands" (
    "id" TEXT NOT NULL,
    "payroll_configuration_id" TEXT NOT NULL,
    "wage_from" DECIMAL(12,2) NOT NULL,
    "wage_to" DECIMAL(12,2),
    "employee_contribution" DECIMAL(12,2) NOT NULL,
    "employer_contribution" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "epf_wage_bands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "socso_rates" (
    "id" TEXT NOT NULL,
    "payroll_configuration_id" TEXT NOT NULL,
    "category" "SocsoCategory" NOT NULL,
    "wage_from" DECIMAL(12,2) NOT NULL,
    "wage_to" DECIMAL(12,2),
    "employee_contribution" DECIMAL(12,2) NOT NULL,
    "employer_contribution" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "socso_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eis_rates" (
    "id" TEXT NOT NULL,
    "payroll_configuration_id" TEXT NOT NULL,
    "wage_from" DECIMAL(12,2) NOT NULL,
    "wage_to" DECIMAL(12,2),
    "employee_contribution" DECIMAL(12,2) NOT NULL,
    "employer_contribution" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "eis_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_brackets" (
    "id" TEXT NOT NULL,
    "payroll_configuration_id" TEXT NOT NULL,
    "residencyStatus" "ResidencyStatus" NOT NULL,
    "chargeable_income_from" DECIMAL(14,2) NOT NULL,
    "chargeable_income_to" DECIMAL(14,2),
    "rate_percent" DECIMAL(6,3) NOT NULL,
    "cumulative_tax_base" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "tax_brackets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_reliefs" (
    "id" TEXT NOT NULL,
    "payroll_configuration_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "max_amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT,

    CONSTRAINT "tax_reliefs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_rebates" (
    "id" TEXT NOT NULL,
    "payroll_configuration_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DECIMAL(12,2),
    "income_threshold" DECIMAL(14,2),
    "description" TEXT,

    CONSTRAINT "tax_rebates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" "AuditAction" NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "changes_json" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_profiles_user_id_key" ON "payroll_profiles"("user_id");

-- CreateIndex
CREATE INDEX "salary_entries_user_id_payroll_month_idx" ON "salary_entries"("user_id", "payroll_month");

-- CreateIndex
CREATE INDEX "salary_calculations_salary_entry_id_is_current_idx" ON "salary_calculations"("salary_entry_id", "is_current");

-- CreateIndex
CREATE INDEX "savings_plans_user_id_effective_month_idx" ON "savings_plans"("user_id", "effective_month");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_configurations_version_key" ON "payroll_configurations"("version");

-- CreateIndex
CREATE INDEX "payroll_configurations_effective_from_effective_to_idx" ON "payroll_configurations"("effective_from", "effective_to");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_profiles" ADD CONSTRAINT "payroll_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_entries" ADD CONSTRAINT "salary_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_calculations" ADD CONSTRAINT "salary_calculations_salary_entry_id_fkey" FOREIGN KEY ("salary_entry_id") REFERENCES "salary_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_calculations" ADD CONSTRAINT "salary_calculations_payroll_configuration_id_fkey" FOREIGN KEY ("payroll_configuration_id") REFERENCES "payroll_configurations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deduction_breakdowns" ADD CONSTRAINT "deduction_breakdowns_salary_calculation_id_fkey" FOREIGN KEY ("salary_calculation_id") REFERENCES "salary_calculations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings_plans" ADD CONSTRAINT "savings_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings_plans" ADD CONSTRAINT "savings_plans_salary_entry_id_fkey" FOREIGN KEY ("salary_entry_id") REFERENCES "salary_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings_allocations" ADD CONSTRAINT "savings_allocations_savings_plan_id_fkey" FOREIGN KEY ("savings_plan_id") REFERENCES "savings_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_configurations" ADD CONSTRAINT "payroll_configurations_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "epf_rates" ADD CONSTRAINT "epf_rates_payroll_configuration_id_fkey" FOREIGN KEY ("payroll_configuration_id") REFERENCES "payroll_configurations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "epf_wage_bands" ADD CONSTRAINT "epf_wage_bands_payroll_configuration_id_fkey" FOREIGN KEY ("payroll_configuration_id") REFERENCES "payroll_configurations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "socso_rates" ADD CONSTRAINT "socso_rates_payroll_configuration_id_fkey" FOREIGN KEY ("payroll_configuration_id") REFERENCES "payroll_configurations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eis_rates" ADD CONSTRAINT "eis_rates_payroll_configuration_id_fkey" FOREIGN KEY ("payroll_configuration_id") REFERENCES "payroll_configurations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_brackets" ADD CONSTRAINT "tax_brackets_payroll_configuration_id_fkey" FOREIGN KEY ("payroll_configuration_id") REFERENCES "payroll_configurations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_reliefs" ADD CONSTRAINT "tax_reliefs_payroll_configuration_id_fkey" FOREIGN KEY ("payroll_configuration_id") REFERENCES "payroll_configurations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_rebates" ADD CONSTRAINT "tax_rebates_payroll_configuration_id_fkey" FOREIGN KEY ("payroll_configuration_id") REFERENCES "payroll_configurations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
