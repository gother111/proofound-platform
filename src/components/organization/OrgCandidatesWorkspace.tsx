'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OrgMatchingPage from '@/app/app/o/[slug]/matching/page';
import { OrgCandidateInvitesPanel } from '@/components/organization/OrgCandidateInvitesPanel';

interface OrgCandidatesWorkspaceProps {
  orgId: string;
}

export function OrgCandidatesWorkspace({ orgId }: OrgCandidatesWorkspaceProps) {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="marketplace" className="space-y-4">
        <TabsList>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="invited-candidates">Invited candidates</TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace" className="space-y-4">
          <header className="px-1">
            <h1 className="text-2xl font-semibold text-primary-500">Candidates</h1>
            <p className="text-sm text-neutral-dark-600">
              Candidate discovery and assignment context share the same matching workspace for
              faster shortlisting.
            </p>
          </header>
          <OrgMatchingPage />
        </TabsContent>

        <TabsContent value="invited-candidates">
          <OrgCandidateInvitesPanel orgId={orgId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
