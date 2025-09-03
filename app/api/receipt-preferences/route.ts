import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseClient';
import { log } from '@/lib/logger';

export async function GET() {
  try {
    log.info('GET /api/receipt-preferences - Starting request processing');

    const supabase = await createServerSupabaseClient();
    
    // Get current user from Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      log.error('GET /api/receipt-preferences - Authentication failed:', authError);
      return NextResponse.json({
        ok: false,
        error: 'Unauthorized',
        details: 'Please sign in to access receipt preferences'
      }, { status: 401 });
    }

    log.info(`GET /api/receipt-preferences - Getting preferences for user: ${user.id}`);

    // Get user profile from database
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (userError || !userProfile) {
      log.error('GET /api/receipt-preferences - User profile not found:', userError);
      return NextResponse.json({
        ok: false,
        error: 'User profile not found',
        details: 'Your user profile could not be found'
      }, { status: 404 });
    }

    // Get receipt preferences for this user
    const { data: preferences, error: preferencesError } = await supabase
      .from('receipt_preferences')
      .select('*')
      .eq('user_id', userProfile.id)
      .single();

    if (preferencesError && preferencesError.code !== 'PGRST116') { // PGRST116 = no rows returned
      log.error('GET /api/receipt-preferences - Error fetching preferences:', preferencesError);
      return NextResponse.json({
        ok: false,
        error: 'Failed to retrieve preferences',
        details: 'An error occurred while fetching receipt preferences'
      }, { status: 500 });
    }

    // If no preferences exist, return default values
    const defaultPreferences = {
      businessName: null,
      businessAddress: null,
      businessPhone: null,
      businessEmail: null,
      tableColor: '#3b82f6',
      footerThankYouText: null,
      footerContactInfo: null
    };

    log.info(`GET /api/receipt-preferences - Retrieved preferences for user: ${userProfile.id}`);
    
    return NextResponse.json({
      ok: true,
      data: preferences || defaultPreferences
    });

  } catch (error) {
    log.error('GET /api/receipt-preferences - Error:', error);
    return NextResponse.json({
      ok: false,
      error: 'Failed to retrieve preferences',
      details: 'An error occurred while fetching receipt preferences'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    log.info('PUT /api/receipt-preferences - Starting request processing');

    const supabase = await createServerSupabaseClient();
    
    // Get current user from Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      log.error('PUT /api/receipt-preferences - Authentication failed:', authError);
      return NextResponse.json({
        ok: false,
        error: 'Unauthorized',
        details: 'Please sign in to update receipt preferences'
      }, { status: 401 });
    }

    log.info(`PUT /api/receipt-preferences - Updating preferences for user: ${user.id}`);

    // Get user profile from database
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (userError || !userProfile) {
      log.error('PUT /api/receipt-preferences - User profile not found:', userError);
      return NextResponse.json({
        ok: false,
        error: 'User profile not found',
        details: 'Your user profile could not be found'
      }, { status: 404 });
    }

    const body = await request.json();
    const { businessName, businessAddress, businessPhone, businessEmail, tableColor, footerThankYouText, footerContactInfo } = body;

    // Validate input - allow empty strings but ensure they are strings
    if (businessName !== undefined && businessName !== null && typeof businessName !== 'string') {
      return NextResponse.json({
        ok: false,
        error: 'Invalid input',
        details: 'Business name must be a string'
      }, { status: 400 });
    }

    if (businessAddress !== undefined && businessAddress !== null && typeof businessAddress !== 'string') {
      return NextResponse.json({
        ok: false,
        error: 'Invalid input',
        details: 'Business address must be a string'
      }, { status: 400 });
    }

    if (businessPhone !== undefined && businessPhone !== null && typeof businessPhone !== 'string') {
      return NextResponse.json({
        ok: false,
        error: 'Invalid input',
        details: 'Business phone must be a string'
      }, { status: 400 });
    }

    if (businessEmail !== undefined && businessEmail !== null && typeof businessEmail !== 'string') {
      return NextResponse.json({
        ok: false,
        error: 'Invalid input',
        details: 'Business email must be a string'
      }, { status: 400 });
    }

    if (tableColor !== undefined && tableColor !== null && typeof tableColor !== 'string') {
      return NextResponse.json({
        ok: false,
        error: 'Invalid input',
        details: 'Table color must be a string'
      }, { status: 400 });
    }

    if (footerThankYouText !== undefined && footerThankYouText !== null && typeof footerThankYouText !== 'string') {
      return NextResponse.json({
        ok: false,
        error: 'Invalid input',
        details: 'Footer thank you text must be a string'
      }, { status: 400 });
    }

    if (footerContactInfo !== undefined && footerContactInfo !== null && typeof footerContactInfo !== 'string') {
      return NextResponse.json({
        ok: false,
        error: 'Invalid input',
        details: 'Footer contact info must be a string'
      }, { status: 400 });
    }

    // Clean up empty strings to null for database storage
    const cleanData = {
      businessName: businessName === '' ? null : businessName,
      businessAddress: businessAddress === '' ? null : businessAddress,
      businessPhone: businessPhone === '' ? null : businessPhone,
      businessEmail: businessEmail === '' ? null : businessEmail,
      tableColor: tableColor === '' ? null : tableColor,
      footerThankYouText: footerThankYouText === '' ? null : footerThankYouText,
      footerContactInfo: footerContactInfo === '' ? null : footerContactInfo
    };

    // Check if preferences already exist for this user
    const { data: existingPreferences } = await supabase
      .from('receipt_preferences')
      .select('id')
      .eq('user_id', userProfile.id)
      .single();

    let updatedPreferences;

    if (existingPreferences) {
      // Update existing preferences
      const { data, error } = await supabase
        .from('receipt_preferences')
        .update({
          ...cleanData,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userProfile.id)
        .select()
        .single();

      if (error) throw error;
      updatedPreferences = data;
    } else {
      // Create new preferences
      const { data, error } = await supabase
        .from('receipt_preferences')
        .insert({
          user_id: userProfile.id,
          ...cleanData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      updatedPreferences = data;
    }

    log.info(`PUT /api/receipt-preferences - Updated preferences for user: ${userProfile.id}`);
    
    return NextResponse.json({
      ok: true,
      data: updatedPreferences
    });

  } catch (error) {
    log.error('PUT /api/receipt-preferences - Error:', error);
    return NextResponse.json({
      ok: false,
      error: 'Failed to update preferences',
      details: 'An error occurred while updating receipt preferences'
    }, { status: 500 });
  }
} 