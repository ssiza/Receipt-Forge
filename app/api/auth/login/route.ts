import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseClient';
import { log } from '@/lib/logger';

type LoginAttempt = {
  email: string;
  ip: string;
  user_agent: string | null;
  success: boolean;
  attempted_at: string;
};

type UserProfile = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  auth_user_id: string;
};

interface AuthResponse {
  data: {
    user: {
      id: string;
      email: string;
      user_metadata?: {
        name?: string;
      };
    } | null;
    session: any | null;
  };
  error: any;
}

// Rate limiting and security settings

// Simple in-memory rate limiting for development
// In production, you should use a proper rate limiting solution like Upstash Redis
const rateLimitCache = new Map<string, { count: number; resetAt: number }>();

// Track failed login attempts
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 5; // 5 requests per minute

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    // Get client IP from headers (handled by Next.js in production)
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = (forwardedFor ? forwardedFor.split(',').shift()?.trim() : '127.0.0.1') || 'unknown';
    
    // Input validation
    if (!email || !password) {
      log.error('Login attempt with missing email or password', { ip });
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check rate limiting
    const now = Date.now();
    const rateLimitKey = `rate_limit_${ip}`;
    const rateLimit = rateLimitCache.get(rateLimitKey);
    
    if (rateLimit) {
      if (now < rateLimit.resetAt) {
        // Within rate limit window
        if (rateLimit.count >= RATE_LIMIT_MAX) {
          log.warn(`Rate limit exceeded for IP: ${ip}`);
          return NextResponse.json(
            { success: false, error: 'Too many login attempts. Please try again later.' },
            { 
              status: 429, 
              headers: { 
                'Retry-After': String(Math.ceil((rateLimit.resetAt - now) / 1000)),
                'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': String(rateLimit.resetAt)
              } 
            }
          );
        }
        // Increment request count
        rateLimit.count += 1;
      } else {
        // Reset rate limit window
        rateLimit.count = 1;
        rateLimit.resetAt = now + RATE_LIMIT_WINDOW;
      }
    } else {
      // Initialize rate limit for this IP
      rateLimitCache.set(rateLimitKey, {
        count: 1,
        resetAt: now + RATE_LIMIT_WINDOW
      });
    }

    log.info(`Starting login process for email: ${email} from IP: ${ip}`);
    const supabase = await createServerSupabaseClient();

    // Check for existing failed attempts
    const fifteenMinutesAgo = new Date(Date.now() - LOCKOUT_DURATION).toISOString();
    let failedAttempts: LoginAttempt[] = [];
    
    try {
      const { data: recentAttempts, error: attemptsError } = await supabase
        .from('login_attempts')
        .select('*')
        .eq('email', email)
        .gte('attempted_at', fifteenMinutesAgo)
        .order('attempted_at', { ascending: false });

      if (attemptsError) throw attemptsError;
      
      failedAttempts = (recentAttempts || []).filter((a: any) => !a.success);
      
      // Check if account is temporarily locked
      if (failedAttempts.length >= MAX_LOGIN_ATTEMPTS) {
        const lastAttempt = new Date(failedAttempts[0].attempted_at);
        const nextAttempt = new Date(lastAttempt.getTime() + LOCKOUT_DURATION);
        const minutesLeft = Math.ceil((nextAttempt.getTime() - Date.now()) / 60000);
        
        log.warn(`Account temporarily locked for ${email} - too many failed attempts`, {
          ip,
          failedAttempts: failedAttempts.length,
          nextAttempt
        });

        return NextResponse.json(
          { 
            success: false, 
            error: `Too many failed attempts. Please try again in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}.` 
          },
          { 
            status: 429,
            headers: { 'Retry-After': String(Math.ceil((nextAttempt.getTime() - Date.now()) / 1000)) }
          }
        );
      }
    } catch (error) {
      log.error('Error checking login attempts:', error);
      // Continue with login even if we can't check previous attempts
      // This ensures we don't lock users out due to database errors
    }

    // Attempt to authenticate with Supabase Auth
    log.info(`Authenticating with Supabase Auth for email: ${email}`);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    }) as AuthResponse;

    // Log the login attempt
    try {
      const loginAttempt: LoginAttempt = {
        email,
        ip,
        user_agent: request.headers.get('user-agent') || null,
        success: !error,
        attempted_at: new Date().toISOString()
      };

      await supabase
        .from('login_attempts')
        .insert(loginAttempt);
        
    } catch (error) {
      log.error('Failed to log login attempt:', error);
      // Don't fail the login if logging fails
    }

    if (error) {
      log.error(`Login failed for ${email}:`, { 
        error: error.message, 
        ip,
        remainingAttempts: MAX_LOGIN_ATTEMPTS - failedAttempts.length - 1
      });

      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid email or password',
          remainingAttempts: MAX_LOGIN_ATTEMPTS - failedAttempts.length - 1
        },
        { status: 401 }
      );
    }

    if (!data.user) {
      log.error(`No user data returned from Supabase Auth for ${email}`, { ip });
      return NextResponse.json(
        { success: false, error: 'Login failed' },
        { status: 401 }
      );
    }

    log.info(`Supabase Auth login successful for ${email} with ID: ${data.user.id}`);

    // Fetch user profile from database
    log.info(`Fetching profile from database for user: ${data.user.id}`);
    
    try {
      // Get the user's profile with their legacy ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', data.user.id)
        .single();

      if (userError || !userData) {
        log.error('User profile not found in database', { 
          authUserId: data.user.id,
          error: userError
        });
        
        // Sign out the user since we can't find their profile
        await supabase.auth.signOut();
        
        return NextResponse.json(
          { 
            success: false, 
            error: 'User profile not found. Please contact support.' 
          },
          { status: 404 }
        );
      }

      const user = userData as UserProfile;
      log.info(`Profile found in database for user: ${user.id}`);

      // Update the most recent login attempt to success
      try {
        await supabase
          .from('login_attempts')
          .update({ success: true })
          .eq('email', email)
          .order('attempted_at', { ascending: false })
          .limit(1);
      } catch (updateError) {
        log.error('Error updating login attempt:', updateError);
        // Non-critical error, continue
      }

      // Set a secure HTTP-only cookie with the legacy user ID
      const response = NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });

      // Set a secure, HTTP-only cookie with the legacy user ID
      // This ensures compatibility with existing code that expects the legacy ID
      response.cookies.set({
        name: 'legacy_user_id',
        value: user.id,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });

      return response;
    } catch (error) {
      log.error('Error during login process:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'An error occurred during login. Please try again.' 
        },
        { status: 500 }
      );
    }

  } catch (error) {
    log.error('Unexpected error in login:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}
