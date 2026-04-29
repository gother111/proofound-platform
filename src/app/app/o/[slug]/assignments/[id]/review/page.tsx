import { cookies, headers } from 'next/headers';
import { AssignmentReviewClient } from '@/components/assignments/AssignmentReviewClient';

export const dynamic = 'force-dynamic';

async function fetchAssignmentServer(id: string, orgSlug: string) {
  // Build base URL for server-side fetch (works in dev/prod)
  const hdrs = await headers();
  const host = hdrs.get('host') || 'localhost:3000';
  const proto = hdrs.get('x-forwarded-proto') || 'http';
  const base = process.env.NEXT_PUBLIC_SITE_URL || `${proto}://${host}`;

  // Forward cookies for authenticated fetch
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  try {
    const res = await fetch(
      `${base}/api/assignments/${id}?orgSlug=${encodeURIComponent(orgSlug)}`,
      {
        cache: 'no-store',
        headers: cookieHeader ? { cookie: cookieHeader } : {},
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.assignment || null;
  } catch (error) {
    console.error('SSR fetch failed', error);
    return null;
  }
}

export default async function AssignmentReviewPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const assignment = await fetchAssignmentServer(id, slug);

  return <AssignmentReviewClient initialAssignment={assignment} assignmentId={id} slug={slug} />;
}
