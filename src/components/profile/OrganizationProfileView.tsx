'use client';

import { useRef, useState } from 'react';
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
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit3, X } from 'lucide-react';

type OrganizationProfile = {
  id: string;
  slug: string;
  displayName: string;
  legalName: string | null;
  type: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  tagline: string | null;
  mission: string | null;
  vision: string | null;
  website: string | null;
  foundedDate: string | null;
  industry: string | null;
  organizationSize: string | null;
  impactArea: string | null;
  legalForm: string | null;
  causes: string[] | null;
  workCulture: unknown;
  locations: string[] | null;
  verified: boolean;
};

interface OrganizationProfileViewProps {
  org: OrganizationProfile;
  canEdit: boolean;
  canShare?: boolean;
  isEmptyProfile?: boolean;
  profileCompletion?: number;
}

export function OrganizationProfileView({
  org,
  canEdit,
  canShare = true,
  isEmptyProfile = false,
  profileCompletion = 0,
}: OrganizationProfileViewProps) {
  const [isEditingBasicInfo, setIsEditingBasicInfo] = useState(false);
  const basicInfoEditorRef = useRef<HTMLDivElement>(null);

  const openBasicInfoEditor = () => {
    setIsEditingBasicInfo(true);
    requestAnimationFrame(() => {
      basicInfoEditorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 min-h-screen bg-proofound-parchment dark:bg-background pb-12">
      {/* Hero Section */}
      <OrganizationHero
        org={org}
        canEdit={canEdit}
        onEditProfile={canEdit ? openBasicInfoEditor : undefined}
      />

      <div className="px-4 sm:px-6">
        {isEmptyProfile && (
          <Card
            className="mb-8 border-proofound-forest/30 bg-proofound-forest/5 dark:bg-proofound-forest/10"
            data-testid="org-profile-completion-banner"
          >
            <CardHeader>
              <CardTitle className="font-display text-proofound-charcoal dark:text-foreground">
                Complete your organization profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-proofound-charcoal/80 dark:text-muted-foreground">
                Add your core organization details to unlock better matching and build trust with
                candidates.
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-proofound-charcoal/80 dark:text-muted-foreground">
                    Profile completion
                  </span>
                  <span className="font-medium text-proofound-charcoal dark:text-foreground">
                    {profileCompletion}%
                  </span>
                </div>
                <Progress value={profileCompletion} className="h-2" />
              </div>
              {canEdit && (
                <Button
                  type="button"
                  onClick={openBasicInfoEditor}
                  className="bg-proofound-forest hover:bg-proofound-forest/90 text-white"
                >
                  Edit basic info
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Purpose & Culture Section */}
        <OrganizationPurpose
          mission={org.mission ?? undefined}
          vision={org.vision ?? undefined}
          culture={org.workCulture}
        />

        {(canEdit || canShare) && (
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
                type="button"
                variant="outline"
                onClick={() => {
                  if (isEditingBasicInfo) {
                    setIsEditingBasicInfo(false);
                    return;
                  }
                  openBasicInfoEditor();
                }}
                className="gap-2"
              >
                {isEditingBasicInfo ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                {isEditingBasicInfo ? 'Close Editor' : 'Edit Basic Info'}
              </Button>
            )}
          </div>
        )}

        {/* Basic Info Editor (Collapsible) */}
        {isEditingBasicInfo && (
          <div className="mb-8" ref={basicInfoEditorRef} data-testid="org-basic-info-editor">
            <OrganizationBasicInfoEditor
              org={org}
              canEdit={canEdit}
              onSaved={() => setIsEditingBasicInfo(false)}
            />
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
