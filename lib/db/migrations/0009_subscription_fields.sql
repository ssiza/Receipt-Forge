-- Add new subscription fields to teams table
ALTER TABLE "teams" ADD COLUMN "plan" varchar(20) DEFAULT 'free';
ALTER TABLE "teams" ADD COLUMN "status" varchar(20) DEFAULT 'free';
ALTER TABLE "teams" ADD COLUMN "current_period_end" timestamp;
ALTER TABLE "teams" ADD COLUMN "current_period_start" timestamp;

-- Update existing records to have proper defaults
UPDATE "teams" SET 
  "plan" = 'free',
  "status" = 'free'
WHERE "plan" IS NULL OR "status" IS NULL; 