-- Fix foreign key constraints to use UUID columns

-- Drop existing foreign key constraints
ALTER TABLE team_members DROP CONSTRAINT IF EXISTS fk_team_members_user_id;
ALTER TABLE activity_logs DROP CONSTRAINT IF EXISTS fk_activity_logs_user_id;
ALTER TABLE invitations DROP CONSTRAINT IF EXISTS fk_invitations_invited_by_id;

-- Update team_members table to use UUID for user_id
ALTER TABLE team_members DROP COLUMN IF EXISTS user_id;
ALTER TABLE team_members ADD COLUMN user_id UUID;
ALTER TABLE team_members ADD CONSTRAINT fk_team_members_user_id 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Update activity_logs table to use UUID for user_id
ALTER TABLE activity_logs DROP COLUMN IF EXISTS user_id;
ALTER TABLE activity_logs ADD COLUMN user_id UUID;
ALTER TABLE activity_logs ADD CONSTRAINT fk_activity_logs_user_id
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Update invitations table to use UUID for invited_by_id
ALTER TABLE invitations DROP COLUMN IF EXISTS invited_by_id;
ALTER TABLE invitations ADD COLUMN invited_by_id UUID;
ALTER TABLE invitations ADD CONSTRAINT fk_invitations_invited_by_id
  FOREIGN KEY (invited_by_id) REFERENCES users(id) ON DELETE CASCADE;

-- Update RLS policies to use the correct column types
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

-- Verify the structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('team_members', 'activity_logs', 'invitations')
  AND column_name LIKE '%user%' OR column_name LIKE '%invited%'
ORDER BY table_name, ordinal_position;
