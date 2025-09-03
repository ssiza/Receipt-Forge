import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabaseClient';
import { log } from '@/lib/logger';

type UserProfile = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  auth_user_id: string;
  created_at?: string;
  updated_at?: string;
};

// Validate email format
const isValidEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Validate password strength
const isStrongPassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  return { valid: true };
};

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    // Input validation
    if (!email || !password) {
      log.error('Signup attempt with missing email or password');
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    const passwordCheck = isStrongPassword(password);
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { success: false, error: passwordCheck.message },
        { status: 400 }
      );
    }

    log.info(`Starting signup process for email: ${email}`);
    const supabase = await createServerSupabaseClient();

    // Check if user is already authenticated
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser) {
      log.warn(`Signup attempt for already authenticated user: ${currentUser.id}`);
      return NextResponse.json(
        { success: false, error: 'You are already signed in' },
        { status: 400 }
      );
    }

    // Check if email already exists in Supabase Auth
    const { data: existingUsers, error: authCheckError } = await supabase
      .auth.admin.listUsers();

    if (authCheckError) {
      log.error('Error checking existing users:', authCheckError);
      return NextResponse.json(
        { success: false, error: 'Error checking existing accounts' },
        { status: 500 }
      );
    }

    const userExists = existingUsers?.users?.some(user => user.email === email);
    if (userExists) {
      log.warn(`Signup attempt with existing email: ${email}`);
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Create user in Supabase Auth
    log.info(`Creating user in Supabase Auth for email: ${email}`);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { 
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        data: { name: name || null }
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

    // Create user profile in database using Supabase
    try {
      log.info(`Creating profile in database for user: ${data.user.id}`);
      
      const newUser = {
        auth_user_id: data.user.id,
        email: data.user.email!,
        name: name || null,
        role: 'owner',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Insert the new user into the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert(newUser)
        .select()
        .single();

      if (userError) throw userError;
      
      const createdUser = userData as UserProfile;
      log.info(`Profile created successfully in database for user: ${data.user.id}`);

      // Send verification email if email confirmation is enabled
      if (!data.session) {
        log.info(`Sending email verification for user: ${data.user.id}`);
        await supabase.auth.resend({
          type: 'signup',
          email,
          options: {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
          }
        });
      }

      return NextResponse.json({
        success: true,
        user: {
          id: createdUser.id,
          email: createdUser.email,
          name: createdUser.name,
          role: createdUser.role,
          emailVerified: !!data.session?.user.email_confirmed_at,
          session: data.session
        }
      });

    } catch (dbError) {
      log.error(`Database error during user creation for ${data.user.id}:`, dbError);
      
      // Clean up Supabase Auth user if database insert fails
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
