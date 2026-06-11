import Link from 'next/link';
import { AlertCircle, CheckCircle2, Globe2, ShieldCheck, Users } from 'lucide-react';
import { notFound } from 'next/navigation';

import { OrgTrustProfileEditor } from '@/components/organization/OrgTrustProfileEditor';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { AppSurface } from '@/components/ui/v2/AppSurface';
import { getActiveOrg, requireAuth } from '@/lib/auth';
import { getVerifiedOrganizationDomainPath } from '@/lib/organizations/trust-profile';

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
  const canEdit = membership.role === 'org_owner' || membership.role === 'org_manager';
  const verifiedDomainPath = getVerifiedOrganizationDomainPath({
    website: org.website,
    websiteVerifiedAt: org.websiteVerifiedAt ?? null,
    trustStatus: org.trustStatus ?? null,
    verified: org.verified,
  });
  const trustItems = [
    {
      label: 'Organization name',
      detail: org.displayName || 'Missing',
      ready: Boolean(org.displayName),
    },
    {
      label: 'Why work matters',
      detail: org.tagline || 'Add a short reason this work matters.',
      ready: Boolean(org.tagline),
    },
    {
      label: 'Mission',
      detail: org.mission || 'Add the mission this assignment path supports.',
      ready: Boolean(org.mission),
    },
    {
      label: 'Domain path',
      detail: verifiedDomainPath ?? 'Needs verified domain signal.',
      ready: Boolean(verifiedDomainPath),
    },
  ];
  const readyTrustCount = trustItems.filter((item) => item.ready).length;

  return (
    <AppSurface>
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <section className="grid items-start gap-4 md:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
          <Card className="border-black/[0.04] dark:border-white/5">
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h1 className="font-display text-2xl font-semibold leading-none tracking-tight text-proofound-charcoal">
                    Organization Trust Page
                  </h1>
                  <CardDescription className="max-w-2xl leading-6">
                    This is the launch-facing organization trust page used to support one assignment
                    path and a clean review queue.
                  </CardDescription>
                </div>
                <Badge variant={canEdit ? 'default' : 'secondary'}>
                  {canEdit ? 'Editable' : 'Review only'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 text-sm text-muted-foreground">
              <p className="max-w-3xl leading-6">
                Keep this page limited to the calm organization story that supports one clear
                assignment corridor. Culture hubs, governance showcases, and other org-suite
                surfaces stay outside this launch path.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {trustItems.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-proofound-stone/70 bg-white/55 p-3"
                  >
                    <div className="flex items-center gap-2">
                      {item.ready ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-amber-600" aria-hidden="true" />
                      )}
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                      {item.detail}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-black/[0.04] dark:border-white/5">
            <CardHeader>
              <h2 className="font-display text-lg font-semibold leading-none tracking-tight text-proofound-charcoal">
                Launch corridor
              </h2>
              <CardDescription>Trust basics ready: {readyTrustCount}/4</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-foreground/70" />
                <div>
                  <p className="font-medium text-foreground">Organization trust page</p>
                  <p>Mission, why the work matters, verified domain path, and operating context.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="mt-0.5 h-4 w-4 text-foreground/70" />
                <div>
                  <p className="font-medium text-foreground">Assignments & matches</p>
                  <p>
                    One assignment path and one review queue for published work and submissions.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Globe2 className="mt-0.5 h-4 w-4 text-foreground/70" />
                <div>
                  <p className="font-medium text-foreground">Public preview</p>
                  <p>
                    <Link
                      className="-mx-1 inline-flex min-h-8 items-center rounded-md px-1 font-medium text-proofound-forest underline underline-offset-4 transition-colors hover:bg-proofound-forest/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:ring-offset-2"
                      href={`/app/o/${slug}/portfolio`}
                    >
                      View the public organization page
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
            whyWorkMatters: org.tagline,
            mission: org.mission,
            operatingContext: org.workingContext ?? null,
            website: org.website,
          }}
          canEdit={canEdit}
        />
      </div>
    </AppSurface>
  );
}
