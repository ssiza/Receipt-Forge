import { and, eq, isNull } from 'drizzle-orm';
import { db } from './drizzle';
import { users } from './schema';
import { getCurrentUser } from '@/lib/supabaseClient';
import { log } from '../logger';

// Helper function to check if db is available
function checkDb() {
  if (!db) {
    throw new Error('Database connection not available. Please check your environment variables.');
  }
  return db;
}

export async function getUser() {
  try {
    const supabaseUser = await getCurrentUser();
    
    if (!supabaseUser) {
      return null;
    }

    const database = checkDb();

    // Find user in our database by auth_user_id (Supabase Auth UID)
    const user = await database
      .select()
      .from(users)
      .where(and(eq(users.authUserId, supabaseUser.id), isNull(users.deletedAt)))
      .limit(1);

    if (user.length > 0) {
      return user[0];
    }

    return null;
  } catch (error) {
    log.error('Error in getUser:', error);
    return null;
  }
}

