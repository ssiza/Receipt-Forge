-- Migration: Remove team dependencies and add userId fields
-- This migration removes team-based architecture and makes tables work with Supabase Auth

-- 1. Add userId field to receipts table
ALTER TABLE receipts ADD COLUMN user_id UUID REFERENCES users(id);

-- 2. Remove teamId constraint from receipts (make it nullable first)
ALTER TABLE receipts ALTER COLUMN team_id DROP NOT NULL;

-- 3. Add userId field to business_templates table
ALTER TABLE business_templates ADD COLUMN user_id UUID REFERENCES users(id);

-- 4. Remove teamId constraint from business_templates
ALTER TABLE business_templates ALTER COLUMN team_id DROP NOT NULL;

-- 5. Add userId field to receipt_preferences table
ALTER TABLE receipt_preferences ADD COLUMN user_id UUID REFERENCES users(id);

-- 6. Remove teamId constraint from receipt_preferences
ALTER TABLE receipt_preferences ALTER COLUMN team_id DROP NOT NULL;

-- 7. Add userId field to monthly_usage table
ALTER TABLE monthly_usage ADD COLUMN user_id UUID REFERENCES users(id);

-- 8. Remove teamId constraint from monthly_usage
ALTER TABLE monthly_usage ALTER COLUMN team_id DROP NOT NULL;

-- 9. Update existing records to have a default user_id (if any exist)
-- This is a safety measure - in practice, these tables should be empty during migration
UPDATE receipts SET user_id = (SELECT id FROM users LIMIT 1) WHERE user_id IS NULL;
UPDATE business_templates SET user_id = (SELECT id FROM users LIMIT 1) WHERE user_id IS NULL;
UPDATE receipt_preferences SET user_id = (SELECT id FROM users LIMIT 1) WHERE user_id IS NULL;
UPDATE monthly_usage SET user_id = (SELECT id FROM users LIMIT 1) WHERE user_id IS NULL;

-- 10. Make user_id NOT NULL after populating
ALTER TABLE receipts ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE business_templates ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE receipt_preferences ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE monthly_usage ALTER COLUMN user_id SET NOT NULL;

-- 11. Drop the old team_id columns (optional - you can keep them if you want to maintain backward compatibility)
-- ALTER TABLE receipts DROP COLUMN team_id;
-- ALTER TABLE business_templates DROP COLUMN team_id;
-- ALTER TABLE receipt_preferences DROP COLUMN team_id;
-- ALTER TABLE monthly_usage DROP COLUMN team_id;

-- 12. Update unique constraints
-- Remove old team-based unique constraints
ALTER TABLE monthly_usage DROP CONSTRAINT IF EXISTS uniqueTeamMonth;

-- Add new user-based unique constraints
ALTER TABLE monthly_usage ADD CONSTRAINT uniqueUserMonth UNIQUE(user_id, year, month);

-- 13. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_business_templates_user_id ON business_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_receipt_preferences_user_id ON receipt_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_usage_user_id ON monthly_usage(user_id);

-- 14. Update RLS policies to use user_id instead of team_id
-- Drop old policies
DROP POLICY IF EXISTS "users can view own receipts" ON receipts;
DROP POLICY IF EXISTS "users can insert own receipts" ON receipts;
DROP POLICY IF EXISTS "users can update own receipts" ON receipts;
DROP POLICY IF EXISTS "users can delete own receipts" ON receipts;

-- Create new policies
CREATE POLICY "users can view own receipts" ON receipts
    FOR SELECT USING (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = receipts.user_id));

CREATE POLICY "users can insert own receipts" ON receipts
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = receipts.user_id));

CREATE POLICY "users can update own receipts" ON receipts
    FOR UPDATE USING (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = receipts.user_id));

CREATE POLICY "users can delete own receipts" ON receipts
    FOR DELETE USING (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = receipts.user_id));

-- Similar policies for other tables
-- Business templates
CREATE POLICY "users can view own business templates" ON business_templates
    FOR SELECT USING (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = business_templates.user_id));

CREATE POLICY "users can insert own business templates" ON business_templates
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = business_templates.user_id));

CREATE POLICY "users can update own business templates" ON business_templates
    FOR UPDATE USING (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = business_templates.user_id));

CREATE POLICY "users can delete own business templates" ON business_templates
    FOR DELETE USING (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = business_templates.user_id));

-- Receipt preferences
CREATE POLICY "users can view own receipt preferences" ON receipt_preferences
    FOR SELECT USING (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = receipt_preferences.user_id));

CREATE POLICY "users can insert own receipt preferences" ON receipt_preferences
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = receipt_preferences.user_id));

CREATE POLICY "users can update own receipt preferences" ON receipt_preferences
    FOR UPDATE USING (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = receipt_preferences.user_id));

CREATE POLICY "users can delete own receipt preferences" ON receipt_preferences
    FOR DELETE USING (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = receipt_preferences.user_id));

-- Monthly usage
CREATE POLICY "users can view own monthly usage" ON monthly_usage
    FOR SELECT USING (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = monthly_usage.user_id));

CREATE POLICY "users can insert own monthly usage" ON monthly_usage
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = monthly_usage.user_id));

CREATE POLICY "users can update own monthly usage" ON monthly_usage
    FOR UPDATE USING (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = monthly_usage.user_id));

CREATE POLICY "users can delete own monthly usage" ON monthly_usage
    FOR DELETE USING (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = monthly_usage.user_id));
