import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseClient';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq, isNull } from 'drizzle-orm';
import { log } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    log.info('GET /api/auth/me - Starting request processing');

    const supabase = await createServerSupabaseClient();

    // Get current user from Supabase Auth
    log.info('Getting current user from Supabase Auth');
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      log.error('Error getting user from Supabase Auth:', error);
      return NextResponse.json(
        { success: false, error: 'Authentication error' },
        { status: 401 }
      );
    }

    if (!user) {
      log.info('No authenticated user found');
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    log.info(`Authenticated user found: ${user.id} (${user.email})`);

    // Fetch user profile from database
    log.info(`Fetching profile from database for user: ${user.id}`);
    
    if (!db) {
      log.error('Database connection not available');
      return NextResponse.json(
        { success: false, error: 'Database connection not available' },
        { status: 500 }
      );
    }
    
    const userProfile = await db
      .select()
      .from(users)
      .where(eq(users.authUserId, user.id))
      .limit(1);

    if (userProfile.length === 0) {
      log.error(`User profile not found in database for Supabase Auth user: ${user.id}`);
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    log.info(`Profile found in database for user: ${user.id}`);

    return NextResponse.json({
      success: true,
      user: {
        id: userProfile[0].id,
        email: userProfile[0].email,
        name: userProfile[0].name,
        role: userProfile[0].role
      }
    });

  } catch (error) {
    log.error('Unexpected error in /api/auth/me:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
