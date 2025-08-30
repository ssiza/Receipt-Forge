import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseClient';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { log } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      log.error('Login attempt with missing email or password');
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    log.info(`Starting login process for email: ${email}`);

    const supabase = await createServerSupabaseClient();

    // Step 1: Sign in with Supabase Auth ONLY
    log.info(`Authenticating with Supabase Auth for email: ${email}`);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      log.error(`Supabase login error for ${email}:`, error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }

    if (!data.user) {
      log.error(`No user data returned from Supabase Auth for ${email}`);
      return NextResponse.json(
        { success: false, error: 'Login failed' },
        { status: 401 }
      );
    }

    log.info(`Supabase Auth login successful for ${email} with ID: ${data.user.id}`);

    // Step 2: Fetch profile from database using auth_user_id
    log.info(`Fetching profile from database for user: ${data.user.id}`);
    const user = await db
      .select()
      .from(users)
      .where(eq(users.authUserId, data.user.id))
      .limit(1);

    if (user.length === 0) {
      log.error(`User profile not found in database for Supabase Auth user: ${data.user.id}`);
      return NextResponse.json(
        { success: false, error: 'User not found in database. Please contact support.' },
        { status: 404 }
      );
    }

    log.info(`Profile found in database for user: ${data.user.id}`);

    return NextResponse.json({
      success: true,
      user: {
        id: user[0].id,
        email: user[0].email,
        name: user[0].name,
        role: user[0].role
      }
    });

  } catch (error) {
    log.error('Unexpected error in login:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}
