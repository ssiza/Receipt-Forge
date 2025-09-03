import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseClient';
import { z } from 'zod';
import { log } from '@/lib/logger';

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
    log.info(`GET /api/business-templates/[id] - Getting template: ${id}`);
    
    const supabase = await createServerSupabaseClient();
    
    // Get current user from Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      log.error('GET /api/business-templates/[id] - Authentication failed:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    log.info(`GET /api/business-templates/[id] - Getting template for user: ${user.id}`);

    // Get user profile from database
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (userError || !userProfile) {
      log.error('GET /api/business-templates/[id] - User profile not found:', userError);
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Get template by ID (only if it belongs to this user)
    const { data: template, error: templateError } = await supabase
      .from('business_templates')
      .select('*')
      .eq('id', id)
      .eq('user_id', userProfile.id)
      .single();

    if (templateError || !template) {
      log.error('GET /api/business-templates/[id] - Template not found:', templateError);
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    log.info(`GET /api/business-templates/[id] - Retrieved template: ${id} for user: ${userProfile.id}`);
    return NextResponse.json(template);
    
  } catch (error) {
    log.error('GET /api/business-templates/[id] - Error:', error);
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
    log.info(`PUT /api/business-templates/[id] - Updating template: ${id}`);
    
    const supabase = await createServerSupabaseClient();
    
    // Get current user from Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      log.error('PUT /api/business-templates/[id] - Authentication failed:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    log.info(`PUT /api/business-templates/[id] - Updating template for user: ${user.id}`);

    // Get user profile from database
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (userError || !userProfile) {
      log.error('PUT /api/business-templates/[id] - User profile not found:', userError);
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Check if template exists and belongs to this user
    const { data: existingTemplate, error: templateError } = await supabase
      .from('business_templates')
      .select('id')
      .eq('id', id)
      .eq('user_id', userProfile.id)
      .single();

    if (templateError || !existingTemplate) {
      log.error('PUT /api/business-templates/[id] - Template not found:', templateError);
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = updateTemplateSchema.parse(body);

    // Update the template
    const { data: updatedTemplate, error: updateError } = await supabase
      .from('business_templates')
      .update({
        ...validatedData,
        line_item_fields: validatedData.lineItemFields,
        custom_fields: validatedData.customFields,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userProfile.id)
      .select()
      .single();

    if (updateError) {
      log.error('PUT /api/business-templates/[id] - Error updating template:', updateError);
      throw updateError;
    }

    log.info(`PUT /api/business-templates/[id] - Updated template: ${id} for user: ${userProfile.id}`);
    return NextResponse.json(updatedTemplate);
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      log.error('PUT /api/business-templates/[id] - Validation error:', error.errors);
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 });
    }
    
    log.error('PUT /api/business-templates/[id] - Error:', error);
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
    log.info(`DELETE /api/business-templates/[id] - Deleting template: ${id}`);
    
    const supabase = await createServerSupabaseClient();
    
    // Get current user from Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      log.error('DELETE /api/business-templates/[id] - Authentication failed:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    log.info(`DELETE /api/business-templates/[id] - Deleting template for user: ${user.id}`);

    // Get user profile from database
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (userError || !userProfile) {
      log.error('DELETE /api/business-templates/[id] - User profile not found:', userError);
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Check if template exists and belongs to this user
    const { data: existingTemplate, error: templateError } = await supabase
      .from('business_templates')
      .select('id')
      .eq('id', id)
      .eq('user_id', userProfile.id)
      .single();

    if (templateError || !existingTemplate) {
      log.error('DELETE /api/business-templates/[id] - Template not found:', templateError);
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Delete the template
    const { error: deleteError } = await supabase
      .from('business_templates')
      .delete()
      .eq('id', id)
      .eq('user_id', userProfile.id);

    if (deleteError) {
      log.error('DELETE /api/business-templates/[id] - Error deleting template:', deleteError);
      throw deleteError;
    }

    log.info(`DELETE /api/business-templates/[id] - Deleted template: ${id} for user: ${userProfile.id}`);
    return NextResponse.json({ message: 'Template deleted successfully' });
    
  } catch (error) {
    log.error('DELETE /api/business-templates/[id] - Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 