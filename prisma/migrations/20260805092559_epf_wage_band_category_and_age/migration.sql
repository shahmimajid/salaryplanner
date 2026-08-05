-- AlterTable
-- Backfill existing rows as CITIZEN before making the column required — the
-- only existing rows are the illustrative seed's tiny placeholder bands,
-- which predate this fix and were never category-specific anyway.
ALTER TABLE "epf_wage_bands" ADD COLUMN     "citizenship_status" "CitizenshipStatus",
ADD COLUMN     "max_age" INTEGER,
ADD COLUMN     "min_age" INTEGER;

UPDATE "epf_wage_bands" SET "citizenship_status" = 'CITIZEN' WHERE "citizenship_status" IS NULL;

ALTER TABLE "epf_wage_bands" ALTER COLUMN "citizenship_status" SET NOT NULL;
