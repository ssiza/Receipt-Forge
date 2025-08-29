ALTER TABLE "receipt_preferences" ADD COLUMN "business_address" text;--> statement-breakpoint
ALTER TABLE "receipt_preferences" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "receipt_preferences" ADD COLUMN "table_color" text DEFAULT '#3b82f6';