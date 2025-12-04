import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPersona } from '@/lib/auth';
import { nanoid } from 'nanoid';
import { logContext, log } from '@/lib/log';
import { csrfProtection, getOrGenerateCSRFToken, setCSRFTokenCookie } from '@/lib/csrf';
import { logAPILatency } from '@/lib/monitoring/api-latency';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Generate or retrieve request ID for correlation
  const requestId = request.headers.get('x-request-id') || nanoid(12);

  // Create logging context
  const context = {
    requestId,
    path: pathname,
    method: request.method,
    userAgent: request.headers.get('user-agent') || undefined,
  };

  // CSRF protection for API routes (mutating methods only)
  if (pathname.startsWith('/api')) {
    const startTime = Date.now();

    const csrfError = csrfProtection(request);
    if (csrfError) {
      csrfError.headers.set('x-request-id', requestId);
      return csrfError;
    }

    // Ensure CSRF cookie is present for clients to read
    const csrfToken = getOrGenerateCSRFToken(request);
    const response = NextResponse.next();
    setCSRFTokenCookie(response, csrfToken);

    const duration = Date.now() - startTime;

    response.headers.set('x-request-id', requestId);
    response.headers.set('x-response-time', `${duration}ms`);

    // Log API latency for performance monitoring (Gap 2)
    // Don't await to avoid blocking response
    if (duration > 0) {
      logAPILatency({
        path: pathname,
        method: request.method,
        duration,
        status: response.status,
        requestId,
      }).catch((err) => console.error('Failed to log API latency:', err));
    }

    return response;
  }

  // Skip middleware for public routes and static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/verify-email') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/cookies') ||
    pathname === '/' ||
    pathname === '/403' ||
    pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js)$/)
  ) {
    const csrfToken = getOrGenerateCSRFToken(request);
    const response = NextResponse.next();
    response.headers.set('x-request-id', requestId);
    setCSRFTokenCookie(response, csrfToken);
    return response;
  }

  // Run middleware in logging context
  return logContext.run(context, async () => {
    // Check if user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      // Redirect unauthenticated users to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      const response = NextResponse.redirect(loginUrl);
      response.headers.set('x-request-id', requestId);
      return response;
    }

    // Add user ID to logging context
    const userContext = { ...context, userId: user.id };
    logContext.enterWith(userContext);

    // Admin route protection
    if (pathname.startsWith('/admin')) {
      // Check platform admin role
      const { data: profile } = await supabase
        .from('profiles')
        .select('platform_role')
        .eq('id', user.id)
        .maybeSingle();

      const isPlatformAdmin =
        profile?.platform_role === 'platform_admin' || profile?.platform_role === 'super_admin';

      if (!isPlatformAdmin) {
        log.warn('middleware.admin.access_denied', {
          userId: user.id,
          role: profile?.platform_role,
        });
        const response = NextResponse.redirect(new URL('/403', request.url));
        response.headers.set('x-request-id', requestId);
        return response;
      }

      // Allow admin access
      const response = NextResponse.next();
      response.headers.set('x-request-id', requestId);
      return response;
    }

    // Get user's persona
    const persona = await getPersona(user.id);

    // Handle persona-based route protection
    if (pathname.startsWith('/app/i/')) {
      // Individual routes - only allow individual users
      if (persona !== 'individual') {
        log.warn('middleware.persona.access_denied', {
          persona,
          route: 'individual',
        });

        if (persona === 'org_member') {
          // Redirect org members to their organization dashboard
          const { data: membership } = await supabase
            .from('organization_members')
            .select('org:organizations!inner(slug)')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .order('joined_at', { ascending: true })
            .limit(1)
            .maybeSingle();

          const orgData = membership?.org;
          const org = Array.isArray(orgData) ? orgData[0] : orgData;
          const slug = org?.slug;

          if (slug) {
            const response = NextResponse.redirect(new URL(`/app/o/${slug}/home`, request.url));
            response.headers.set('x-request-id', requestId);
            return response;
          }
        }

        // Redirect to onboarding for unknown persona or if no org found
        const response = NextResponse.redirect(new URL('/onboarding', request.url));
        response.headers.set('x-request-id', requestId);
        return response;
      }
    } else if (pathname.startsWith('/app/o/')) {
      // Organization routes - only allow org_member users
      if (persona !== 'org_member') {
        log.warn('middleware.persona.access_denied', {
          persona,
          route: 'organization',
        });

        if (persona === 'individual') {
          // Redirect individual users to their dashboard
          const response = NextResponse.redirect(new URL('/app/i/home', request.url));
          response.headers.set('x-request-id', requestId);
          return response;
        }

        // Redirect to onboarding for unknown persona
        const response = NextResponse.redirect(new URL('/onboarding', request.url));
        response.headers.set('x-request-id', requestId);
        return response;
      }

      // Additional check: verify user has access to the specific organization
      const slugMatch = pathname.match(/^\/app\/o\/([^\/]+)/);
      if (slugMatch) {
        const orgSlug = slugMatch[1];

        const { data: membership } = await supabase
          .from('organization_members')
          .select('org:organizations!inner(slug)')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .eq('organizations.slug', orgSlug)
          .maybeSingle();

        if (!membership) {
          log.warn('middleware.org.access_denied', {
            orgSlug,
          });

          // Redirect to their first available organization or onboarding
          const { data: firstMembership } = await supabase
            .from('organization_members')
            .select('org:organizations!inner(slug)')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .order('joined_at', { ascending: true })
            .limit(1)
            .maybeSingle();

          const orgData = firstMembership?.org;
          const org = Array.isArray(orgData) ? orgData[0] : orgData;
          const firstSlug = org?.slug;

          const redirectUrl = firstSlug ? `/app/o/${firstSlug}/home` : '/onboarding';
          const response = NextResponse.redirect(new URL(redirectUrl, request.url));
          response.headers.set('x-request-id', requestId);
          return response;
        }
      }
    }

    const csrfToken = getOrGenerateCSRFToken(request);
    const response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
    response.headers.set('x-request-id', requestId);
    setCSRFTokenCookie(response, csrfToken);
    return response;
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
