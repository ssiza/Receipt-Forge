import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseClient';
import { log } from '@/lib/logger';
import { z } from 'zod';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Schema for updating a receipt
const updateReceiptSchema = z.object({
  // Core receipt fields
  receipt_number: z.string().min(1, 'Receipt number is required').optional(),
  issue_date: z.string().datetime().optional(),
  customer_name: z.string().min(1, 'Customer name is required').optional(),
  customer_email: z.string().email().optional().nullable(),
  customer_phone: z.string().optional().nullable(),
  customer_address: z.string().optional().nullable(),
  
  // Items and amounts
  items: z.array(z.record(z.any())).optional(),
  subtotal: z.string().or(z.number()).transform(val => String(val)).optional(),
  tax_amount: z.string().or(z.number()).transform(val => String(val)).optional(),
  total_amount: z.string().or(z.number()).transform(val => String(val)).optional(),
  
  // Additional fields
  currency: z.string().default('USD').optional(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
  notes: z.string().optional().nullable(),
  business_name: z.string().optional().nullable(),
  business_address: z.string().optional().nullable(),
  business_phone: z.string().optional().nullable(),
  business_email: z.string().email().optional().nullable(),
  due_date: z.string().datetime().optional().nullable(),
  payment_terms: z.string().optional().nullable(),
  reference: z.string().optional().nullable(),
  item_additional_fields: z.record(z.any()).optional().nullable(),
  
  // Prevent updating these fields
  id: z.never().optional(),
  user_id: z.never().optional(),
  created_at: z.never().optional(),
  updated_at: z.never().optional(),
}).strict();

// Helper function to handle API errors
function handleApiError(error: unknown, context: string, status = 500) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  log.error(`[${context}] Error:`, errorMessage);
  
  if (error instanceof Error && 'code' in error) {
    log.error(`[${context}] Error code:`, (error as any).code);
  }
  
  return NextResponse.json(
    { 
      error: 'Failed to process request',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined 
    },
    { status, headers: corsHeaders }
  );
}

// GET /api/receipts/[id] - Get a specific receipt
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const receiptId = resolvedParams.id;
    log.info(`GET /api/receipts/${receiptId} - Starting request`);
    
    if (!receiptId) {
      return NextResponse.json(
        { error: 'Receipt ID is required' },
        { status: 400, headers: corsHeaders }
      );
    }
    
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

    log.info(`Fetching receipt ${receiptId} for user: ${user.id}`);

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

    // Get the receipt by ID and user_id
    const { data: receipt, error: fetchError } = await supabase
      .from('receipts')
      .select('*')
      .eq('id', receiptId)
      .eq('user_id', userProfile.id)
      .single();

    if (fetchError) {
      log.error('Database error:', fetchError);
      
      if (fetchError.code === 'PGRST116') { // No rows returned
        return NextResponse.json(
          { error: 'Receipt not found' },
          { status: 404, headers: corsHeaders }
        );
      }
      
      throw fetchError;
    }

    if (!receipt) {
      log.error(`Receipt ${receiptId} not found for user ${userProfile.id}`);
      return NextResponse.json(
        { error: 'Receipt not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    log.info(`Found receipt ${receiptId} for user ${userProfile.id}`);
    
    return NextResponse.json(
      { receipt },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    return handleApiError(error, 'GET /api/receipts/[id]');
  }
}

// PUT /api/receipts/[id] - Update a receipt
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const receiptId = resolvedParams.id;
    log.info(`PUT /api/receipts/${receiptId} - Starting request`);
    
    if (!receiptId) {
      return NextResponse.json(
        { error: 'Receipt ID is required' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    const body = await request.json();
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

    log.info(`Updating receipt ${receiptId} for user: ${user.id}`);

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

    // Prepare update data - ensure we don't update user_id
    const { user_id, id, created_at, ...updateData } = body;
    updateData.updated_at = new Date().toISOString();

    // Update the receipt and verify ownership in a single query
    const { data: receipt, error: updateError } = await supabase
      .from('receipts')
      .update(updateData)
      .eq('id', receiptId)
      .eq('user_id', userProfile.id) // Ensures the receipt belongs to the user
      .select()
      .single();

    if (updateError) {
      log.error('Database error:', updateError);
      
      if (updateError.code === 'PGRST116') { // No rows returned
        return NextResponse.json(
          { error: 'Receipt not found' },
          { status: 404, headers: corsHeaders }
        );
      }
      
      throw updateError;
    }

    log.info(`Receipt ${receiptId} updated successfully`);
    
    return NextResponse.json(
      { receipt },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    return handleApiError(error, 'PUT /api/receipts/[id]');
  }
}

// DELETE /api/receipts/[id] - Delete a receipt
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const receiptId = resolvedParams.id;
    log.info(`DELETE /api/receipts/${receiptId} - Starting request`);
    
    if (!receiptId) {
      return NextResponse.json(
        { error: 'Receipt ID is required' },
        { status: 400, headers: corsHeaders }
      );
    }
    
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

    log.info(`Deleting receipt ${receiptId} for user: ${user.id}`);

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

    // Delete the receipt and verify ownership in a single query
    const { data: receipt, error: deleteError } = await supabase
      .from('receipts')
      .delete()
      .eq('id', receiptId)
      .eq('user_id', userProfile.id) // Ensures the receipt belongs to the user
      .select()
      .single();

    if (deleteError) {
      log.error('Database error:', deleteError);
      
      if (deleteError.code === 'PGRST116') { // No rows returned
        return NextResponse.json(
          { error: 'Receipt not found' },
          { status: 404, headers: corsHeaders }
        );
      }
      
      throw deleteError;
    }

    if (!receipt) {
      log.error(`Receipt ${receiptId} not found for user ${userProfile.id}`);
      return NextResponse.json(
        { error: 'Receipt not found or already deleted' },
        { status: 404, headers: corsHeaders }
      );
    }

    log.info(`Receipt ${receiptId} deleted successfully`);
    
    return new NextResponse(null, {
      status: 204, // No Content
      headers: corsHeaders
    });
  } catch (error) {
    return handleApiError(error, 'DELETE /api/receipts/[id]');
  }
}

// OPTIONS /api/receipts/[id] - Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders
  });
}