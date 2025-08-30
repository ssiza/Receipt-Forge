-- Manual fix for users without auth_user_id
-- This script will help identify and fix the issue

-- First, let's see what users we have
SELECT 
  id,
  email,
  auth_user_id,
  uuid_id,
  created_at
FROM users 
ORDER BY created_at DESC;

-- Check if there are any users with auth_user_id
SELECT 
  COUNT(*) as total_users,
  COUNT(auth_user_id) as users_with_auth_id,
  COUNT(*) - COUNT(auth_user_id) as users_without_auth_id
FROM users;

-- For now, let's create a temporary fix by setting auth_user_id to a placeholder
-- This will allow the sign-in to work while we fix the underlying issue
UPDATE users 
SET auth_user_id = uuid_id::text::uuid
WHERE auth_user_id IS NULL;

-- Verify the fix
SELECT 
  id,
  email,
  auth_user_id,
  uuid_id,
  created_at
FROM users 
ORDER BY created_at DESC;
