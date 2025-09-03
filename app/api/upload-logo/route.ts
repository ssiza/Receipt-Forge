import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseClient';
import { log } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    log.info('POST /api/upload-logo - Starting request processing');

    const supabase = await createServerSupabaseClient();
    
    // Get current user from Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      log.error('POST /api/upload-logo - Authentication failed:', authError);
      return NextResponse.json({
        ok: false,
        error: 'Unauthorized - Please sign in again',
        details: 'Authentication failed - please refresh the page and try again'
      }, { status: 401 });
    }

    log.info(`POST /api/upload-logo - Uploading logo for user: ${user.id}`);

    // Get user profile from database
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (userError || !userProfile) {
      log.error('POST /api/upload-logo - User profile not found:', userError);
      return NextResponse.json({
        ok: false,
        error: 'User profile not found',
        details: 'Your user profile could not be found'
      }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('logo') as File;

    if (!file) {
      return NextResponse.json({
        ok: false,
        error: 'No file provided',
        details: 'Please select a logo file to upload'
      }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        ok: false,
        error: 'Invalid file type',
        details: 'Please upload a JPG or PNG file'
      }, { status: 400 });
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return NextResponse.json({
        ok: false,
        error: 'File too large',
        details: 'Logo file must be smaller than 2MB'
      }, { status: 400 });
    }

    // Convert file to base64 for storage
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Check if receipt preferences already exist for this user
    const { data: existingPreferences } = await supabase
      .from('receipt_preferences')
      .select('id')
      .eq('user_id', userProfile.id)
      .single();

    if (existingPreferences) {
      // Update existing preferences
      const { error: updateError } = await supabase
        .from('receipt_preferences')
        .update({
          logo_url: dataUrl,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userProfile.id);

      if (updateError) {
        log.error('POST /api/upload-logo - Error updating preferences:', updateError);
        throw updateError;
      }
    } else {
      // Create new preferences
      const { error: createError } = await supabase
        .from('receipt_preferences')
        .insert({
          user_id: userProfile.id,
          logo_url: dataUrl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (createError) {
        log.error('POST /api/upload-logo - Error creating preferences:', createError);
        throw createError;
      }
    }

    log.info(`POST /api/upload-logo - Logo uploaded successfully for user: ${userProfile.id}`);
    
    return NextResponse.json({
      ok: true,
      data: { logoUrl: dataUrl }
    });

  } catch (error) {
    log.error('POST /api/upload-logo - Error uploading logo:', error);
    
    return NextResponse.json({
      ok: false,
      error: 'Failed to upload logo',
      details: 'An error occurred while uploading the logo',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
} 