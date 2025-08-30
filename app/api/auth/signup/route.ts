import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabaseClient';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { log } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      log.error('Signup attempt with missing email or password');
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    log.info(`Starting signup process for email: ${email}`);

    const supabase = await createServerSupabaseClient();

    // Step 1: Sign up with Supabase Auth ONLY
    log.info(`Creating user in Supabase Auth for email: ${email}`);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { 
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
      }
    });

    if (error) {
      log.error(`Supabase signup error for ${email}:`, error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    if (!data.user) {
      log.error(`No user data returned from Supabase Auth for ${email}`);
      return NextResponse.json(
        { success: false, error: 'User creation failed' },
        { status: 500 }
      );
    }

    log.info(`Supabase Auth user created successfully for ${email} with ID: ${data.user.id}`);

    // Step 2: Create profile row in public.users with auth_user_id
    try {
      log.info(`Creating profile in database for user: ${data.user.id}`);
      const newUser = {
        authUserId: data.user.id,
        email: data.user.email!,
        name: name || null,
        role: 'owner'
      };

      const [createdUser] = await db.insert(users).values(newUser).returning();

      log.info(`Profile created successfully in database for user: ${data.user.id}`);

      return NextResponse.json({
        success: true,
        user: {
          id: createdUser.id,
          email: createdUser.email,
          name: createdUser.name,
          role: createdUser.role
        }
      });

    } catch (dbError) {
      log.error(`Database error during user creation for ${data.user.id}:`, dbError);
      
      // If database insert fails, we should clean up the Supabase Auth user
      log.info(`Cleaning up Supabase Auth user after database failure: ${data.user.id}`);
      try {
        const adminSupabase = createAdminSupabaseClient();
        await adminSupabase.auth.admin.deleteUser(data.user.id);
        log.info(`Successfully cleaned up Supabase Auth user: ${data.user.id}`);
      } catch (cleanupError) {
        log.error(`Failed to cleanup Supabase Auth user: ${data.user.id}`, cleanupError);
      }

      return NextResponse.json(
        { success: false, error: 'Account creation failed. Please try again.' },
        { status: 500 }
      );
    }

  } catch (error) {
    log.error('Unexpected error in signup:', error);
    return NextResponse.json(
      { success: false, error: 'Account creation failed. Please try again.' },
      { status: 500 }
    );
  }
}
