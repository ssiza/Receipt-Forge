import { NextRequest, NextResponse } from 'next/server';
import { getUser, getUserWithTeam, getReceiptById, updateReceipt, deleteReceipt } from '@/lib/db/queries';

import { z } from 'zod';

const updateReceiptSchema = z.object({
  issueDate: z.string().transform(str => new Date(str)).optional(),
  customerName: z.string().min(1, 'Customer name is required').optional(),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().nullable().optional(),
  customerAddress: z.string().nullable().optional(),
  items: z.array(z.record(z.any())).optional(), // Allow dynamic fields in items
  subtotal: z.number().min(0, 'Subtotal must be non-negative').optional(),
  taxAmount: z.number().min(0, 'Tax amount must be non-negative').optional(),
  totalAmount: z.number().min(0, 'Total amount must be non-negative').optional(),
  currency: z.string().optional(),
  status: z.string().optional(),
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  
  try {
    // Validate receipt ID
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ 
        ok: false,
        error: 'Invalid receipt ID',
        details: 'Receipt ID must be a valid string'
      }, { status: 400 });
    }

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ 
        ok: false,
        error: 'Unauthorized',
        details: 'Please sign in to access this receipt'
      }, { status: 401 });
    }

    const userWithTeam = await getUserWithTeam();
    if (!userWithTeam || !userWithTeam.teamId) {
      return NextResponse.json({ 
        ok: false,
        error: 'Team not found',
        details: 'Your team information could not be found'
      }, { status: 404 });
    }



    const receipt = await getReceiptById(id, userWithTeam.teamId);
    if (!receipt) {
      return NextResponse.json({ 
        ok: false,
        error: 'Receipt not found',
        details: `Receipt with ID ${id} could not be found or you don't have permission to access it`
      }, { status: 404 });
    }

    return NextResponse.json({ 
      ok: true,
      data: receipt
    });
  } catch (error) {
    console.error('Error fetching receipt:', error);
    return NextResponse.json({ 
      ok: false,
      error: 'Internal server error',
      details: 'An unexpected error occurred while fetching the receipt'
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  
  try {
    // Validate receipt ID
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ 
        ok: false,
        error: 'Invalid receipt ID',
        details: 'Receipt ID must be a valid string'
      }, { status: 400 });
    }

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ 
        ok: false,
        error: 'Unauthorized',
        details: 'Please sign in to update this receipt'
      }, { status: 401 });
    }

    const userWithTeam = await getUserWithTeam();
    if (!userWithTeam || !userWithTeam.teamId) {
      return NextResponse.json({ 
        ok: false,
        error: 'Team not found',
        details: 'Your team information could not be found'
      }, { status: 404 });
    }



    const receipt = await getReceiptById(id, userWithTeam.teamId);
    if (!receipt) {
      return NextResponse.json({ 
        ok: false,
        error: 'Receipt not found',
        details: `Receipt with ID ${id} could not be found or you don't have permission to update it`
      }, { status: 404 });
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json({ 
        ok: false,
        error: 'Invalid request body',
        details: 'Request body must be valid JSON'
      }, { status: 400 });
    }

    const validatedData = updateReceiptSchema.parse(body);

    // Transform date if provided
    const updateData: any = { ...validatedData };
    if (validatedData.issueDate) {
      updateData.issueDate = validatedData.issueDate.toISOString().split('T')[0];
    }

    // Transform numeric fields if provided
    if (validatedData.subtotal !== undefined) {
      updateData.subtotal = validatedData.subtotal.toString();
    }
    if (validatedData.taxAmount !== undefined) {
      updateData.taxAmount = validatedData.taxAmount.toString();
    }
    if (validatedData.totalAmount !== undefined) {
      updateData.totalAmount = validatedData.totalAmount.toString();
    }

    const updatedReceipt = await updateReceipt(id, userWithTeam.teamId, updateData);
    return NextResponse.json({ 
      ok: true,
      data: updatedReceipt
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        ok: false,
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 });
    }
    
    console.error('Error updating receipt:', error);
    return NextResponse.json({ 
      ok: false,
      error: 'Internal server error',
      details: 'An unexpected error occurred while updating the receipt'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  
  try {
    // Validate receipt ID
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ 
        ok: false,
        error: 'Invalid receipt ID',
        details: 'Receipt ID must be a valid string'
      }, { status: 400 });
    }

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ 
        ok: false,
        error: 'Unauthorized',
        details: 'Please sign in to delete this receipt'
      }, { status: 401 });
    }

    const userWithTeam = await getUserWithTeam();
    if (!userWithTeam || !userWithTeam.teamId) {
      return NextResponse.json({ 
        ok: false,
        error: 'Team not found',
        details: 'Your team information could not be found'
      }, { status: 404 });
    }



    const receipt = await getReceiptById(id, userWithTeam.teamId);
    if (!receipt) {
      return NextResponse.json({ 
        ok: false,
        error: 'Receipt not found',
        details: `Receipt with ID ${id} could not be found or you don't have permission to delete it`
      }, { status: 404 });
    }

    await deleteReceipt(id, userWithTeam.teamId);
    return NextResponse.json({ 
      ok: true,
      message: 'Receipt deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting receipt:', error);
    return NextResponse.json({ 
      ok: false,
      error: 'Internal server error',
      details: 'An unexpected error occurred while deleting the receipt'
    }, { status: 500 });
  }
} 