-- Enable RLS on receipts table
ALTER TABLE "receipts" ENABLE ROW LEVEL SECURITY;

-- Create policy for SELECT operations
CREATE POLICY "receipts_select_policy" ON "receipts"
FOR SELECT USING (
  "team_id" IN (
    SELECT "team_id" FROM "team_members" 
    WHERE "user_id" = auth.uid()
  )
);

-- Create policy for INSERT operations
CREATE POLICY "receipts_insert_policy" ON "receipts"
FOR INSERT WITH CHECK (
  "team_id" IN (
    SELECT "team_id" FROM "team_members" 
    WHERE "user_id" = auth.uid()
  )
);

-- Create policy for UPDATE operations
CREATE POLICY "receipts_update_policy" ON "receipts"
FOR UPDATE USING (
  "team_id" IN (
    SELECT "team_id" FROM "team_members" 
    WHERE "user_id" = auth.uid()
  )
);

-- Create policy for DELETE operations
CREATE POLICY "receipts_delete_policy" ON "receipts"
FOR DELETE USING (
  "team_id" IN (
    SELECT "team_id" FROM "team_members" 
    WHERE "user_id" = auth.uid()
  )
);

-- Enable RLS on business_templates table
ALTER TABLE "business_templates" ENABLE ROW LEVEL SECURITY;

-- Create policy for SELECT operations on business_templates
CREATE POLICY "business_templates_select_policy" ON "business_templates"
FOR SELECT USING (
  "team_id" IN (
    SELECT "team_id" FROM "team_members" 
    WHERE "user_id" = auth.uid()
  )
);

-- Create policy for INSERT operations on business_templates
CREATE POLICY "business_templates_insert_policy" ON "business_templates"
FOR INSERT WITH CHECK (
  "team_id" IN (
    SELECT "team_id" FROM "team_members" 
    WHERE "user_id" = auth.uid()
  )
);

-- Create policy for UPDATE operations on business_templates
CREATE POLICY "business_templates_update_policy" ON "business_templates"
FOR UPDATE USING (
  "team_id" IN (
    SELECT "team_id" FROM "team_members" 
    WHERE "user_id" = auth.uid()
  )
);

-- Create policy for DELETE operations on business_templates
CREATE POLICY "business_templates_delete_policy" ON "business_templates"
FOR DELETE USING (
  "team_id" IN (
    SELECT "team_id" FROM "team_members" 
    WHERE "user_id" = auth.uid()
  )
); 