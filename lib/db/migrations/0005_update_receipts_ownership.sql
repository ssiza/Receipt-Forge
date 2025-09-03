-- Make team_id optional and ensure user_id is set
ALTER TABLE receipts 
  ALTER COLUMN team_id DROP NOT NULL,
  ALTER COLUMN user_id SET NOT NULL;

-- Update existing receipts to have a user_id if missing
-- This is a one-time migration for existing data
-- You'll need to replace 'YOUR_DEFAULT_USER_ID' with a valid user ID
-- or handle this through your application logic
-- UPDATE receipts SET user_id = 'YOUR_DEFAULT_USER_ID' WHERE user_id IS NULL;
