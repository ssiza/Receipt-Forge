-- Migration: Remove all team dependencies completely
-- This migration removes all team-based architecture and makes tables work with user profiles only

-- 1. Add user_id to receipts table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'user_id') THEN
        ALTER TABLE receipts ADD COLUMN user_id UUID REFERENCES users(id);
    END IF;
END $$;

-- 2. Make team_id nullable in receipts (it should already be nullable)
ALTER TABLE receipts ALTER COLUMN team_id DROP NOT NULL;

-- 3. Update existing receipts to have a default user_id if any exist
-- This is a safety measure - in practice, these tables should be empty during migration
UPDATE receipts SET user_id = (SELECT id FROM users LIMIT 1) WHERE user_id IS NULL;

-- 4. Make user_id NOT NULL after populating
ALTER TABLE receipts ALTER COLUMN user_id SET NOT NULL;

-- 5. Make team_id nullable in business_templates (it should already be nullable)
ALTER TABLE business_templates ALTER COLUMN team_id DROP NOT NULL;

-- 6. Make team_id nullable in receipt_preferences (it should already be nullable)
ALTER TABLE receipt_preferences ALTER COLUMN team_id DROP NOT NULL;

-- 7. Make team_id nullable in monthly_usage if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'monthly_usage' AND column_name = 'team_id') THEN
        ALTER TABLE monthly_usage ALTER COLUMN team_id DROP NOT NULL;
    END IF;
END $$;

-- 8. Add user_id to monthly_usage if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'monthly_usage' AND column_name = 'user_id') THEN
        ALTER TABLE monthly_usage ADD COLUMN user_id UUID REFERENCES users(id);
    END IF;
END $$;

-- 9. Update existing monthly_usage records to have a default user_id if any exist
UPDATE monthly_usage SET user_id = (SELECT id FROM users LIMIT 1) WHERE user_id IS NULL;

-- 10. Make user_id NOT NULL in monthly_usage after populating
ALTER TABLE monthly_usage ALTER COLUMN user_id SET NOT NULL;

-- 11. Drop old team-based unique constraints if they exist
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'uniqueTeamMonth' AND table_name = 'monthly_usage') THEN
        ALTER TABLE monthly_usage DROP CONSTRAINT uniqueTeamMonth;
    END IF;
END $$;

-- 12. Add new user-based unique constraints
ALTER TABLE monthly_usage ADD CONSTRAINT uniqueUserMonth UNIQUE(user_id, year, month);

-- 13. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_business_templates_user_id ON business_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_receipt_preferences_user_id ON receipt_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_usage_user_id ON monthly_usage(user_id);

-- 14. Drop old RLS policies that reference team_members
DROP POLICY IF EXISTS "users can view own receipts" ON receipts;
DROP POLICY IF EXISTS "users can insert own receipts" ON receipts;
DROP POLICY IF EXISTS "users can update own receipts" ON receipts;
DROP POLICY IF EXISTS "users can delete own receipts" ON receipts;

DROP POLICY IF EXISTS "users can view own business templates" ON business_templates;
DROP POLICY IF EXISTS "users can insert own business templates" ON business_templates;
DROP POLICY IF EXISTS "users can update own business templates" ON business_templates;
DROP POLICY IF EXISTS "users can delete own business templates" ON business_templates;

DROP POLICY IF EXISTS "users can view own receipt preferences" ON receipt_preferences;
DROP POLICY IF EXISTS "users can insert own receipt preferences" ON receipt_preferences;
DROP POLICY IF EXISTS "users can update own receipt preferences" ON receipt_preferences;
DROP POLICY IF EXISTS "users can delete own receipt preferences" ON receipt_preferences;

DROP POLICY IF EXISTS "users can view own monthly usage" ON monthly_usage;
DROP POLICY IF EXISTS "users can insert own monthly usage" ON monthly_usage;
DROP POLICY IF EXISTS "users can update own monthly usage" ON monthly_usage;
DROP POLICY IF EXISTS "users can delete own monthly usage" ON monthly_usage;

-- 15. Create new RLS policies that use user_id directly
-- Receipts
CREATE POLICY "users can view own receipts" ON receipts
    FOR SELECT USING (auth.uid()::text = (SELECT auth_user_id::text FROM users WHERE id = receipts.user_id));

CREATE POLICY "users can insert own receipts" ON receipts
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id::text FROM users WHERE id = receipts.user_id));

CREATE POLICY "users can update own receipts" ON receipts
    FOR UPDATE USING (auth.uid()::text = (SELECT auth_user_id::text FROM users WHERE id = receipts.user_id));

CREATE POLICY "users can delete own receipts" ON receipts
    FOR DELETE USING (auth.uid()::text = (SELECT auth_user_id::text FROM users WHERE id = receipts.user_id));

-- Business templates
CREATE POLICY "users can view own business templates" ON business_templates
    FOR SELECT USING (auth.uid()::text = (SELECT auth_user_id::text FROM users WHERE id = business_templates.user_id));

CREATE POLICY "users can insert own business templates" ON business_templates
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id::text FROM users WHERE id = business_templates.user_id));

CREATE POLICY "users can update own business templates" ON business_templates
    FOR UPDATE USING (auth.uid()::text = (SELECT auth_user_id::text FROM users WHERE id = business_templates.user_id));

CREATE POLICY "users can delete own business templates" ON business_templates
    FOR DELETE USING (auth.uid()::text = (SELECT auth_user_id::text FROM users WHERE id = business_templates.user_id));

-- Receipt preferences
CREATE POLICY "users can view own receipt preferences" ON receipt_preferences
    FOR SELECT USING (auth.uid()::text = (SELECT auth_user_id::text FROM users WHERE id = receipt_preferences.user_id));

CREATE POLICY "users can insert own receipt preferences" ON receipt_preferences
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id::text FROM users WHERE id = receipt_preferences.user_id));

CREATE POLICY "users can update own receipt preferences" ON receipt_preferences
    FOR UPDATE USING (auth.uid()::text = (SELECT auth_user_id::text FROM users WHERE id = receipt_preferences.user_id));

CREATE POLICY "users can delete own receipt preferences" ON receipt_preferences
    FOR DELETE USING (auth.uid()::text = (SELECT auth_user_id::text FROM users WHERE id = receipt_preferences.user_id));

-- Monthly usage
CREATE POLICY "users can view own monthly usage" ON monthly_usage
    FOR SELECT USING (auth.uid()::text = (SELECT auth_user_id::text FROM users WHERE id = monthly_usage.user_id));

CREATE POLICY "users can insert own monthly usage" ON monthly_usage
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id::text FROM users WHERE id = monthly_usage.user_id));

CREATE POLICY "users can update own monthly usage" ON monthly_usage
    FOR UPDATE USING (auth.uid()::text = (SELECT auth_user_id::text FROM users WHERE id = monthly_usage.user_id));

CREATE POLICY "users can delete own monthly usage" ON monthly_usage
    FOR DELETE USING (auth.uid()::text = (SELECT auth_user_id::text FROM users WHERE id = monthly_usage.user_id));

-- 16. Enable RLS on all tables
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_usage ENABLE ROW LEVEL SECURITY;

-- 17. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON receipts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON business_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON receipt_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON monthly_usage TO authenticated;
