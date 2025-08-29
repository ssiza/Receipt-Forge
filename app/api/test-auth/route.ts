import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    console.log('=== TEST AUTH API ===');
    console.log('Request URL:', request.url);
    console.log('Request method:', request.method);
    console.log('User agent:', request.headers.get('user-agent'));
    console.log('Origin:', request.headers.get('origin'));
    console.log('Referer:', request.headers.get('referer'));
    console.log('All headers:', Object.fromEntries(request.headers.entries()));
    
    console.log('=== COOKIES ===');
    const allCookies = request.cookies.getAll();
    console.log('All cookies:', allCookies);
    
    const sessionCookie = request.cookies.get('session');
    console.log('Session cookie:', sessionCookie);
    
    console.log('=== AUTHENTICATION TEST ===');
    const user = await getUser();
    console.log('User found:', !!user);
    if (user) {
      console.log('User ID:', user.id);
      console.log('User email:', user.email);
    }
    
    return NextResponse.json({
      success: true,
      authenticated: !!user,
      user: user ? { id: user.id, email: user.email } : null,
      cookies: allCookies,
      headers: Object.fromEntries(request.headers.entries()),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test auth error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 