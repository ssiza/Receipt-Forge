import { NextRequest, NextResponse } from 'next/server';
import { getTeamForUser, getReceiptsForTeam, createReceipt, getCurrentMonthUsage, incrementMonthlyUsage } from '@/lib/db/queries';

import { z } from 'zod';
import { log } from '@/lib/logger';
import { serializeError } from '@/lib/serializeError';

// No CORS headers needed for same-origin requests
const corsHeaders = {};

const createReceiptSchema = z.object({
  issueDate: z.string().transform(str => new Date(str)),
  customerName: z.string().min(1, 'Customer name is required'),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().nullable().optional(),
  customerAddress: z.string().nullable().optional(),
  items: z.array(z.record(z.any())), // Allow dynamic fields in items
  subtotal: z.number().min(0, 'Subtotal must be non-negative'),
  taxAmount: z.number().min(0, 'Tax amount must be non-negative').default(0),
  totalAmount: z.number().min(0, 'Total amount must be non-negative'),
  currency: z.string().default('USD'),
  status: z.string().default('paid'),
  notes: z.string().nullable().optional(),
  // Business information fields
  businessName: z.string().nullable().optional(),
  businessAddress: z.string().nullable().optional(),
  businessPhone: z.string().nullable().optional(),
  businessEmail: z.string().nullable().optional(),
  // Additional fields
  dueDate: z.string().nullable().optional(),
  paymentTerms: z.string().nullable().optional(),
  reference: z.string().nullable().optional(),
  // Item additional fields
  itemAdditionalFields: z.array(z.object({
    id: z.string(),
    name: z.string(),
    label: z.string(),
    type: z.string(),
  })).nullable().optional(),
});

async function getAuthenticatedTeam(request: NextRequest) {
  try {
    // Simple authentication check
    const team = await getTeamForUser();
    if (team) {
      console.log('Authentication successful via normal flow');
      return team;
    }

    console.log('Authentication failed - no team found');
    return null;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export async function GET() {
  try {
    log.info('GET /api/receipts - Starting request processing');
    
    // Enhanced authentication check
    const team = await getAuthenticatedTeam(new NextRequest('http://localhost'));
    if (!team) {
      log.error('GET /api/receipts - Authentication failed');
      return NextResponse.json({ 
        ok: false,
        error: 'Unauthorized - Please sign in again',
        details: 'Authentication failed - please refresh the page and try again'
      }, { status: 401 });
    }

    log.info('GET /api/receipts - Team found:', { teamId: team.id, teamName: team.name });



    const receipts = await getReceiptsForTeam(team.id);
    log.info('GET /api/receipts - Retrieved receipts:', { count: receipts.length, teamId: team.id });
    
    return NextResponse.json({ ok: true, data: receipts });
  } catch (error) {
    log.error('GET /api/receipts - Internal server error:', error);
    return NextResponse.json({ 
      ok: false,
      error: 'Internal server error',
      details: 'An unexpected error occurred while processing the request'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    log.info('POST /api/receipts - Starting request processing');
    
    // Enhanced authentication check
    const team = await getAuthenticatedTeam(request);
    if (!team) {
      log.error('POST /api/receipts - Authentication failed');
      return NextResponse.json({ 
        ok: false,
        error: 'Unauthorized - Please sign in again',
        details: 'Authentication failed - please refresh the page and try again'
      }, { status: 401 });
    }

    log.info('POST /api/receipts - Team found:', { teamId: team.id, teamName: team.name });

    // All users have unlimited access for testing
    const currentMonthlyUsage = await getCurrentMonthUsage(team.id);

    const body = await request.json();
    const validatedData = createReceiptSchema.parse(body);

    const receipt = await createReceipt({
      teamId: team.id,
      ...validatedData
    });
    
    log.info('POST /api/receipts - Created receipt:', { receiptId: receipt.id, teamId: team.id });
    
    // Increment monthly usage after successful creation
    await incrementMonthlyUsage(team.id);
    
    return NextResponse.json({ 
      ok: true, 
      data: receipt
    });
  } catch (error) {
    log.error('POST /api/receipts - Error creating receipt:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        ok: false,
        error: 'Validation error',
        details: 'Invalid receipt data provided',
        validationErrors: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({ 
      ok: false,
      error: 'Internal server error',
      details: 'An unexpected error occurred while creating the receipt'
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders
  });
} 