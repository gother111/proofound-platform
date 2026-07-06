'use client';

import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShareProfileDialog } from '@/components/profile/ShareProfileDialog';

interface OrganizationShareControlProps {
  orgId: string;
  organizationName: string;
  organizationTagline?: string | null;
}

export function OrganizationShareControl({
  orgId,
  organizationName,
  organizationTagline,
}: OrganizationShareControlProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="gap-2 border-proofound-forest/30 text-proofound-forest hover:bg-proofound-forest/5"
      >
        <Share2 className="h-4 w-4" />
        Share Organization Trust Page
      </Button>

      <ShareProfileDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        userName={organizationName}
        userHeadline={organizationTagline || undefined}
        profileType="organization"
        orgId={orgId}
        publicPagePath={`/portfolio/org/${encodeURIComponent(orgId)}`}
      />
    </>
  );
}
