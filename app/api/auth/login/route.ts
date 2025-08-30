import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseClient';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);
    
    const supabase = createServerSupabaseClient();

    // Step 1: Sign in with Supabase Auth ONLY
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Supabase Auth login error:', error);
      return NextResponse.json(
        { error: 'Invalid email or password. Please try again.' },
        { status: 401 }
      );
    }

    if (!data.user) {
      console.error('No user data returned from Supabase Auth');
      return NextResponse.json(
        { error: 'Authentication failed. Please try again.' },
        { status: 401 }
      );
    }

    console.log('Supabase Auth login successful:', {
      id: data.user.id,
      email: data.user.email
    });

    // Step 2: Fetch profile from database using auth_user_id
    const user = await db
      .select()
      .from(users)
      .where(eq(users.authUserId, data.user.id))
      .limit(1);

    if (user.length === 0) {
      console.error('User profile not found in database for auth_user_id:', data.user.id);
      return NextResponse.json(
        { error: 'User profile not found. Please contact support.' },
        { status: 404 }
      );
    }

    console.log('User profile found in database:', {
      id: user[0].id,
      authUserId: user[0].authUserId,
      email: user[0].email
    });

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
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Authentication failed. Please try again.' },
      { status: 500 }
    );
  }
}
