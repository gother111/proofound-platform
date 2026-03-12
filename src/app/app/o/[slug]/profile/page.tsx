import Link from 'next/link';
import { Globe2, ShieldCheck, Users } from 'lucide-react';
import { notFound } from 'next/navigation';

import { OrgTrustProfileEditor } from '@/components/organization/OrgTrustProfileEditor';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AppSurface } from '@/components/ui/v2/AppSurface';
import { getActiveOrg, requireAuth } from '@/lib/auth';
import { normalizeAuthorizedOrgRole } from '@/lib/authz';

export const dynamic = 'force-dynamic';

export default async function OrganizationProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await requireAuth();
  const { slug } = await params;
  const result = await getActiveOrg(slug, user.id);

  if (!result) {
    notFound();
  }

  const { org, membership } = result;
  const membershipRole = normalizeAuthorizedOrgRole(membership.role);
  const canEdit = membershipRole === 'org_owner' || membershipRole === 'org_manager';

  return (
    <AppSurface>
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <section className="grid gap-4 md:grid-cols-[2fr_1fr]">
          <Card className="border-black/[0.04] dark:border-white/5">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-2xl">Organization trust profile</CardTitle>
                  <CardDescription>
                    This is the launch-facing org profile used to support one assignment path and a
                    clean review queue.
                  </CardDescription>
                </div>
                <Badge variant={canEdit ? 'default' : 'secondary'}>
                  {canEdit ? 'Editable' : 'Review only'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Keep this page limited to the calm trust story that supports one clear assignment
                corridor. Culture hubs, governance showcases, and other org-suite surfaces stay
                outside the MVP.
              </p>
            </CardContent>
          </Card>

          <Card className="border-black/[0.04] dark:border-white/5">
            <CardHeader>
              <CardTitle className="text-lg">Launch corridor</CardTitle>
              <CardDescription>
                These are the only org surfaces that stay launch-binding.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-foreground/70" />
                <div>
                  <p className="font-medium text-foreground">Trust profile</p>
                  <p>Mission, why the work matters, working context, and hiring-process clarity.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="mt-0.5 h-4 w-4 text-foreground/70" />
                <div>
                  <p className="font-medium text-foreground">Assignments & matches</p>
                  <p>One assignment path and one review queue for published work and candidates.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Globe2 className="mt-0.5 h-4 w-4 text-foreground/70" />
                <div>
                  <p className="font-medium text-foreground">Public trust profile</p>
                  <p>
                    <Link
                      className="underline underline-offset-4"
                      href={`/app/o/${slug}/portfolio`}
                    >
                      View the public org page
                    </Link>{' '}
                    to confirm the launch story.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <OrgTrustProfileEditor
          org={{
            id: org.id,
            displayName: org.displayName,
            tagline: org.tagline,
            mission: org.mission,
            workingContext: org.workingContext ?? null,
            hiringProcessSummary: org.hiringProcessSummary ?? null,
            website: org.website,
          }}
          canEdit={canEdit}
        />
      </div>
    </AppSurface>
  );
}
