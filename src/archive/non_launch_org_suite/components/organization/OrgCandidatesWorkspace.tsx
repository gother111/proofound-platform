'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DeferredOrgMatchingClient } from '@/app/app/o/[slug]/matching/DeferredOrgMatchingClient';
import { OrgCandidateInvitesPanel } from './OrgCandidateInvitesPanel';
import { AppSurface } from '@/components/ui/v2/AppSurface';

interface OrgCandidatesWorkspaceProps {
  orgId: string;
}

export function OrgCandidatesWorkspace({ orgId }: OrgCandidatesWorkspaceProps) {
  return (
    <AppSurface>
      <div className="space-y-4">
        <Tabs defaultValue="candidate-review" className="space-y-4">
          <TabsList>
            <TabsTrigger value="candidate-review">Candidate review</TabsTrigger>
            <TabsTrigger value="invited-candidates">Invited candidates</TabsTrigger>
          </TabsList>

          <TabsContent value="candidate-review" className="space-y-4">
            <header className="px-1">
              <h1 className="text-2xl font-semibold text-primary-500">Candidates</h1>
              <p className="text-sm text-neutral-dark-600">
                Assignment review and candidate context stay in one privacy-safe workspace for
                faster shortlisting.
              </p>
            </header>
            <DeferredOrgMatchingClient />
          </TabsContent>

          <TabsContent value="invited-candidates">
            <OrgCandidateInvitesPanel orgId={orgId} />
          </TabsContent>
        </Tabs>
      </div>
    </AppSurface>
  );
}
