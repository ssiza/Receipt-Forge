-- Enable Row Level Security on all relevant tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Ensure auth_user_id is properly set up
ALTER TABLE users 
  ALTER COLUMN auth_user_id SET NOT NULL,
  ADD CONSTRAINT users_auth_user_id_key UNIQUE (auth_user_id);

-- Create or replace function to get the current user's legacy ID
CREATE OR REPLACE FUNCTION public.get_legacy_user_id()
RETURNS UUID AS $$
DECLARE
  legacy_id UUID;
  user_email TEXT;
  user_name TEXT;
BEGIN
  -- First try to find existing user
  SELECT id, name INTO legacy_id, user_name 
  FROM users 
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
  
  -- If user doesn't exist, create them
  IF legacy_id IS NULL THEN
    -- Get user info from auth.users
    SELECT email, raw_user_meta_data->>'name' INTO user_email, user_name
    FROM auth.users
    WHERE id = auth.uid();
    
    -- Insert new user with the same ID as auth user
    INSERT INTO users (
      id, 
      auth_user_id, 
      email, 
      name, 
      role, 
      created_at, 
      updated_at
    ) VALUES (
      gen_random_uuid(), -- Generate a new UUID for the legacy user
      auth.uid(),        -- Use the auth user ID as the auth_user_id
      COALESCE(user_email, auth.uid() || '@user.invalid'),
      COALESCE(user_name, 'User ' || substr(auth.uid()::text, 1, 8)),
      'member',          -- Default role
      NOW(),
      NOW()
    )
    RETURNING id INTO legacy_id;
  END IF;
  
  RETURN legacy_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users can only access their own profile
CREATE OR REPLACE POLICY "Users can view their own profile" 
  ON users FOR SELECT 
  USING (auth_user_id = auth.uid() OR auth.uid() = auth_user_id);

-- Users can update their own profile
CREATE OR REPLACE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth_user_id = auth.uid());

-- Team members can view receipts for teams they belong to
CREATE OR REPLACE POLICY "Team members can view team receipts"
  ON receipts FOR SELECT
  USING (team_id IN (
    SELECT team_id FROM team_members 
    WHERE user_id = get_legacy_user_id()
  ));

-- Team admins can manage receipts for their teams
CREATE OR REPLACE POLICY "Team admins can manage team receipts"
  ON receipts FOR ALL
  USING (EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = receipts.team_id
    AND user_id = get_legacy_user_id()
    AND role = 'admin'
  ));

-- Team members can view their team memberships
CREATE OR REPLACE POLICY "Users can view their team memberships"
  ON team_members FOR SELECT
  USING (user_id = get_legacy_user_id() OR EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.team_id = team_members.team_id
    AND tm.user_id = get_legacy_user_id()
    AND tm.role = 'admin'
  ));

-- Team admins can manage team members
CREATE OR REPLACE POLICY "Team admins can manage team members"
  ON team_members FOR ALL
  USING (EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.team_id = team_members.team_id
    AND tm.user_id = get_legacy_user_id()
    AND tm.role = 'admin'
  ));

-- Users can view teams they are members of
CREATE OR REPLACE POLICY "Users can view their teams"
  ON teams FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = teams.id
    AND user_id = get_legacy_user_id()
  ));

-- Team admins can update their teams
CREATE OR REPLACE POLICY "Team admins can update their teams"
  ON teams FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = teams.id
    AND user_id = get_legacy_user_id()
    AND role = 'admin'
  ));

-- Helper function to get user's team IDs
CREATE OR REPLACE FUNCTION public.get_user_team_ids()
RETURNS SETOF UUID AS $$
BEGIN
  RETURN QUERY
  SELECT team_id
  FROM team_members
  WHERE user_id = get_legacy_user_id();
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Users can view their own receipts
CREATE OR REPLACE POLICY "Users can view their own receipts"
  ON receipts
  FOR SELECT
  USING (user_id = (SELECT get_legacy_user_id()));

-- Users can manage their own receipts
CREATE OR REPLACE POLICY "Users can manage their receipts"
  ON receipts
  FOR ALL
  USING (user_id = (SELECT get_legacy_user_id()));

-- Users can create receipts for their teams
CREATE OR REPLACE POLICY "Users can create receipts for their teams"
  ON receipts
  FOR INSERT
  WITH CHECK (
    team_id IN (SELECT get_user_team_ids())
  );

