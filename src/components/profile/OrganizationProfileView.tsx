'use client';

import { useRef, useState, useEffect } from 'react';
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
import { motion } from 'framer-motion';
import type { PurposeLinks } from '@/types/profile';
import { AppSurface } from '@/components/ui/v2/AppSurface';
import { organizationTypeLabel } from '@/lib/copy/labels';

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
  missionLinks: PurposeLinks;
  visionLinks: PurposeLinks;
  website: string | null;
  foundedDate: string | null;
  industry: string | null;
  industryKey: string | null;
  industryLabel: string | null;
  industryLegacyText: string | null;
  organizationSize: string | null;
  impactArea: string | null;
  legalForm: string | null;
  values: string[] | null;
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
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setProgress(profileCompletion), 300);
    return () => clearTimeout(timer);
  }, [profileCompletion]);

  const openBasicInfoEditor = () => {
    setIsEditingBasicInfo(true);
    requestAnimationFrame(() => {
      basicInfoEditorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <AppSurface>
      <div className="max-w-7xl mx-auto space-y-8 pb-12 w-full" data-testid="org-profile-root">
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
                  <Progress value={progress} className="h-2" />
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
            missionLinks={org.missionLinks}
            visionLinks={org.visionLinks}
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative items-start">
            {/* Left Sidebar (1/3) */}
            <div className="space-y-8 lg:sticky lg:top-24 lg:self-start">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card className="border-black/5 dark:border-white/5 rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-300 shadow-sm">
                  <CardHeader>
                    <CardTitle className="font-display text-proofound-charcoal dark:text-foreground">
                      Organization Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-proofound-charcoal dark:text-foreground">
                        Public link name
                      </p>
                      <p className="text-proofound-charcoal/70 dark:text-muted-foreground">
                        {org.slug}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-proofound-charcoal dark:text-foreground">
                        Type
                      </p>
                      <p className="text-proofound-charcoal/70 dark:text-muted-foreground">
                        {organizationTypeLabel(org.type)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Work Culture Section (Editor) */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="space-y-4"
              >
                <CultureEditor
                  orgId={org.id}
                  initialCulture={org.workCulture as any}
                  canEdit={canEdit}
                />
              </motion.div>

              {/* Causes Section */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="space-y-4"
              >
                <OrganizationCausesEditor
                  orgId={org.id}
                  initialCauses={org.causes || []}
                  canEdit={canEdit}
                />
              </motion.div>

              {/* Partnerships Section */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="space-y-4"
              >
                <PartnershipsManager orgId={org.id} canEdit={canEdit} />
              </motion.div>

              {/* Visibility Settings Section */}
              {canEdit && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="space-y-4"
                >
                  <OrganizationVisibilitySettings orgId={org.id} canEdit={canEdit} />
                </motion.div>
              )}
            </div>

            {/* Right Content (2/3) */}
            <div className="space-y-8 lg:col-span-2">
              {/* Impact Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6 }}
                className="space-y-4"
              >
                <ImpactDashboard orgId={org.id} orgName={org.displayName} canEdit={canEdit} />
              </motion.div>

              {/* Organizational Structure Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="space-y-4"
              >
                <StructureManagerClient orgId={org.id} />
              </motion.div>

              {/* Goals Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="space-y-4"
              >
                <GoalsManager orgId={org.id} canEdit={canEdit} />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </AppSurface>
  );
}
