'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Building2, CheckCircle2, Mail } from 'lucide-react';
import { AppSurface } from '@/components/ui/v2/AppSurface';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type VisualOrgInvite = {
  organization: {
    slug: string;
    displayName: string;
    mission?: string | null;
  };
  role: string;
  email: string;
  workspaceHref: string;
};

export function AcceptInviteVisualClient({ invite }: { invite: VisualOrgInvite }) {
  const [accepted, setAccepted] = useState(false);

  return (
    <AppSurface>
      <div className="flex min-h-[calc(100vh-8rem)] w-full items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md rounded-[24px] border-proofound-stone bg-white/90 shadow-[0_4px_24px_rgba(29,51,48,0.08)]">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-proofound-forest/10">
              {accepted ? (
                <CheckCircle2 className="h-5 w-5 text-proofound-forest" />
              ) : (
                <Mail className="h-5 w-5 text-proofound-forest" />
              )}
            </div>
            <CardTitle className="font-display text-2xl text-proofound-charcoal">
              {accepted ? 'Invitation accepted' : "You're invited"}
            </CardTitle>
            <CardDescription className="leading-6 text-proofound-charcoal/70">
              {accepted
                ? `You can now continue to ${invite.organization.displayName}.`
                : 'Review the organization and role before joining.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-4 rounded-lg bg-proofound-parchment/60 p-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-proofound-forest/10">
                <Building2 className="h-5 w-5 text-proofound-forest" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="break-words font-semibold text-neutral-dark-700">
                  {invite.organization.displayName}
                </p>
                {invite.organization.mission ? (
                  <p className="mt-1 text-sm leading-6 text-neutral-dark-600">
                    {invite.organization.mission}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-proofound-stone/80 bg-white/70 p-4">
              <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                <span className="text-neutral-dark-600">Your role</span>
                <span className="break-words font-medium capitalize text-neutral-dark-700">
                  {invite.role}
                </span>
              </div>
              <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                <span className="text-neutral-dark-600">Invited email</span>
                <span className="break-all font-medium text-neutral-dark-700">{invite.email}</span>
              </div>
            </div>

            {accepted ? (
              <div className="space-y-4">
                <p
                  className="rounded-xl border border-[#D7E8DE] bg-[#F3FAF6] p-4 text-sm leading-6 text-proofound-forest"
                  role="status"
                >
                  You have joined this organization. Your workspace is ready.
                </p>
                <Button
                  asChild
                  className="w-full bg-proofound-forest text-white hover:bg-proofound-forest/90"
                  size="lg"
                >
                  <Link href={invite.workspaceHref}>Open organization workspace</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Button
                  type="button"
                  className="w-full bg-proofound-forest text-white hover:bg-proofound-forest/90"
                  size="lg"
                  onClick={() => setAccepted(true)}
                >
                  Accept invitation
                </Button>
                <p className="text-center text-xs leading-5 text-neutral-dark-500">
                  By accepting, you become a member of this organization.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppSurface>
  );
}
