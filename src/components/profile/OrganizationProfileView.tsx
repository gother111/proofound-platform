'use client';

import { useState } from 'react';
import { OrganizationHero } from '@/components/organization/OrganizationHero';
import { OrganizationPurpose } from '@/components/organization/OrganizationPurpose';
import { OrganizationBasicInfoEditor } from '@/components/organization/OrganizationBasicInfoEditor';
import { StructureManagerClient } from '@/components/organization/StructureManagerClient';
import { CultureEditor } from '@/components/organization/CultureEditor';
import { OrganizationCausesEditor } from '@/components/organization/OrganizationCausesEditor';
import { ImpactDashboard } from '@/components/organization/ImpactDashboard';
import { PartnershipsManager } from '@/components/organization/PartnershipsManager';
import { GoalsManager } from '@/components/organization/GoalsManager';
import { OrganizationVisibilitySettings } from '@/components/organization/OrganizationVisibilitySettings';
import { OrganizationShareControl } from '@/components/profile/OrganizationShareControl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit3, X } from 'lucide-react';

interface OrganizationProfileViewProps {
  org: any;
  membership: any;
  canEdit: boolean;
  canShare?: boolean;
}

export function OrganizationProfileView({
  org,
  membership,
  canEdit,
  canShare = true,
}: OrganizationProfileViewProps) {
  const [isEditingBasicInfo, setIsEditingBasicInfo] = useState(false);

  void membership;

  return (
    <div className="max-w-7xl mx-auto space-y-8 min-h-screen bg-proofound-parchment dark:bg-background pb-12">
      {/* Hero Section */}
      <OrganizationHero org={org} canEdit={canEdit} />

      <div className="px-4 sm:px-6">
        {/* Purpose & Culture Section */}
        <OrganizationPurpose mission={org.mission} vision={org.vision} culture={org.workCulture} />

        <div className="mb-8 flex flex-wrap justify-end gap-2">
          {canShare && (
            <OrganizationShareControl
              orgId={org.id}
              organizationName={org.displayName}
              organizationTagline={org.tagline}
            />
          )}
          {canEdit && (
            <Button
              variant="outline"
              onClick={() => setIsEditingBasicInfo(!isEditingBasicInfo)}
              className="gap-2"
            >
              {isEditingBasicInfo ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              {isEditingBasicInfo ? 'Close Editor' : 'Edit Basic Info'}
            </Button>
          )}
        </div>

        {/* Basic Info Editor (Collapsible) */}
        {isEditingBasicInfo && (
          <div className="mb-8">
            <OrganizationBasicInfoEditor org={org} canEdit={canEdit} />
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="space-y-8 lg:col-span-2">
            {/* Impact Section */}
            <div className="space-y-4">
              <ImpactDashboard orgId={org.id} orgName={org.displayName} canEdit={canEdit} />
            </div>

            {/* Organizational Structure Section */}
            <div className="space-y-4">
              <StructureManagerClient orgId={org.id} />
            </div>

            {/* Goals Section */}
            <div className="space-y-4">
              <GoalsManager orgId={org.id} canEdit={canEdit} />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <Card className="border-proofound-stone dark:border-border rounded-2xl">
              <CardHeader>
                <CardTitle className="font-display text-proofound-charcoal dark:text-foreground">
                  Organization Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-proofound-charcoal dark:text-foreground">
                    URL Slug
                  </p>
                  <p className="text-proofound-charcoal/70 dark:text-muted-foreground">
                    {org.slug}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-proofound-charcoal dark:text-foreground">
                    Type
                  </p>
                  <p className="text-proofound-charcoal/70 dark:text-muted-foreground capitalize">
                    {org.type}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Work Culture Section (Editor) */}
            <div className="space-y-4">
              <CultureEditor
                orgId={org.id}
                initialCulture={org.workCulture as any}
                canEdit={canEdit}
              />
            </div>

            {/* Causes Section */}
            <div className="space-y-4">
              <OrganizationCausesEditor
                orgId={org.id}
                initialCauses={org.causes || []}
                canEdit={canEdit}
              />
            </div>

            {/* Partnerships Section */}
            <div className="space-y-4">
              <PartnershipsManager orgId={org.id} canEdit={canEdit} />
            </div>

            {/* Visibility Settings Section */}
            {canEdit && (
              <div className="space-y-4">
                <OrganizationVisibilitySettings orgId={org.id} canEdit={canEdit} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
