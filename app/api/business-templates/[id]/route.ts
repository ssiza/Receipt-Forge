import { NextRequest, NextResponse } from 'next/server';
import { getUser, getTeamForUser, getBusinessTemplateById, updateBusinessTemplate, deleteBusinessTemplate } from '@/lib/db/queries';
import { z } from 'zod';

const updateTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').optional(),
  description: z.string().optional(),
  isDefault: z.boolean().optional(),
  lineItemFields: z.array(z.any()).optional(),
  customFields: z.array(z.any()).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const template = await getBusinessTemplateById(id, team.id);
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error fetching business template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const template = await getBusinessTemplateById(id, team.id);
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = updateTemplateSchema.parse(body);

    const updatedTemplate = await updateBusinessTemplate(id, team.id, validatedData);
    return NextResponse.json(updatedTemplate);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 });
    }
    
    console.error('Error updating business template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const template = await getBusinessTemplateById(id, team.id);
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    await deleteBusinessTemplate(id, team.id);
    return NextResponse.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting business template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 