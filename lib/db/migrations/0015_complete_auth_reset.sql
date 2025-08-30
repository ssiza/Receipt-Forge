-- Complete Authentication Reset
-- This migration completely resets the authentication system

-- Step 1: Drop all foreign key constraints that reference users
ALTER TABLE team_members DROP CONSTRAINT IF EXISTS fk_team_members_user_id;
ALTER TABLE activity_logs DROP CONSTRAINT IF EXISTS fk_activity_logs_user_id;
ALTER TABLE invitations DROP CONSTRAINT IF EXISTS fk_invitations_invited_by_id;

-- Step 2: Drop all old user-related columns from related tables
ALTER TABLE team_members DROP COLUMN IF EXISTS user_id;
ALTER TABLE team_members DROP COLUMN IF EXISTS user_uuid_id;
ALTER TABLE activity_logs DROP COLUMN IF EXISTS user_id;
ALTER TABLE activity_logs DROP COLUMN IF EXISTS user_uuid_id;
ALTER TABLE invitations DROP COLUMN IF EXISTS invited_by_id;
ALTER TABLE invitations DROP COLUMN IF EXISTS invited_by_uuid_id;

-- Step 3: Completely drop and recreate the users table
DROP TABLE IF EXISTS users CASCADE;

-- Step 4: Create a completely clean users table
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

-- Step 5: Create indexes for performance
CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX idx_users_email ON users(email);

-- Step 6: Add new UUID columns to related tables
ALTER TABLE team_members ADD COLUMN user_id UUID;
ALTER TABLE activity_logs ADD COLUMN user_id UUID;
ALTER TABLE invitations ADD COLUMN invited_by_id UUID;

-- Step 7: Add foreign key constraints
ALTER TABLE team_members ADD CONSTRAINT fk_team_members_user_id 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE activity_logs ADD CONSTRAINT fk_activity_logs_user_id
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE invitations ADD CONSTRAINT fk_invitations_invited_by_id
  FOREIGN KEY (invited_by_id) REFERENCES users(id) ON DELETE CASCADE;

-- Step 8: Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 9: Create RLS policies
DROP POLICY IF EXISTS "users_self_access" ON users;
CREATE POLICY "users_self_access" ON users
  FOR ALL USING (auth_user_id = auth.uid());

-- Step 10: Update other table RLS policies
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

-- Step 11: Verify the clean structure
SELECT 
  'users' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Step 12: Show that the table is empty
SELECT 'users table row count:' as info, COUNT(*) as count FROM users;
