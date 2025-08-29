import { wrapFetch } from '@/lib/wrapFetch';
import { db } from '@/lib/db/drizzle';
import { sql } from 'drizzle-orm';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    wrapFetch();
    
    // Test DB connectivity on startup
    try {
      await db.execute(sql`SELECT 1`);
      console.log('✅ Database connectivity test passed');
    } catch (error) {
      console.error('❌ Database connectivity test failed:', error);
    }
  }
} 