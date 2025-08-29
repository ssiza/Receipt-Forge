import { NextRequest, NextResponse } from 'next/server';
import { getCurrentMonthUsage, getTeamForUser } from '@/lib/db/queries';
import { log } from '@/lib/logger';

async function getAuthenticatedTeam(request: NextRequest) {
  try {
    // First try the new token-based auth
    const authToken = request.headers.get('authorization')?.replace('Bearer ', '');
    if (authToken) {
      const { verifyAuthToken } = await import('@/lib/auth/token-auth');
      const tokenPayload = await verifyAuthToken(authToken);
      if (tokenPayload && tokenPayload.exp > Math.floor(Date.now() / 1000)) {
        const { getUserWithTeam } = await import('@/lib/db/queries');
        const userWithTeam = await getUserWithTeam(tokenPayload.userId);
        if (userWithTeam?.teamId) {
          const { getTeamForUser } = await import('@/lib/db/queries');
          const team = await getTeamForUser();
          if (team) {
            console.log('User authenticated via token:', userWithTeam.user.email);
            return team;
          }
        }
      }
    }

    // Fallback to session-based auth
    const team = await getTeamForUser();
    if (team) {
      console.log('User authenticated via session');
      return team;
    }

    return null;
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