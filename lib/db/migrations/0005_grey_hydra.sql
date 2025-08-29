-- Add new fields to receipts table
ALTER TABLE receipts ADD COLUMN customer_phone TEXT;
ALTER TABLE receipts ADD COLUMN customer_address TEXT;
ALTER TABLE receipts ADD COLUMN business_name TEXT;
ALTER TABLE receipts ADD COLUMN business_address TEXT;
ALTER TABLE receipts ADD COLUMN business_phone TEXT;
ALTER TABLE receipts ADD COLUMN business_email TEXT;
ALTER TABLE receipts ADD COLUMN due_date DATE;
ALTER TABLE receipts ADD COLUMN payment_terms TEXT;
ALTER TABLE receipts ADD COLUMN reference TEXT;

-- Remove business template dependency
ALTER TABLE receipts DROP COLUMN IF EXISTS business_template_id;
ALTER TABLE receipts DROP COLUMN IF EXISTS custom_fields;