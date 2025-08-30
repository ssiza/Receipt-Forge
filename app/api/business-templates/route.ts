import { NextRequest, NextResponse } from 'next/server';
import { getUser, getUserWithTeam, getBusinessTemplatesForTeam, createBusinessTemplate, updateBusinessTemplate, deleteBusinessTemplate } from '@/lib/db/queries';
import { log } from '@/lib/logger';
import { serializeError } from '@/lib/serializeError';

export async function GET(request: NextRequest) {
  try {
    log.info('GET /api/business-templates - Starting request processing');

    // Authenticate user and get team
    const user = await getUser();
    if (!user) {
      log.error('GET /api/business-templates - Authentication failed');
      return NextResponse.json({
        ok: false,
        error: 'Unauthorized - Please sign in again',
        details: 'Authentication failed - please refresh the page and try again'
      }, { status: 401 });
    }

    const userWithTeam = await getUserWithTeam();
    if (!userWithTeam || !userWithTeam.teamId) {
      log.error('GET /api/business-templates - Team not found');
      return NextResponse.json({
        ok: false,
        error: 'Team not found',
        details: 'Your team information could not be found'
      }, { status: 404 });
    }

    // Get business templates for the team
    const templates = await getBusinessTemplatesForTeam(userWithTeam.teamId);
    
    log.info(`GET /api/business-templates - Retrieved ${templates.length} templates for team ${userWithTeam.teamId}`);
    
    return NextResponse.json({
      ok: true,
      data: templates
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

    // Authenticate user and get team
    const user = await getUser();
    if (!user) {
      log.error('POST /api/business-templates - Authentication failed');
      return NextResponse.json({
        ok: false,
        error: 'Unauthorized - Please sign in again',
        details: 'Authentication failed - please refresh the page and try again'
      }, { status: 401 });
    }

    const userWithTeam = await getUserWithTeam();
    if (!userWithTeam || !userWithTeam.teamId) {
      log.error('POST /api/business-templates - Team not found');
      return NextResponse.json({
        ok: false,
        error: 'Team not found',
        details: 'Your team information could not be found'
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
    const template = await createBusinessTemplate({
      teamId: userWithTeam.teamId,
      name,
      description,
      isDefault: isDefault || false,
      lineItemFields,
      customFields: customFields || []
    });

    log.info(`POST /api/business-templates - Created template: ${template.name} for team ${userWithTeam.teamId}`);
    
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

    // Authenticate user and get team
    const user = await getUser();
    if (!user) {
      log.error('PUT /api/business-templates - Authentication failed');
      return NextResponse.json({
        ok: false,
        error: 'Unauthorized - Please sign in again',
        details: 'Authentication failed - please refresh the page and try again'
      }, { status: 401 });
    }

    const userWithTeam = await getUserWithTeam();
    if (!userWithTeam || !userWithTeam.teamId) {
      log.error('PUT /api/business-templates - Team not found');
      return NextResponse.json({
        ok: false,
        error: 'Team not found',
        details: 'Your team information could not be found'
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

    // Update the template
    const template = await updateBusinessTemplate(id, userWithTeam.teamId, {
      name,
      description,
      isDefault,
      lineItemFields,
      customFields: customFields || []
    });

    if (!template) {
      return NextResponse.json({
        ok: false,
        error: 'Template not found',
        details: 'The specified template could not be found'
      }, { status: 404 });
    }

    log.info(`PUT /api/business-templates - Updated template: ${template.name} for team ${userWithTeam.teamId}`);
    
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

    // Authenticate user and get team
    const user = await getUser();
    if (!user) {
      log.error('DELETE /api/business-templates - Authentication failed');
      return NextResponse.json({
        ok: false,
        error: 'Unauthorized - Please sign in again',
        details: 'Authentication failed - please refresh the page and try again'
      }, { status: 401 });
    }

    const userWithTeam = await getUserWithTeam();
    if (!userWithTeam || !userWithTeam.teamId) {
      log.error('DELETE /api/business-templates - Team not found');
      return NextResponse.json({
        ok: false,
        error: 'Team not found',
        details: 'Your team information could not be found'
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

    // Delete the template
    await deleteBusinessTemplate(id, userWithTeam.teamId);

    log.info(`DELETE /api/business-templates - Deleted template: ${id} for team ${userWithTeam.teamId}`);
    
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