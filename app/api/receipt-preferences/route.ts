import { NextRequest, NextResponse } from 'next/server';
import { getUser, getUserWithTeam, getReceiptPreferences, createOrUpdateReceiptPreferences } from '@/lib/db/queries';
import { log } from '@/lib/logger';

export async function GET() {
  try {
    log.info('GET /api/receipt-preferences - Starting request processing');

    const user = await getUser();
    if (!user) {
      log.error('GET /api/receipt-preferences - Authentication failed');
      return NextResponse.json({
        ok: false,
        error: 'Unauthorized',
        details: 'Please sign in to access receipt preferences'
      }, { status: 401 });
    }

    const userWithTeam = await getUserWithTeam();
    if (!userWithTeam || !userWithTeam.teamId) {
      log.error('GET /api/receipt-preferences - Team not found');
      return NextResponse.json({
        ok: false,
        error: 'Team not found',
        details: 'Your team information could not be found'
      }, { status: 404 });
    }

    const preferences = await getReceiptPreferences(userWithTeam.teamId);
    
    log.info(`GET /api/receipt-preferences - Retrieved preferences for team ${userWithTeam.teamId}`);
    
    return NextResponse.json({
      ok: true,
      data: preferences
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

    const user = await getUser();
    if (!user) {
      log.error('PUT /api/receipt-preferences - Authentication failed');
      return NextResponse.json({
        ok: false,
        error: 'Unauthorized',
        details: 'Please sign in to update receipt preferences'
      }, { status: 401 });
    }

    const userWithTeam = await getUserWithTeam();
    if (!userWithTeam || !userWithTeam.teamId) {
      log.error('PUT /api/receipt-preferences - Team not found');
      return NextResponse.json({
        ok: false,
        error: 'Team not found',
        details: 'Your team information could not be found'
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

    const updatedPreferences = await createOrUpdateReceiptPreferences(userWithTeam.teamId, cleanData);

    log.info(`PUT /api/receipt-preferences - Updated preferences for team ${userWithTeam.teamId}`);
    
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