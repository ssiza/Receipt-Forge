import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    // Sign out with Supabase Auth ONLY
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Supabase Auth logout error:', error);
      return NextResponse.json(
        { error: 'Logout failed. Please try again.' },
        { status: 500 }
      );
    }

    console.log('Supabase Auth logout successful');

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed. Please try again.' },
      { status: 500 }
    );
  }
}
