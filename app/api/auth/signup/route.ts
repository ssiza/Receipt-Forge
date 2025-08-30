import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseClient';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Step 1: Sign up with Supabase Auth ONLY
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { 
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
      }
    });

    if (error) {
      console.error('Supabase signup error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { success: false, error: 'User creation failed' },
        { status: 500 }
      );
    }

    // Step 2: Create profile row in public.users with auth_user_id
    try {
      const newUser = {
        authUserId: data.user.id,
        email: data.user.email!,
        name: name || null,
        role: 'owner'
      };

      const [createdUser] = await db.insert(users).values(newUser).returning();

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
      console.error('Database error during user creation:', dbError);
      
      // If database insert fails, we should clean up the Supabase Auth user
      try {
        await supabase.auth.admin.deleteUser(data.user.id);
      } catch (cleanupError) {
        console.error('Failed to cleanup Supabase Auth user:', cleanupError);
      }

      return NextResponse.json(
        { success: false, error: 'Account creation failed. Please try again.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in signup:', error);
    return NextResponse.json(
      { success: false, error: 'Account creation failed. Please try again.' },
      { status: 500 }
    );
  }
}
