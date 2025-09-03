import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseClient';
import { log } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    log.info('GET /api/business-templates - Starting request processing');

    const supabase = await createServerSupabaseClient();
    
    // Get current user from Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      log.error('GET /api/business-templates - Authentication failed:', authError);
      return NextResponse.json({
        ok: false,
        error: 'Unauthorized - Please sign in again',
        details: 'Authentication failed - please refresh the page and try again'
      }, { status: 401 });
    }

    log.info(`GET /api/business-templates - Getting templates for user: ${user.id}`);

    // Get user profile from database
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (userError || !userProfile) {
      log.error('GET /api/business-templates - User profile not found:', userError);
      return NextResponse.json({
        ok: false,
        error: 'User profile not found',
        details: 'Your user profile could not be found'
      }, { status: 404 });
    }

    // Get business templates for this user
    const { data: templates, error: templatesError } = await supabase
      .from('business_templates')
      .select('*')
      .eq('user_id', userProfile.id)
      .order('created_at', { ascending: false });
      
    if (templatesError) {
      log.error('GET /api/business-templates - Error fetching templates:', templatesError);
      throw templatesError;
    }
    
    log.info(`GET /api/business-templates - Retrieved ${templates?.length || 0} templates for user: ${userProfile.id}`);
    
    return NextResponse.json({
      ok: true,
      data: templates || []
    });

  } catch (error) {
    log.error('GET /api/business-templates - Error retrieving templates:', error);
    
    return NextResponse.json({
      ok: false,
      error: 'Failed to retrieve business templates',
      details: 'An error occurred while retrieving business templates',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    log.info('POST /api/business-templates - Starting request processing');

    const supabase = await createServerSupabaseClient();
    
    // Get current user from Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      log.error('POST /api/business-templates - Authentication failed:', authError);
      return NextResponse.json({
        ok: false,
        error: 'Unauthorized - Please sign in again',
        details: 'Authentication failed - please refresh the page and try again'
      }, { status: 401 });
    }

    log.info(`POST /api/business-templates - Creating template for user: ${user.id}`);

    // Get user profile from database
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (userError || !userProfile) {
      log.error('POST /api/business-templates - User profile not found:', userError);
      return NextResponse.json({
        ok: false,
        error: 'User profile not found',
        details: 'Your user profile could not be found'
      }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, isDefault, lineItemFields, customFields } = body;

    // Validate required fields
    if (!name || !lineItemFields || !Array.isArray(lineItemFields)) {
      return NextResponse.json({
        ok: false,
        error: 'Invalid template data',
        details: 'Name and lineItemFields are required'
      }, { status: 400 });
    }

    // Create the template
    const { data: template, error: createError } = await supabase
      .from('business_templates')
      .insert({
        user_id: userProfile.id,
        name,
        description,
        is_default: isDefault || false,
        line_item_fields: lineItemFields,
        custom_fields: customFields || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      log.error('POST /api/business-templates - Error creating template:', createError);
      throw createError;
    }

    log.info(`POST /api/business-templates - Created template: ${template.name} for user: ${userProfile.id}`);
    
    return NextResponse.json({
      ok: true,
      data: template
    });

  } catch (error) {
    log.error('POST /api/business-templates - Error creating template:', error);
    
    return NextResponse.json({
      ok: false,
      error: 'Failed to create business template',
      details: 'An error occurred while creating the business template',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    log.info('PUT /api/business-templates - Starting request processing');

    const supabase = await createServerSupabaseClient();
    
    // Get current user from Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      log.error('PUT /api/business-templates - Authentication failed:', authError);
      return NextResponse.json({
        ok: false,
        error: 'Unauthorized - Please sign in again',
        details: 'Authentication failed - please refresh the page and try again'
      }, { status: 401 });
    }

    log.info(`PUT /api/business-templates - Updating template for user: ${user.id}`);

    // Get user profile from database
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (userError || !userProfile) {
      log.error('PUT /api/business-templates - User profile not found:', userError);
      return NextResponse.json({
        ok: false,
        error: 'User profile not found',
        details: 'Your user profile could not be found'
      }, { status: 404 });
    }

    const body = await request.json();
    const { id, name, description, isDefault, lineItemFields, customFields } = body;

    // Validate required fields
    if (!id || !name || !lineItemFields || !Array.isArray(lineItemFields)) {
      return NextResponse.json({
        ok: false,
        error: 'Invalid template data',
        details: 'ID, name and lineItemFields are required'
      }, { status: 400 });
    }

    // Update the template (only if it belongs to this user)
    const { data: template, error: updateError } = await supabase
      .from('business_templates')
      .update({
        name,
        description,
        is_default: isDefault,
        line_item_fields: lineItemFields,
        custom_fields: customFields || [],
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userProfile.id)
      .select()
      .single();

    if (updateError) {
      log.error('PUT /api/business-templates - Error updating template:', updateError);
      throw updateError;
    }

    if (!template) {
      return NextResponse.json({
        ok: false,
        error: 'Template not found',
        details: 'The specified template could not be found or you do not have permission to edit it'
      }, { status: 404 });
    }

    log.info(`PUT /api/business-templates - Updated template: ${template.name} for user: ${userProfile.id}`);
    
    return NextResponse.json({
      ok: true,
      data: template
    });

  } catch (error) {
    log.error('PUT /api/business-templates - Error updating template:', error);
    
    return NextResponse.json({
      ok: false,
      error: 'Failed to update business template',
      details: 'An error occurred while updating the business template',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    log.info('DELETE /api/business-templates - Starting request processing');

    const supabase = await createServerSupabaseClient();
    
    // Get current user from Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      log.error('DELETE /api/business-templates - Authentication failed:', authError);
      return NextResponse.json({
        ok: false,
        error: 'Unauthorized - Please sign in again',
        details: 'Authentication failed - please refresh the page and try again'
      }, { status: 401 });
    }

    log.info(`DELETE /api/business-templates - Deleting template for user: ${user.id}`);

    // Get user profile from database
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (userError || !userProfile) {
      log.error('DELETE /api/business-templates - User profile not found:', userError);
      return NextResponse.json({
        ok: false,
        error: 'User profile not found',
        details: 'Your user profile could not be found'
      }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        ok: false,
        error: 'Template ID required',
        details: 'Please provide a template ID to delete'
      }, { status: 400 });
    }

    // Delete the template (only if it belongs to this user)
    const { error: deleteError } = await supabase
      .from('business_templates')
      .delete()
      .eq('id', id)
      .eq('user_id', userProfile.id);

    if (deleteError) {
      log.error('DELETE /api/business-templates - Error deleting template:', deleteError);
      throw deleteError;
    }

    log.info(`DELETE /api/business-templates - Deleted template: ${id} for user: ${userProfile.id}`);
    
    return NextResponse.json({
      ok: true,
      message: 'Template deleted successfully'
    });

  } catch (error) {
    log.error('DELETE /api/business-templates - Error deleting template:', error);
    
    return NextResponse.json({
      ok: false,
      error: 'Failed to delete business template',
      details: 'An error occurred while deleting the business template',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
} 