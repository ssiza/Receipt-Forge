import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseClient';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq, isNull } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    // Get current user from Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Fetch user profile from database
    const userProfile = await db
      .select()
      .from(users)
      .where(eq(users.authUserId, user.id))
      .limit(1);

    if (userProfile.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userProfile[0].id,
        email: userProfile[0].email,
        name: userProfile[0].name,
        role: userProfile[0].role
      }
    });

  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
