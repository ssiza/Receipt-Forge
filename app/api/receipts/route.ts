import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabaseClient';
import { log } from '@/lib/logger';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Receipt schema - no team references
const createReceiptSchema = z.object({
  issueDate: z.string().transform(str => new Date(str)),
  customerName: z.string().min(1, 'Customer name is required'),
  customerEmail: z.string().email().optional().or(z.literal('')),
  customerPhone: z.string().optional().nullable(),
  customerAddress: z.string().optional().nullable(),
  items: z.array(z.record(z.any())),
  subtotal: z.number().min(0, 'Subtotal must be non-negative'),
  taxAmount: z.number().min(0, 'Tax amount must be non-negative').default(0),
  totalAmount: z.number().min(0, 'Total amount must be non-negative'),
  currency: z.string().default('USD'),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).default('draft'),
  notes: z.string().optional().nullable(),
  businessName: z.string().optional().nullable(),
  businessAddress: z.string().optional().nullable(),
  businessPhone: z.string().optional().nullable(),
  businessEmail: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  paymentTerms: z.string().optional().nullable(),
  reference: z.string().optional().nullable(),
  itemAdditionalFields: z.array(z.object({
    id: z.string(),
    name: z.string(),
    label: z.string(),
    type: z.string(),
  })).optional().nullable(),
});

// Helper function to handle API errors
function handleApiError(error: unknown, context: string) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  log.error(`[${context}] Error:`, errorMessage);
  
  if (error instanceof Error && 'code' in error) {
    log.error(`[${context}] Error code:`, (error as any).code);
  }
  
  return new NextResponse(
    JSON.stringify({
      error: 'Failed to process request',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
    }),
    { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  );
}

// GET /api/receipts - Get all receipts for the authenticated user
export async function GET(request: NextRequest) {
  try {
    log.info('GET /api/receipts - Starting request');
    
    const supabase = await createServerSupabaseClient();
    
    // Get current user from Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      log.error('Authentication failed:', authError);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401, headers: corsHeaders }
      );
    }

    log.info(`Fetching receipts for user: ${user.id}`);

    // Get user's receipts directly by user_id
    const { data: receipts, error: fetchError } = await supabase
      .from('receipts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      log.error('Database error:', fetchError);
      throw fetchError;
    }

    log.info(`Found ${receipts?.length || 0} receipts for user ${user.id}`);
    
    return NextResponse.json(
      { receipts: receipts || [] },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    return handleApiError(error, 'GET /api/receipts');
  }
}

// POST /api/receipts - Create a new receipt
export async function POST(request: NextRequest) {
  try {
    log.info('POST /api/receipts - Starting request');
    
    const body = await request.json();
    const validation = createReceiptSchema.safeParse(body);

    if (!validation.success) {
      log.error('Validation error:', validation.error.format());
      return NextResponse.json(
        { 
          error: 'Validation error', 
          details: validation.error.format() 
        },
        { status: 400, headers: corsHeaders }
      );
    }

    const receiptData = validation.data;
    const supabase = await createServerSupabaseClient();
    
    // Get current user from Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      log.error('Authentication failed:', authError);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401, headers: corsHeaders }
      );
    }

    log.info(`Creating receipt for user: ${user.id}`);

    // Generate a unique receipt number
    const receiptNumber = `RCPT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Helper function to safely convert dates to ISO strings
    const toISODateString = (date?: Date | string | null): string | null => {
      if (!date) return null;
      try {
        const d = date instanceof Date ? date : new Date(date);
        return isNaN(d.getTime()) ? null : d.toISOString();
      } catch {
        return null;
      }
    };

    // Prepare receipt data for database insertion
    const receiptInsertData = {
      user_id: user.id, // Directly use auth user ID
      receipt_number: receiptNumber,
      issue_date: toISODateString(receiptData.issueDate) || new Date().toISOString(),
      customer_name: receiptData.customerName,
      customer_email: receiptData.customerEmail || null,
      customer_phone: receiptData.customerPhone || null,
      customer_address: receiptData.customerAddress || null,
      items: receiptData.items || [],
      subtotal: receiptData.subtotal.toString(),
      tax_amount: (receiptData.taxAmount || 0).toString(),
      total_amount: receiptData.totalAmount.toString(),
      currency: receiptData.currency || 'USD',
      status: receiptData.status || 'draft',
      notes: receiptData.notes || null,
      business_name: receiptData.businessName || null,
      business_address: receiptData.businessAddress || null,
      business_phone: receiptData.businessPhone || null,
      business_email: receiptData.businessEmail || null,
      due_date: toISODateString(receiptData.dueDate),
      payment_terms: receiptData.paymentTerms || null,
      reference: receiptData.reference || null,
      item_additional_fields: receiptData.itemAdditionalFields || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // team_id is intentionally omitted to be NULL
    };

    log.info('Inserting receipt with data:', {
      user_id: receiptInsertData.user_id,
      customer_name: receiptInsertData.customer_name,
      total_amount: receiptInsertData.total_amount
    });

    // Create the receipt
    const { data: receipt, error: createError } = await supabase
      .from('receipts')
      .insert(receiptInsertData)
      .select()
      .single();
    
    if (createError) {
      log.error('Database error:', createError);
      throw createError;
    }
    
    log.info('Receipt created successfully:', { receipt_id: receipt?.id });

    return NextResponse.json(
      { receipt },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    return handleApiError(error, 'POST /api/receipts');
  }
}

// OPTIONS /api/receipts - Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders
  });
}