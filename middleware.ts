import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Define protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/api/receipts',
  '/api/business-templates',
  '/api/user',
  '/api/teams'
];

// Define authentication routes that should not be accessible when logged in
const authRoutes = ['/sign-in', '/sign-up', '/auth/callback'];

// Define public routes that don't require authentication
const publicRoutes = ['/', '/pricing', '/about', '/contact', '/api/health'];

// Helper to check if a path matches any of the given patterns
const isPathMatching = (path: string, patterns: string[]): boolean => {
  return patterns.some(pattern => 
    path === pattern || path.startsWith(`${pattern}/`)
  );
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtectedRoute = isPathMatching(pathname, protectedRoutes);
  const isAuthRoute = isPathMatching(pathname, authRoutes);
  const isPublicRoute = isPathMatching(pathname, publicRoutes);

  // Skip middleware for public routes that aren't auth routes
  if (isPublicRoute && !isAuthRoute) {
    return NextResponse.next();
  }

  // Check if Supabase environment variables are configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase environment variables are not configured in middleware');
    return new NextResponse('Server configuration error', { status: 500 });
  }

  // Create a response object that we'll modify
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  try {
    // Create a Supabase client with cookie handling
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            // Update the response cookies
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: any) {
            // Remove the cookie from the response
            response.cookies.set({
              name,
              value: '',
              ...options,
              maxAge: 0,
            });
          },
        },
      }
    );

    // Get the user's session
    const { data: { session } } = await supabase.auth.getSession();

    // Handle authentication for protected routes
    if (isProtectedRoute && !session) {
      // Store the original URL for redirecting back after login
      const redirectUrl = new URL('/sign-in', request.url);
      redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname);
      
      // Clear any existing session
      response.cookies.delete('sb-auth-token');
      
      return NextResponse.redirect(redirectUrl);
    }

    // Redirect authenticated users away from auth routes
    if (isAuthRoute && session) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // For API routes, return 401 for unauthenticated requests
    if (pathname.startsWith('/api/') && isProtectedRoute && !session) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    
    // If there's an error, we'll still allow the request to proceed
    // but we'll log it for debugging purposes
    if (process.env.NODE_ENV === 'development') {
      console.error('Middleware caught an error:', error);
    }
    
    return response;
  }
}

// Configure which paths should be processed by this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|css|js|woff|woff2|ttf|eot)$).*)',
  ],
  runtime: 'nodejs'
};
