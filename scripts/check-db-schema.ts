import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.POSTGRES_URL || 'postgresql://postgres:ZECH255rswc@db.ydzmompbruifgknvhekb.supabase.co:5432/postgres';
const client = postgres(connectionString);
const db = drizzle(client);

async function checkDatabaseSchema() {
  try {
    console.log('Checking database schema...\n');

    // Check if users table has the new columns
    const usersColumns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);

    console.log('Users table columns:');
    if (usersColumns && Array.isArray(usersColumns)) {
      usersColumns.forEach((row: any) => {
        console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
      });
    } else {
      console.log('  No columns found or error in query');
    }

    console.log('\nChecking if uuid_id column exists...');
    const hasUuidId = usersColumns && Array.isArray(usersColumns) ? usersColumns.some((row: any) => row.column_name === 'uuid_id') : false;
    console.log(`uuid_id column exists: ${hasUuidId}`);

    console.log('\nChecking if auth_user_id column exists...');
    const hasAuthUserId = usersColumns && Array.isArray(usersColumns) ? usersColumns.some((row: any) => row.column_name === 'auth_user_id') : false;
    console.log(`auth_user_id column exists: ${hasAuthUserId}`);

    // Check if team_members table has the new columns
    const teamMembersColumns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'team_members' 
      ORDER BY ordinal_position;
    `);

    console.log('\nTeam members table columns:');
    if (teamMembersColumns && Array.isArray(teamMembersColumns)) {
      teamMembersColumns.forEach((row: any) => {
        console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
      });
    } else {
      console.log('  No columns found or error in query');
    }

    console.log('\nChecking if user_uuid_id column exists...');
    const hasUserUuidId = teamMembersColumns && Array.isArray(teamMembersColumns) ? teamMembersColumns.some((row: any) => row.column_name === 'user_uuid_id') : false;
    console.log(`user_uuid_id column exists: ${hasUserUuidId}`);

    // Check RLS policies
    console.log('\nChecking RLS policies...');
    const rlsPolicies = await db.execute(sql`
      SELECT schemaname, tablename, policyname 
      FROM pg_policies 
      WHERE schemaname = 'public';
    `);

    console.log('RLS policies:');
    if (rlsPolicies && Array.isArray(rlsPolicies)) {
      rlsPolicies.forEach((row: any) => {
        console.log(`  - ${row.tablename}.${row.policyname}`);
      });
    } else {
      console.log('  No RLS policies found');
    }

    // Check if RLS is enabled on users table
    const rlsEnabled = await db.execute(sql`
      SELECT relname, relrowsecurity 
      FROM pg_class 
      WHERE relname = 'users';
    `);

    console.log('\nRLS enabled on users table:', rlsEnabled && Array.isArray(rlsEnabled) ? rlsEnabled[0]?.relrowsecurity : 'Unknown');

  } catch (error) {
    console.error('Error checking database schema:', error);
  } finally {
    process.exit(0);
  }
}

checkDatabaseSchema();
