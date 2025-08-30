-- Migration to remove password-related columns since Supabase Auth handles passwords

-- Drop the password_hash column from users table
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;

-- Verify the change
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
