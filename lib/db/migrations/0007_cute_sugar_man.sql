-- Add business phone and email columns to receipt_preferences table
ALTER TABLE receipt_preferences ADD COLUMN business_phone TEXT;
ALTER TABLE receipt_preferences ADD COLUMN business_email TEXT;