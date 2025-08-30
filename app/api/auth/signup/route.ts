import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseClient';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { z } from 'zod';

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = signupSchema.parse(body);
    
    const supabase = createServerSupabaseClient();

    // Step 1: Sign up with Supabase Auth ONLY
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        emailConfirm: false // Disable email confirmation for development
      }
    });

    if (error) {
      console.error('Supabase Auth signup error:', error);
      return NextResponse.json(
        { error: 'Failed to create account. Please try again.' },
        { status: 400 }
      );
    }

    if (!data.user) {
      console.error('No user data returned from Supabase Auth');
      return NextResponse.json(
        { error: 'Account creation failed. Please try again.' },
        { status: 400 }
      );
    }

    console.log('Supabase Auth user created successfully:', {
      id: data.user.id,
      email: data.user.email
    });

    // Step 2: Create profile row in public.users with auth_user_id
    const newUser = {
      authUserId: data.user.id,
      email: data.user.email!,
      name: name || null,
      role: 'owner'
    };

    const [createdUser] = await db.insert(users).values(newUser).returning();

    if (!createdUser) {
      console.error('Failed to create user profile in database');
      return NextResponse.json(
        { error: 'Failed to create user profile. Please try again.' },
        { status: 500 }
      );
    }

    console.log('User profile created in database:', {
      id: createdUser.id,
      authUserId: createdUser.authUserId,
      email: createdUser.email
    });

    return NextResponse.json({
      success: true,
      user: {
        id: createdUser.id,
        email: createdUser.email,
        name: createdUser.name,
        role: createdUser.role
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Account creation failed. Please try again.' },
      { status: 500 }
    );
  }
}
