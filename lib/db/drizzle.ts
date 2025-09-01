import { drizzle } from 'drizzle-orm/postgres-js';
import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';
import * as schema from './schema';
import { log } from '../logger';

// Check for required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  const missingVars = [
    !process.env.NEXT_PUBLIC_SUPABASE_URL && 'NEXT_PUBLIC_SUPABASE_URL',
    !process.env.SUPABASE_SERVICE_ROLE_KEY && 'SUPABASE_SERVICE_ROLE_KEY'
  ].filter(Boolean);
  
  log.error('Missing required Supabase environment variables:', { missingVars });
  throw new Error(`Missing required Supabase environment variables: ${missingVars.join(', ')}`);
}

// Initialize Supabase client with service role key for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Create a drizzle instance for direct database access
// This is used for complex queries that can't be done through Supabase client
let db: ReturnType<typeof drizzle> | null = null;

try {
  // Use Supabase's connection string for direct database access
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  
  if (connectionString) {
    const client = postgres(connectionString, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
      onnotice: () => {},
    });
    db = drizzle(client, { schema, logger: true });
    log.info('Connected to database via drizzle');
  } else {
    log.warn('No database connection string available, drizzle will be null');
  }
} catch (error) {
  log.warn('Failed to initialize drizzle database connection', { error });
  db = null;
}

export { db, supabase };
