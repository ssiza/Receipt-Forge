-- Migration: Complete removal of all team dependencies
-- This migration removes all team-related fields, constraints, and references

-- 1. Drop foreign key constraints for team_id columns
ALTER TABLE receipts DROP CONSTRAINT IF EXISTS receipts_team_id_teams_id_fk;
ALTER TABLE business_templates DROP CONSTRAINT IF EXISTS business_templates_team_id_teams_id_fk;
ALTER TABLE receipt_preferences DROP CONSTRAINT IF EXISTS receipt_preferences_team_id_teams_id_fk;

-- 2. Drop team_id columns completely
ALTER TABLE receipts DROP COLUMN IF EXISTS team_id;
ALTER TABLE business_templates DROP COLUMN IF EXISTS team_id;
ALTER TABLE receipt_preferences DROP COLUMN IF EXISTS team_id;

-- 3. Check if monthly_usage table exists and has team_id
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'monthly_usage' AND column_name = 'team_id') THEN
        ALTER TABLE monthly_usage DROP CONSTRAINT IF EXISTS monthly_usage_team_id_teams_id_fk;
        ALTER TABLE monthly_usage DROP COLUMN IF EXISTS team_id;
    END IF;
END $$;

-- 4. Check if activity_logs table exists and has team_id
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activity_logs' AND column_name = 'team_id') THEN
        ALTER TABLE activity_logs DROP CONSTRAINT IF EXISTS activity_logs_team_id_teams_id_fk;
        ALTER TABLE activity_logs DROP COLUMN IF EXISTS team_id;
    END IF;
END $$;

-- 5. Check if invitations table exists and has team_id
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invitations' AND column_name = 'team_id') THEN
        ALTER TABLE invitations DROP CONSTRAINT IF EXISTS invitations_team_id_teams_id_fk;
        ALTER TABLE invitations DROP COLUMN IF EXISTS team_id;
    END IF;
END $$;

-- 6. Ensure user_id columns are NOT NULL and have proper constraints
ALTER TABLE receipts ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE business_templates ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE receipt_preferences ALTER COLUMN user_id SET NOT NULL;

-- 7. Drop any remaining team-related tables if they exist
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS teams CASCADE;

-- 8. Update RLS policies to ensure they only use user_id
-- Drop existing policies first
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

-- 9. Create new simplified RLS policies that only use user_id
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

-- 10. Ensure RLS is enabled on all tables
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_preferences ENABLE ROW LEVEL SECURITY;

-- 11. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON receipts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON business_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON receipt_preferences TO authenticated;

-- 12. Create indexes for better performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_business_templates_user_id ON business_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_receipt_preferences_user_id ON receipt_preferences(user_id);

-- 13. Add any missing columns that might be needed for receipts
DO $$ 
BEGIN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'business_name') THEN
        ALTER TABLE receipts ADD COLUMN business_name text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'business_address') THEN
        ALTER TABLE receipts ADD COLUMN business_address text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'business_phone') THEN
        ALTER TABLE receipts ADD COLUMN business_phone text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'business_email') THEN
        ALTER TABLE receipts ADD COLUMN business_email text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'due_date') THEN
        ALTER TABLE receipts ADD COLUMN due_date date;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'payment_terms') THEN
        ALTER TABLE receipts ADD COLUMN payment_terms text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'reference') THEN
        ALTER TABLE receipts ADD COLUMN reference text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'item_additional_fields') THEN
        ALTER TABLE receipts ADD COLUMN item_additional_fields jsonb DEFAULT '[]';
    END IF;
END $$;
