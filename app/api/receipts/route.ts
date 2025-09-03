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

// Receipt schema without userId or teamId - these will be resolved from Supabase Auth
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

// GET /api/receipts - Get all receipts for the authenticated user
export async function GET(request: NextRequest) {
  try {
    log.info('GET /api/receipts - Starting request processing');
    
    const supabase = await createServerSupabaseClient();
    
    // Get current user from Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      log.error('Authentication failed:', authError);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401, headers: corsHeaders }
      );
    }

    log.info(`Getting receipts for user: ${user.id}`);

    // Get user profile from database
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (userError || !userProfile) {
      log.error('User profile not found:', userError);
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Get all receipts for this user
    const { data: receipts, error: receiptsError } = await supabase
      .from('receipts')
      .select('*')
      .eq('user_id', userProfile.id)
      .order('created_at', { ascending: false });
      
    if (receiptsError) {
      log.error('Error fetching receipts:', receiptsError);
      throw receiptsError;
    }
    
    log.info(`Found ${receipts?.length || 0} receipts for user: ${userProfile.id}`);

    return NextResponse.json(
      { receipts: receipts || [] },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    log.error('Error in GET /api/receipts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch receipts' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST /api/receipts - Create a new receipt
export async function POST(request: NextRequest) {
  try {
    log.info('POST /api/receipts - Starting request processing');
    
    const body = await request.json();
    const validation = createReceiptSchema.safeParse(body);

    if (!validation.success) {
      log.error('Validation error:', validation.error.format());
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.format() },
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
        { error: 'Authentication failed' },
        { status: 401, headers: corsHeaders }
      );
    }

    log.info(`Creating receipt for user: ${user.id}`);

    // Get user profile from database
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (userError || !userProfile) {
      log.error('User profile not found:', userError);
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Helper function to safely convert dates to ISO strings
    const toISODateString = (date?: Date | string | null): string | undefined => {
      if (!date) return undefined;
      try {
        return date instanceof Date ? date.toISOString() : new Date(date).toISOString();
      } catch (e) {
        return undefined;
      }
    };

    // Prepare receipt data for database insertion
    const receiptInsertData = {
      user_id: userProfile.id, // Use the user ID from the database, not from client
      status: receiptData.status || 'draft',
      issue_date: toISODateString(receiptData.issueDate) || new Date().toISOString(),
      customer_name: receiptData.customerName,
      customer_email: receiptData.customerEmail || null,
      customer_phone: receiptData.customerPhone || null,
      customer_address: receiptData.customerAddress || null,
      tax_amount: receiptData.taxAmount,
      total_amount: receiptData.totalAmount,
      currency: receiptData.currency,
      notes: receiptData.notes || null,
      business_name: receiptData.businessName || null,
      business_address: receiptData.businessAddress || null,
      business_phone: receiptData.businessPhone || null,
      business_email: receiptData.businessEmail || null,
      due_date: toISODateString(receiptData.dueDate) || null,
      payment_terms: receiptData.paymentTerms || null,
      reference: receiptData.reference || null,
      item_additional_fields: receiptData.itemAdditionalFields || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
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
      log.error('Error creating receipt:', createError);
      throw createError;
    }
    
    log.info('Receipt created successfully:', { receipt_id: receipt.id });

    return NextResponse.json(
      { receipt },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    log.error('Error in POST /api/receipts:', error);
    return NextResponse.json(
      { error: 'Failed to create receipt' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// OPTIONS /api/receipts - Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders
  });
}