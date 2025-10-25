import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPersona } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public routes, API routes, and static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/verify-email') ||
    pathname.startsWith('/onboarding') ||
    pathname === '/' ||
    pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js)$/)
  ) {
    return NextResponse.next();
  }

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
    return NextResponse.redirect(loginUrl);
  }

  // Get user's persona
  const persona = await getPersona(user.id);

  // Handle persona-based route protection
  if (pathname.startsWith('/app/i/')) {
    // Individual routes - only allow individual users
    if (persona !== 'individual') {
      console.log(`Blocking ${persona} user from accessing individual route: ${pathname}`);

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
          return NextResponse.redirect(new URL(`/app/o/${slug}/home`, request.url));
        }
      }

      // Redirect to onboarding for unknown persona or if no org found
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
  } else if (pathname.startsWith('/app/o/')) {
    // Organization routes - only allow org_member users
    if (persona !== 'org_member') {
      console.log(`Blocking ${persona} user from accessing organization route: ${pathname}`);

      if (persona === 'individual') {
        // Redirect individual users to their dashboard
        return NextResponse.redirect(new URL('/app/i/home', request.url));
      }

      // Redirect to onboarding for unknown persona
      return NextResponse.redirect(new URL('/onboarding', request.url));
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
        console.log(`User ${user.id} does not have access to organization: ${orgSlug}`);

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

        if (firstSlug) {
          return NextResponse.redirect(new URL(`/app/o/${firstSlug}/home`, request.url));
        } else {
          return NextResponse.redirect(new URL('/onboarding', request.url));
        }
      }
    }
  }

  return NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
