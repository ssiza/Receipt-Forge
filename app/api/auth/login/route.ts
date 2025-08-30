import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseClient';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Step 1: Sign in with Supabase Auth ONLY
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Supabase login error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { success: false, error: 'Login failed' },
        { status: 401 }
      );
    }

    // Step 2: Fetch profile from database using auth_user_id
    const user = await db
      .select()
      .from(users)
      .where(eq(users.authUserId, data.user.id))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found in database. Please contact support.' },
        { status: 404 }
      );
    }

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
    console.error('Error in login:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}
