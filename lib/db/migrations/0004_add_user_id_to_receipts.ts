import { sql } from 'drizzle-orm';

// Simple migration using raw SQL
export const up = async (sql: any) => {
  // Add user_id column to receipts table
  await sql`
    ALTER TABLE receipts 
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
  `;

  // Set a default user for existing receipts
  await sql`
    UPDATE receipts 
    SET user_id = (SELECT id FROM users LIMIT 1)
    WHERE user_id IS NULL;
  `;
};

export const down = async (sql: any) => {
  await sql`
    ALTER TABLE receipts 
    DROP COLUMN IF EXISTS user_id;
  `;
};
