CREATE TABLE "receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" integer NOT NULL,
	"receipt_number" text NOT NULL,
	"issue_date" date NOT NULL,
	"customer_name" text NOT NULL,
	"customer_email" text,
	"items" jsonb DEFAULT '[]' NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"tax_amount" numeric(10, 2) DEFAULT '0.00',
	"total_amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"status" text DEFAULT 'paid' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "receipts_receipt_number_unique" UNIQUE("receipt_number")
);
--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;