import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    log.info('GET /api/health - Health check request');

    // Check environment variables
    const envChecks = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      POSTGRES_URL: !!process.env.POSTGRES_URL,
      NODE_ENV: process.env.NODE_ENV || 'development'
    };

    const allEnvVarsPresent = Object.values(envChecks).every(Boolean);

    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      environmentVariables: envChecks,
      allEnvironmentVariablesPresent: allEnvVarsPresent
    };

    if (!allEnvVarsPresent) {
      healthStatus.status = 'warning';
      log.warn('Health check: Some environment variables are missing', envChecks);
    }

    return NextResponse.json(healthStatus);

  } catch (error) {
    log.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      },
      { status: 500 }
    );
  }
}
