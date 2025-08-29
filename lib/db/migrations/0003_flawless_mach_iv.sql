CREATE TABLE "receipt_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"business_name" text,
	"footer_thank_you_text" text,
	"footer_contact_info" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "receipt_preferences" ADD CONSTRAINT "receipt_preferences_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;