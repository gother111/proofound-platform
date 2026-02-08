import { redirect } from 'next/navigation';
import { requireAuth, getUserOrganizations } from '@/lib/auth';
import { db, conversations, assignments, organizations } from '@/db';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

function firstParam(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

function buildConversationQuery(conversationId?: string) {
  if (!conversationId) return '';
  return `?conversation=${encodeURIComponent(conversationId)}`;
}

/**
 * Persona-agnostic entrypoint for messaging.
 *
 * - Individuals land on /app/i/messages
 * - Org members land on /app/o/[slug]/messages
 *
 * Preserves ?conversation=<id> if present.
 */
export default async function AppMessagesRedirect({
  searchParams,
}: {
  // Next.js App Router provides searchParams as a Promise in server components.
  searchParams?: Promise<{ conversation?: string | string[] }>;
}) {
  const user = await requireAuth();
  const sp = searchParams ? await searchParams : undefined;
  const conversationId = firstParam(sp?.conversation);
  const query = buildConversationQuery(conversationId);

  if (user.persona !== 'org_member') {
    redirect(`/app/i/messages${query}`);
  }

  // Org member: try to derive org slug from the conversation's assignment, if provided.
  if (conversationId) {
    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
      columns: {
        assignmentId: true,
        participantOneId: true,
        participantTwoId: true,
      },
    });

    const isParticipant =
      conversation &&
      (conversation.participantOneId === user.id || conversation.participantTwoId === user.id);

    if (isParticipant && conversation?.assignmentId) {
      const assignment = await db.query.assignments.findFirst({
        where: eq(assignments.id, conversation.assignmentId),
        columns: { orgId: true },
      });

      if (assignment?.orgId) {
        const org = await db.query.organizations.findFirst({
          where: eq(organizations.id, assignment.orgId),
          columns: { slug: true },
        });

        if (org?.slug) {
          redirect(`/app/o/${org.slug}/messages${query}`);
        }
      }
    }
  }

  // Fallback: pick the first active org membership.
  const orgs = await getUserOrganizations(user.id);
  const slug = orgs[0]?.org.slug;
  if (slug) {
    redirect(`/app/o/${slug}/messages${query}`);
  }

  // Final fallback: send user to the individual messages page (will likely redirect if persona mismatch).
  redirect(`/app/i/messages${query}`);
}
