import { NextRequest, NextResponse } from 'next/server';
import { getCurrentMonthUsage, getUser, getUserWithTeam } from '@/lib/db/queries';
import { log } from '@/lib/logger';

async function getAuthenticatedTeam(request: NextRequest) {
  try {
    // Get user from Supabase Auth
    const user = await getUser();
    if (!user) {
      console.log('User not authenticated via Supabase');
      return null;
    }

    // Get user with team information
    const userWithTeam = await getUserWithTeam();
    if (!userWithTeam || !userWithTeam.teamId) {
      console.log('Team not found for authenticated user');
      return null;
    }

    console.log('User authenticated via Supabase:', user.email);
    return { id: userWithTeam.teamId };
  } catch (error) {
    console.error('Error in getAuthenticatedTeam:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    log.info('GET /api/usage - Starting request processing');
    
    // Get authenticated team
    const team = await getAuthenticatedTeam(request);
    if (!team) {
      log.error('GET /api/usage - Authentication failed');
      return NextResponse.json({ 
        ok: false,
        error: 'Unauthorized - Please sign in again',
        details: 'Authentication failed - please refresh the page and try again'
      }, { status: 401 });
    }

    // Get current monthly usage
    const currentUsage = await getCurrentMonthUsage(team.id);
    
    log.info('GET /api/usage - Retrieved usage for team:', { 
      teamId: team.id, 
      currentUsage 
    });
    
    return NextResponse.json({ 
      ok: true, 
      data: {
        currentUsage,
        teamId: team.id
      }
    });
  } catch (error) {
    log.error('GET /api/usage - Error retrieving usage:', error);
    
    return NextResponse.json({ 
      ok: false,
      error: 'Internal server error',
      details: 'An unexpected error occurred while retrieving usage data'
    }, { status: 500 });
  }
} 