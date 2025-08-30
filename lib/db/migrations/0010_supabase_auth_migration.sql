-- Migration to update users table for Supabase Auth
-- This migration adds auth_user_id column and removes password_hash

-- Add auth_user_id column to link with Supabase Auth
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_user_id UUID;

-- Create index on auth_user_id for better performance
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);

-- Add unique constraint on auth_user_id
ALTER TABLE users ADD CONSTRAINT unique_auth_user_id UNIQUE (auth_user_id);

-- Update foreign key constraints to use auth_user_id instead of id
-- Note: We'll need to handle this carefully to avoid breaking existing relationships

-- For now, let's keep the existing id column but make it nullable
-- This allows us to gradually migrate the relationships
ALTER TABLE users ALTER COLUMN id DROP NOT NULL;

-- Add a new UUID primary key column
ALTER TABLE users ADD COLUMN IF NOT EXISTS uuid_id UUID DEFAULT gen_random_uuid();

-- Make uuid_id the primary key
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE users ADD PRIMARY KEY (uuid_id);

-- Update all foreign key references to use the new UUID
-- This is a complex operation that needs to be done carefully

-- For team_members table
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS user_uuid_id UUID;
ALTER TABLE team_members ADD CONSTRAINT fk_team_members_user_uuid 
  FOREIGN KEY (user_uuid_id) REFERENCES users(uuid_id) ON DELETE CASCADE;

-- For invitations table  
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS invited_by_uuid_id UUID;
ALTER TABLE invitations ADD CONSTRAINT fk_invitations_invited_by_uuid
  FOREIGN KEY (invited_by_uuid_id) REFERENCES users(uuid_id) ON DELETE CASCADE;

-- For activity_logs table
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS user_uuid_id UUID;
ALTER TABLE activity_logs ADD CONSTRAINT fk_activity_logs_user_uuid
  FOREIGN KEY (user_uuid_id) REFERENCES users(uuid_id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "users_self_access" ON users
  FOR ALL USING (auth_user_id = auth.uid());

-- Create RLS policies for teams table
CREATE POLICY "teams_member_access" ON teams
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = teams.id 
      AND team_members.user_uuid_id IN (
        SELECT uuid_id FROM users WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Create RLS policies for team_members table
CREATE POLICY "team_members_self_access" ON team_members
  FOR ALL USING (
    user_uuid_id IN (
      SELECT uuid_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- Create RLS policies for receipts table
CREATE POLICY "receipts_team_access" ON receipts
  FOR ALL USING (
    team_id IN (
      SELECT tm.team_id FROM team_members tm
      JOIN users u ON tm.user_uuid_id = u.uuid_id
      WHERE u.auth_user_id = auth.uid()
    )
  );

-- Create RLS policies for business_templates table
CREATE POLICY "business_templates_team_access" ON business_templates
  FOR ALL USING (
    team_id IN (
      SELECT tm.team_id FROM team_members tm
      JOIN users u ON tm.user_uuid_id = u.uuid_id
      WHERE u.auth_user_id = auth.uid()
    )
  );

-- Create RLS policies for receipt_preferences table
CREATE POLICY "receipt_preferences_team_access" ON receipt_preferences
  FOR ALL USING (
    team_id IN (
      SELECT tm.team_id FROM team_members tm
      JOIN users u ON tm.user_uuid_id = u.uuid_id
      WHERE u.auth_user_id = auth.uid()
    )
  );

-- Create RLS policies for monthly_usage table
CREATE POLICY "monthly_usage_team_access" ON monthly_usage
  FOR ALL USING (
    team_id IN (
      SELECT tm.team_id FROM team_members tm
      JOIN users u ON tm.user_uuid_id = u.uuid_id
      WHERE u.auth_user_id = auth.uid()
    )
  );

-- Create RLS policies for activity_logs table
CREATE POLICY "activity_logs_team_access" ON activity_logs
  FOR ALL USING (
    team_id IN (
      SELECT tm.team_id FROM team_members tm
      JOIN users u ON tm.user_uuid_id = u.uuid_id
      WHERE u.auth_user_id = auth.uid()
    )
  );

-- Create RLS policies for invitations table
CREATE POLICY "invitations_team_access" ON invitations
  FOR ALL USING (
    team_id IN (
      SELECT tm.team_id FROM team_members tm
      JOIN users u ON tm.user_uuid_id = u.uuid_id
      WHERE u.auth_user_id = auth.uid()
    )
  );

-- Note: We'll remove the password_hash column in a separate migration
-- after all users have been migrated to Supabase Auth
