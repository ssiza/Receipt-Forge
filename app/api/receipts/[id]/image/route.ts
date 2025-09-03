import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseClient';
import { generateReceiptImage } from '@/lib/receipt-generator';
import { log } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    log.info(`GET /api/receipts/${id}/image - Starting image generation`);

    const supabase = await createServerSupabaseClient();
    
    // Get current user from Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      log.error(`GET /api/receipts/${id}/image - Authentication failed:`, authError);
      return NextResponse.json({
        ok: false,
        error: 'Unauthorized - Please sign in again',
        details: 'Authentication failed - please refresh the page and try again'
      }, { status: 401 });
    }

    log.info(`GET /api/receipts/${id}/image - Getting receipt for user: ${user.id}`);

    // Get user profile from database
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (userError || !userProfile) {
      log.error(`GET /api/receipts/${id}/image - User profile not found:`, userError);
      return NextResponse.json({
        ok: false,
        error: 'User profile not found',
        details: 'Your user profile could not be found'
      }, { status: 404 });
    }

    // Get receipt by ID (only if it belongs to this user)
    const { data: receipt, error: receiptError } = await supabase
      .from('receipts')
      .select('*')
      .eq('id', id)
      .eq('user_id', userProfile.id)
      .single();

    if (receiptError || !receipt) {
      log.error(`GET /api/receipts/${id}/image - Receipt not found:`, receiptError);
      return NextResponse.json({
        ok: false,
        error: 'Receipt not found',
        details: 'The requested receipt could not be found'
      }, { status: 404 });
    }

    // Get receipt preferences for this user
    const { data: preferences, error: preferencesError } = await supabase
      .from('receipt_preferences')
      .select('*')
      .eq('user_id', userProfile.id)
      .single();

    if (preferencesError && preferencesError.code !== 'PGRST116') { // PGRST116 = no rows returned
      log.error(`GET /api/receipts/${id}/image - Error fetching preferences:`, preferencesError);
      // Continue without preferences if there's an error
    }
    
    // Convert null values to undefined for the template
    const templatePreferences = preferences ? {
      businessName: preferences.business_name || undefined,
      businessAddress: preferences.business_address || undefined,
      logoUrl: preferences.logo_url || undefined,
      tableColor: preferences.table_color || '#3b82f6',
      footerThankYouText: preferences.footer_thank_you_text || undefined,
      footerContactInfo: preferences.footer_contact_info || undefined
    } : undefined;
    
    // Generate image
    log.info(`GET /api/receipts/${id}/image - Generating image for receipt ${receipt.receipt_number}`);
    const imageBuffer = await generateReceiptImage(receipt as any, templatePreferences);

    // Return image as download
    const response = new NextResponse(imageBuffer as any);
    response.headers.set('Content-Type', 'image/png');
    response.headers.set('Content-Disposition', `attachment; filename="receipt-${receipt.receipt_number}.png"`);
    response.headers.set('Content-Length', imageBuffer.length.toString());

    log.info(`GET /api/receipts/${id}/image - Image generated successfully: ${receipt.receipt_number}`);
    return response;

  } catch (error) {
    const { id } = await params;
    log.error(`GET /api/receipts/${id}/image - Error generating image:`, error);
    
    return NextResponse.json({
      ok: false,
      error: 'Image Generation Failed',
      details: 'Failed to generate image. Please try again.',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
} 