import { NextRequest, NextResponse } from 'next/server';
import { getUser, getUserWithTeam, getReceiptById, getReceiptPreferences } from '@/lib/db/queries';
import { generateReceiptImage } from '@/lib/receipt-generator';
import { log } from '@/lib/logger';
import { serializeError } from '@/lib/serializeError';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    log.info(`GET /api/receipts/${id}/image - Starting image generation`);

    // Authenticate user and get team
    const user = await getUser();
    if (!user) {
      log.error(`GET /api/receipts/${id}/image - Authentication failed`);
      return NextResponse.json({
        ok: false,
        error: 'Unauthorized - Please sign in again',
        details: 'Authentication failed - please refresh the page and try again'
      }, { status: 401 });
    }

    const userWithTeam = await getUserWithTeam();
    if (!userWithTeam || !userWithTeam.teamId) {
      log.error(`GET /api/receipts/${id}/image - Team not found`);
      return NextResponse.json({
        ok: false,
        error: 'Team not found',
        details: 'Your team information could not be found'
      }, { status: 404 });
    }

    // Get receipt by ID and team
    const receipt = await getReceiptById(id, userWithTeam.teamId);
    if (!receipt) {
      log.error(`GET /api/receipts/${id}/image - Receipt not found`);
      return NextResponse.json({
        ok: false,
        error: 'Receipt not found',
        details: 'The requested receipt could not be found'
      }, { status: 404 });
    }

    // Get receipt preferences
    const preferences = await getReceiptPreferences(userWithTeam.teamId);
    
    // Convert null values to undefined for the template
    const templatePreferences = preferences ? {
      businessName: preferences.businessName || undefined,
      businessAddress: preferences.businessAddress || undefined,
      logoUrl: preferences.logoUrl || undefined,
      tableColor: preferences.tableColor || '#3b82f6',
      footerThankYouText: preferences.footerThankYouText || undefined,
      footerContactInfo: preferences.footerContactInfo || undefined
    } : undefined;
    
    // Generate image
    log.info(`GET /api/receipts/${id}/image - Generating image for receipt ${receipt.receiptNumber}`);
    const imageBuffer = await generateReceiptImage(receipt as any, templatePreferences);

    // Return image as download
    const response = new NextResponse(imageBuffer as any);
    response.headers.set('Content-Type', 'image/png');
    response.headers.set('Content-Disposition', `attachment; filename="receipt-${receipt.receiptNumber}.png"`);
    response.headers.set('Content-Length', imageBuffer.length.toString());

    log.info(`GET /api/receipts/${id}/image - Image generated successfully: ${receipt.receiptNumber}`);
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