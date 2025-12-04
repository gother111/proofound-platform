import { notFound, redirect } from 'next/navigation';
import { requireAuth, getUserOrganizations } from '@/lib/auth';
import { AssignmentBuilder } from '@/components/matching/AssignmentBuilder';

export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{ slug: string }>;
}

export default async function NewAssignmentPage({ params }: PageProps) {
    const user = await requireAuth();
    const { slug } = await params;

    // Verify user has access to this organization
    const orgs = await getUserOrganizations(user.id);
    const org = orgs.find((o) => o.org.slug === slug);

    if (!org) {
        // Not a member of this org or org doesn't exist
        notFound();
    }

    // Verify permission (owner, admin, or member can create assignments)
    if (!['owner', 'admin', 'member'].includes(org.role)) {
        redirect(`/app/o/${slug}/home`);
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-['Crimson_Pro'] font-semibold text-proofound-charcoal dark:text-foreground mb-2">
                    Create New Assignment
                </h1>
                <p className="text-proofound-charcoal/70 dark:text-muted-foreground">
                    Define the role, requirements, and ideal candidate profile
                </p>
            </div>

            <AssignmentBuilder orgId={org.orgId} orgSlug={slug} />
        </div>
    );
}
