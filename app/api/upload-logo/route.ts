import { NextRequest, NextResponse } from 'next/server';
import { getUser, getUserWithTeam, createOrUpdateReceiptPreferences } from '@/lib/db/queries';
import { log } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    log.info('POST /api/upload-logo - Starting request processing');

    // Authenticate user and get team
    const user = await getUser();
    if (!user) {
      log.error('POST /api/upload-logo - Authentication failed');
      return NextResponse.json({
        ok: false,
        error: 'Unauthorized - Please sign in again',
        details: 'Authentication failed - please refresh the page and try again'
      }, { status: 401 });
    }

    const userWithTeam = await getUserWithTeam();
    if (!userWithTeam || !userWithTeam.teamId) {
      log.error('POST /api/upload-logo - Team not found');
      return NextResponse.json({
        ok: false,
        error: 'Team not found',
        details: 'Your team information could not be found'
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

    // Save to database
    await createOrUpdateReceiptPreferences(userWithTeam.teamId, {
      logoUrl: dataUrl
    });

    log.info(`POST /api/upload-logo - Logo uploaded successfully for team ${userWithTeam.teamId}`);
    
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