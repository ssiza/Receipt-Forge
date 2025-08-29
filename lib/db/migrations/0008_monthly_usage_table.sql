-- Create monthly usage tracking table
CREATE TABLE "monthly_usage" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"receipt_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "monthly_usage_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "unique_team_month" UNIQUE("team_id", "year", "month")
); 