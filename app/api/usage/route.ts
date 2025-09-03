import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseClient';
import { log } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    log.info('GET /api/usage - Starting request processing');
    
    const supabase = await createServerSupabaseClient();
    
    // Get current user from Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      log.error('GET /api/usage - Authentication failed:', authError);
      return NextResponse.json({ 
        ok: false,
        error: 'Unauthorized - Please sign in again',
        details: 'Authentication failed - please refresh the page and try again'
      }, { status: 401 });
    }

    log.info(`GET /api/usage - Getting usage for user: ${user.id}`);

    // Get user profile from database
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (userError || !userProfile) {
      log.error('GET /api/usage - User profile not found:', userError);
      return NextResponse.json({ 
        ok: false,
        error: 'User profile not found',
        details: 'Your user profile could not be found'
      }, { status: 404 });
    }

    // Get current month and year
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11
    const currentYear = now.getFullYear();

    // Get current monthly usage for this user
    const { data: monthlyUsage, error: usageError } = await supabase
      .from('monthly_usage')
      .select('receipt_count')
      .eq('user_id', userProfile.id)
      .eq('month', currentMonth)
      .eq('year', currentYear)
      .single();

    if (usageError && usageError.code !== 'PGRST116') { // PGRST116 = no rows returned
      log.error('GET /api/usage - Error fetching usage:', usageError);
      return NextResponse.json({ 
        ok: false,
        error: 'Failed to retrieve usage',
        details: 'An error occurred while fetching usage data'
      }, { status: 500 });
    }

    const currentUsage = monthlyUsage?.receipt_count || 0;
    
    log.info('GET /api/usage - Retrieved usage for user:', { 
      userId: userProfile.id, 
      currentUsage,
      month: currentMonth,
      year: currentYear
    });
    
    return NextResponse.json({ 
      ok: true, 
      data: {
        currentUsage,
        userId: userProfile.id,
        month: currentMonth,
        year: currentYear
      }
    });
  } catch (error) {
    log.error('GET /api/usage - Error retrieving usage:', error);
    
    return NextResponse.json({ 
      ok: false,
      error: 'Internal server error',
      details: 'An unexpected error occurred while retrieving usage data'
    }, { status: 500 });
  }
} 