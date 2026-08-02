-- AlterTable
ALTER TABLE "epf_rates" ADD COLUMN     "employer_rate_above_percent" DECIMAL(6,3),
ADD COLUMN     "employer_rate_threshold" DECIMAL(12,2);
