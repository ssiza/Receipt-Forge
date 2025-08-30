-- Fixed Supabase Auth migration that properly handles foreign key constraints

-- Add auth_user_id column to link with Supabase Auth
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_user_id UUID;

-- Create index on auth_user_id for better performance
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);

-- Add unique constraint on auth_user_id
ALTER TABLE users ADD CONSTRAINT unique_auth_user_id UNIQUE (auth_user_id);

-- Add a new UUID primary key column
ALTER TABLE users ADD COLUMN IF NOT EXISTS uuid_id UUID DEFAULT gen_random_uuid();

-- Drop foreign key constraints first
ALTER TABLE activity_logs DROP CONSTRAINT IF EXISTS activity_logs_user_id_users_id_fk;
ALTER TABLE invitations DROP CONSTRAINT IF EXISTS invitations_invited_by_users_id_fk;
ALTER TABLE team_members DROP CONSTRAINT IF EXISTS team_members_user_id_users_id_fk;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- Drop the old primary key
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_pkey;

-- Make uuid_id the primary key
ALTER TABLE users ADD PRIMARY KEY (uuid_id);

-- Add new UUID columns to related tables
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS user_uuid_id UUID;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS invited_by_uuid_id UUID;
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS user_uuid_id UUID;

-- Update existing records to link with UUIDs
UPDATE team_members SET user_uuid_id = users.uuid_id 
FROM users WHERE team_members.user_id = users.id;

UPDATE invitations SET invited_by_uuid_id = users.uuid_id 
FROM users WHERE invitations.invited_by = users.id;

UPDATE activity_logs SET user_uuid_id = users.uuid_id 
FROM users WHERE activity_logs.user_id = users.id;

-- Add new foreign key constraints
ALTER TABLE team_members ADD CONSTRAINT fk_team_members_user_uuid 
  FOREIGN KEY (user_uuid_id) REFERENCES users(uuid_id) ON DELETE CASCADE;

ALTER TABLE invitations ADD CONSTRAINT fk_invitations_invited_by_uuid
  FOREIGN KEY (invited_by_uuid_id) REFERENCES users(uuid_id) ON DELETE CASCADE;

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
DROP POLICY IF EXISTS "users_self_access" ON users;
CREATE POLICY "users_self_access" ON users
  FOR ALL USING (auth_user_id = auth.uid());

-- Create RLS policies for teams table
DROP POLICY IF EXISTS "teams_member_access" ON teams;
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
DROP POLICY IF EXISTS "team_members_self_access" ON team_members;
CREATE POLICY "team_members_self_access" ON team_members
  FOR ALL USING (
    user_uuid_id IN (
      SELECT uuid_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- Create RLS policies for receipts table
DROP POLICY IF EXISTS "receipts_team_access" ON receipts;
CREATE POLICY "receipts_team_access" ON receipts
  FOR ALL USING (
    team_id IN (
      SELECT tm.team_id FROM team_members tm
      JOIN users u ON tm.user_uuid_id = u.uuid_id
      WHERE u.auth_user_id = auth.uid()
    )
  );

-- Create RLS policies for business_templates table
DROP POLICY IF EXISTS "business_templates_team_access" ON business_templates;
CREATE POLICY "business_templates_team_access" ON business_templates
  FOR ALL USING (
    team_id IN (
      SELECT tm.team_id FROM team_members tm
      JOIN users u ON tm.user_uuid_id = u.uuid_id
      WHERE u.auth_user_id = auth.uid()
    )
  );

-- Create RLS policies for receipt_preferences table
DROP POLICY IF EXISTS "receipt_preferences_team_access" ON receipt_preferences;
CREATE POLICY "receipt_preferences_team_access" ON receipt_preferences
  FOR ALL USING (
    team_id IN (
      SELECT tm.team_id FROM team_members tm
      JOIN users u ON tm.user_uuid_id = u.uuid_id
      WHERE u.auth_user_id = auth.uid()
    )
  );

-- Create RLS policies for monthly_usage table
DROP POLICY IF EXISTS "monthly_usage_team_access" ON monthly_usage;
CREATE POLICY "monthly_usage_team_access" ON monthly_usage
  FOR ALL USING (
    team_id IN (
      SELECT tm.team_id FROM team_members tm
      JOIN users u ON tm.user_uuid_id = u.uuid_id
      WHERE u.auth_user_id = auth.uid()
    )
  );

-- Create RLS policies for activity_logs table
DROP POLICY IF EXISTS "activity_logs_team_access" ON activity_logs;
CREATE POLICY "activity_logs_team_access" ON activity_logs
  FOR ALL USING (
    team_id IN (
      SELECT tm.team_id FROM team_members tm
      JOIN users u ON tm.user_uuid_id = u.uuid_id
      WHERE u.auth_user_id = auth.uid()
    )
  );

-- Create RLS policies for invitations table
DROP POLICY IF EXISTS "invitations_team_access" ON invitations;
CREATE POLICY "invitations_team_access" ON invitations
  FOR ALL USING (
    team_id IN (
      SELECT tm.team_id FROM team_members tm
      JOIN users u ON tm.user_uuid_id = u.uuid_id
      WHERE u.auth_user_id = auth.uid()
    )
  );
