import { NextRequest, NextResponse } from 'next/server';
import { getTeamForUser, getReceiptById, getReceiptPreferences } from '@/lib/db/queries';
import { generateReceiptPDF } from '@/lib/receipt-generator';
import { log } from '@/lib/logger';
import { serializeError } from '@/lib/serializeError';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    log.info(`GET /api/receipts/${id}/pdf - Starting PDF generation`);

    // Authenticate user and get team
    const team = await getTeamForUser();
    if (!team) {
      log.error(`GET /api/receipts/${id}/pdf - Authentication failed`);
      return NextResponse.json({
        ok: false,
        error: 'Unauthorized - Please sign in again',
        details: 'Authentication failed - please refresh the page and try again'
      }, { status: 401 });
    }

    // Get receipt by ID and team
    const receipt = await getReceiptById(id, team.id);
    if (!receipt) {
      log.error(`GET /api/receipts/${id}/pdf - Receipt not found`);
      return NextResponse.json({
        ok: false,
        error: 'Receipt not found',
        details: 'The requested receipt could not be found'
      }, { status: 404 });
    }

    // Get receipt preferences
    const preferences = await getReceiptPreferences(team.id);
    
    // Convert null values to undefined for the template
    const templatePreferences = preferences ? {
      businessName: preferences.businessName || undefined,
      businessAddress: preferences.businessAddress || undefined,
      logoUrl: preferences.logoUrl || undefined,
      tableColor: preferences.tableColor || '#3b82f6',
      footerThankYouText: preferences.footerThankYouText || undefined,
      footerContactInfo: preferences.footerContactInfo || undefined
    } : undefined;
    
    // Generate PDF
    log.info(`GET /api/receipts/${id}/pdf - Generating PDF for receipt ${receipt.receiptNumber}`);
    const pdfBuffer = await generateReceiptPDF(receipt as any, templatePreferences);

    // Return PDF as download
    const response = new NextResponse(pdfBuffer as any);
    response.headers.set('Content-Type', 'application/pdf');
    response.headers.set('Content-Disposition', `attachment; filename="receipt-${receipt.receiptNumber}.pdf"`);
    response.headers.set('Content-Length', pdfBuffer.length.toString());

    log.info(`GET /api/receipts/${id}/pdf - PDF generated successfully: ${receipt.receiptNumber}`);
    return response;

  } catch (error) {
    const { id } = await params;
    log.error(`GET /api/receipts/${id}/pdf - Error generating PDF:`, error);
    
    return NextResponse.json({
      ok: false,
      error: 'PDF Generation Failed',
      details: 'Failed to generate PDF. Please try again.',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
} 