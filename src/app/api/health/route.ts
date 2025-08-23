import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const checks = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    status: 'healthy',
    services: {
      supabase: {
        configured: false,
        connected: false,
        error: null as string | null
      },
      environment: {
        supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        serviceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    }
  };

  // Check Supabase configuration
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    checks.services.supabase.configured = true;

    try {
      // Test database connection with a simple query
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);

      if (error) {
        checks.services.supabase.error = error.message;
        checks.status = 'degraded';
      } else {
        checks.services.supabase.connected = true;
      }
    } catch (err) {
      checks.services.supabase.error = err instanceof Error ? err.message : 'Unknown error';
      checks.status = 'degraded';
    }
  } else {
    checks.services.supabase.error = 'Supabase environment variables not configured';
    checks.status = 'degraded';
  }

  // Determine overall status
  const hasErrors = checks.services.supabase.error !== null;
  const isFullyConfigured = checks.services.supabase.configured && 
                           checks.services.environment.serviceRoleKey;

  if (hasErrors) {
    checks.status = 'unhealthy';
  } else if (!isFullyConfigured) {
    checks.status = 'degraded';
  }

  const statusCode = checks.status === 'healthy' ? 200 : 
                    checks.status === 'degraded' ? 207 : 503;

  return NextResponse.json(checks, { status: statusCode });
}
