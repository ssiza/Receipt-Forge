-- Add itemAdditionalFields column to receipts table
ALTER TABLE receipts ADD COLUMN item_additional_fields JSONB DEFAULT '[]';