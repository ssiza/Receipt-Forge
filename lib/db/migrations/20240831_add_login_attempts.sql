-- Create login_attempts table to track login attempts
-- Using public schema for compatibility

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Create the login_attempts table in public schema
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  ip TEXT NOT NULL,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_attempted_at 
  ON public.login_attempts (email, attempted_at);

CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_attempted_at 
  ON public.login_attempts (ip, attempted_at);

-- Enable RLS
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Create or replace the update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE OR REPLACE TRIGGER update_login_attempts_updated_at
BEFORE UPDATE ON public.login_attempts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Set up permissions
ALTER TABLE public.login_attempts OWNER TO postgres;
GRANT ALL ON TABLE public.login_attempts TO postgres;
GRANT ALL ON TABLE public.login_attempts TO authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE public.login_attempts_id_seq TO authenticated, service_role;

-- Add RLS policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'login_attempts'
  ) THEN
    -- Allow authenticated users to insert their own login attempts
    CREATE POLICY "Enable insert for authenticated users" 
    ON public.login_attempts
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

    -- Allow service role full access
    CREATE POLICY "Enable all for service role"
    ON public.login_attempts
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;
