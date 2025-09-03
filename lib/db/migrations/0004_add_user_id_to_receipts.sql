-- Add user_id column to receipts table
ALTER TABLE receipts 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Set a default user for existing receipts
UPDATE receipts 
SET user_id = (SELECT id FROM users LIMIT 1)
WHERE user_id IS NULL;

-- Create an index on user_id for better query performance
CREATE INDEX IF NOT EXISTS receipts_user_id_idx ON receipts(user_id);