-- Users can update receipts for their teams if they are admins
CREATE OR REPLACE POLICY "Team admins can update team receipts"
  ON receipts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = receipts.team_id
      AND tm.user_id = get_legacy_user_id()
      AND tm.role = 'admin'
    )
  );

-- Users can delete their own receipts
CREATE OR REPLACE POLICY "Users can delete their receipts"
  ON receipts
  FOR DELETE
  USING (user_id = (SELECT get_legacy_user_id()));

-- Team admins can delete team receipts
CREATE OR REPLACE POLICY "Team admins can delete team receipts"
  ON receipts
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = receipts.team_id
      AND tm.user_id = get_legacy_user_id()
      AND tm.role = 'admin'
    )
  );

-- Users can create teams
CREATE OR REPLACE POLICY "Users can create teams"
  ON teams
  FOR INSERT
  WITH CHECK (true);

-- Team owners can delete their teams
CREATE OR REPLACE POLICY "Team owners can delete their teams"
  ON teams
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = teams.id
      AND tm.user_id = get_legacy_user_id()
      AND tm.role = 'admin'
    )
  );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Allow authenticated users to select from necessary tables
GRANT SELECT ON users, teams, team_members, receipts TO authenticated;

-- Allow users to insert into receipts and team_members
GRANT INSERT ON receipts, team_members TO authenticated;

-- Allow users to update their own data
GRANT UPDATE ON users, receipts TO authenticated;

-- Create a function to get the current user's team IDs
CREATE OR REPLACE FUNCTION public.get_user_team_ids()
RETURNS SETOF UUID AS $$
BEGIN
  RETURN QUERY
  SELECT team_id
  FROM team_members
  WHERE user_id = (SELECT get_legacy_user_id());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if user is team admin
CREATE OR REPLACE FUNCTION public.is_team_admin(team_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = team_id_param
    AND user_id = (SELECT get_legacy_user_id())
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get user's role in a team
CREATE OR REPLACE FUNCTION public.get_user_team_role(team_id_param UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM team_members
  WHERE team_id = team_id_param
  AND user_id = (SELECT get_legacy_user_id())
  LIMIT 1;
  
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if user can view a receipt
CREATE OR REPLACE FUNCTION public.can_view_receipt(receipt_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  receipt_team_id UUID;
  is_team_member BOOLEAN;
  is_receipt_owner BOOLEAN;
BEGIN
  -- Get the team ID for the receipt
  SELECT team_id INTO receipt_team_id
  FROM receipts
  WHERE id = receipt_id_param
  LIMIT 1;
  
  IF receipt_team_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user is a member of the team
  SELECT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = receipt_team_id
    AND user_id = (SELECT get_legacy_user_id())
  ) INTO is_team_member;
  
  -- Check if user is the receipt owner
  SELECT EXISTS (
    SELECT 1 FROM receipts
    WHERE id = receipt_id_param
    AND user_id = (SELECT get_legacy_user_id())
  ) INTO is_receipt_owner;
  
  RETURN is_team_member OR is_receipt_owner;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_receipts_team_id ON public.receipts(team_id);
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON public.receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);

-- Add foreign key constraints if they don't exist
ALTER TABLE public.receipts 
  ADD CONSTRAINT fk_receipts_teams 
  FOREIGN KEY (team_id) REFERENCES public.teams(id) 
  ON DELETE CASCADE;

ALTER TABLE public.receipts
  ADD CONSTRAINT fk_receipts_users
  FOREIGN KEY (user_id) REFERENCES public.users(id)
  ON DELETE SET NULL;

ALTER TABLE public.team_members
  ADD CONSTRAINT fk_team_members_teams
  FOREIGN KEY (team_id) REFERENCES public.teams(id)
  ON DELETE CASCADE;

ALTER TABLE public.team_members
  ADD CONSTRAINT fk_team_members_users
  FOREIGN KEY (user_id) REFERENCES public.users(id)
  ON DELETE CASCADE;

-- Add unique constraint for team membership
ALTER TABLE public.team_members
  ADD CONSTRAINT uq_team_members_team_user
  UNIQUE (team_id, user_id);

-- Notify that the migration is complete
COMMENT ON DATABASE postgres IS 'Migration 20240901_auth_integration completed successfully';

-- Log the completion of the migration
DO $$
BEGIN
  RAISE NOTICE 'Migration 20240901_auth_integration completed successfully';
END $$;
