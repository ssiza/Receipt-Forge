CREATE TABLE "business_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"line_item_fields" jsonb DEFAULT '[]' NOT NULL,
	"custom_fields" jsonb DEFAULT '[]' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "receipts" ADD COLUMN "custom_fields" jsonb DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "receipts" ADD COLUMN "business_template_id" uuid;--> statement-breakpoint
ALTER TABLE "business_templates" ADD CONSTRAINT "business_templates_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_business_template_id_business_templates_id_fk" FOREIGN KEY ("business_template_id") REFERENCES "public"."business_templates"("id") ON DELETE no action ON UPDATE no action;