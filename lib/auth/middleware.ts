import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { TeamDataWithMembers, User } from '@/lib/db/schema';
import { getTeamForUser, getUser } from '@/lib/db/queries';
import { redirect } from 'next/navigation';

export type ActionState = {
  error?: string;
  success?: string;
  [key: string]: any; // This allows for additional properties
};

type ValidatedActionFunction<S extends z.ZodType<any, any>, T> = (
  data: z.infer<S>,
  formData: FormData
) => Promise<T>;

export function validatedAction<S extends z.ZodType<any, any>, T>(
  schema: S,
  action: ValidatedActionFunction<S, T>
) {
  return async (prevState: ActionState, formData: FormData) => {
    const result = schema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return { error: result.error.errors[0].message };
    }

    return action(result.data, formData);
  };
}

type ValidatedActionWithUserFunction<S extends z.ZodType<any, any>, T> = (
  data: z.infer<S>,
  formData: FormData,
  user: User
) => Promise<T>;

export function validatedActionWithUser<S extends z.ZodType<any, any>, T>(
  schema: S,
  action: ValidatedActionWithUserFunction<S, T>
) {
  return async (prevState: ActionState, formData: FormData) => {
    const user = await getUser();
    if (!user) {
      throw new Error('User is not authenticated');
    }

    const result = schema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return { error: result.error.errors[0].message };
    }

    return action(result.data, formData, user);
  };
}

type ActionWithTeamFunction<T> = (
  formData: FormData,
  team: TeamDataWithMembers
) => Promise<T>;

export function withTeam<T>(action: ActionWithTeamFunction<T>) {
  return async (formData: FormData): Promise<T> => {
    const user = await getUser();
    if (!user) {
      redirect('/sign-in');
    }

    const team = await getTeamForUser();
    if (!team) {
      throw new Error('Team not found');
    }

    return action(formData, team);
  };
}

// New authentication helper functions for API routes
export async function authenticateRequest(request: NextRequest) {
  try {
    // Log request details for debugging
    console.log('Auth middleware - Request URL:', request.url);
    console.log('Auth middleware - Request method:', request.method);
    console.log('Auth middleware - User agent:', request.headers.get('user-agent'));
    console.log('Auth middleware - Origin:', request.headers.get('origin'));
    console.log('Auth middleware - Referer:', request.headers.get('referer'));
    
    // Check for session cookie
    const sessionCookie = request.cookies.get('session');
    console.log('Auth middleware - Session cookie present:', !!sessionCookie);
    
    if (!sessionCookie) {
      console.log('Auth middleware - No session cookie found');
      return { user: null, error: 'No session cookie' };
    }

    // Try to get user
    const user = await getUser();
    console.log('Auth middleware - User found:', !!user);
    
    if (!user) {
      console.log('Auth middleware - User authentication failed');
      return { user: null, error: 'User authentication failed' };
    }

    return { user, error: null };
  } catch (error) {
    console.error('Auth middleware - Error during authentication:', error);
    return { user: null, error: 'Authentication error' };
  }
}

export function createAuthErrorResponse(error: string, details?: string) {
  return NextResponse.json({
    error: 'Authentication failed',
    message: error,
    details,
    timestamp: new Date().toISOString()
  }, { 
    status: 401,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}
