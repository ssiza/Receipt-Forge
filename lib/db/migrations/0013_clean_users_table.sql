-- Clean migration: Wipe out old custom user system and rebuild around Supabase Auth

-- First, backup existing data (just in case)
CREATE TABLE IF NOT EXISTS users_backup AS SELECT * FROM users;

-- Drop all foreign key constraints that reference users
ALTER TABLE team_members DROP CONSTRAINT IF EXISTS fk_team_members_user_uuid;
ALTER TABLE activity_logs DROP CONSTRAINT IF EXISTS fk_activity_logs_user_uuid;
ALTER TABLE invitations DROP CONSTRAINT IF EXISTS fk_invitations_invited_by_uuid;

-- Drop the old users table completely
DROP TABLE IF EXISTS users CASCADE;

-- Create a clean users table with only Supabase Auth integration
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100),
  email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(20) NOT NULL DEFAULT 'member',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX idx_users_email ON users(email);

-- Recreate foreign key constraints using the new UUID primary key
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE team_members ADD CONSTRAINT fk_team_members_user_id 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE activity_logs ADD CONSTRAINT fk_activity_logs_user_id
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE invitations ADD COLUMN IF NOT EXISTS invited_by_id UUID;
ALTER TABLE invitations ADD CONSTRAINT fk_invitations_invited_by_id
  FOREIGN KEY (invited_by_id) REFERENCES users(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "users_self_access" ON users;
CREATE POLICY "users_self_access" ON users
  FOR ALL USING (auth_user_id = auth.uid());

-- Update other table RLS policies to use the new user_id column
DROP POLICY IF EXISTS "team_members_self_access" ON team_members;
CREATE POLICY "team_members_self_access" ON team_members
  FOR ALL USING (
    user_id IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "activity_logs_team_access" ON activity_logs;
CREATE POLICY "activity_logs_team_access" ON activity_logs
  FOR ALL USING (
    team_id IN (
      SELECT tm.team_id FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE u.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "invitations_team_access" ON invitations;
CREATE POLICY "invitations_team_access" ON invitations
  FOR ALL USING (
    team_id IN (
      SELECT tm.team_id FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE u.auth_user_id = auth.uid()
    )
  );

-- Verify the new structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
