'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { OrganizationCausesEditor } from './CausesEditor';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface Organization {
  id: string;
  displayName: string;
  legalName: string | null;
  mission: string | null;
  vision: string | null;
  causes: string[] | null;
  website: string | null;
  slug: string;
  type: string;
}

interface BasicInfoFormProps {
  org: Organization;
  canEdit: boolean;
}

export function BasicInfoForm({ org, canEdit }: BasicInfoFormProps) {
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState(org.displayName);
  const [legalName, setLegalName] = useState(org.legalName || '');
  const [mission, setMission] = useState(org.mission || '');
  const [vision, setVision] = useState(org.vision || '');
  const [causes, setCauses] = useState<string[]>(org.causes || []);
  const [website, setWebsite] = useState(org.website || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!displayName.trim()) {
      toast.error('Organization name is required');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/organizations/${org.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: displayName.trim(),
          legalName: legalName.trim() || null,
          mission: mission.trim() || null,
          vision: vision.trim() || null,
          causes: causes.length > 0 ? causes : null,
          website: website.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update organization');
      }

      toast.success('Organization profile updated successfully');
      
      // Reload to show updated data
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save changes');
      console.error('Error updating organization:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-proofound-stone dark:border-border rounded-2xl">
        <CardHeader>
          <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground">
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="displayName" className="text-proofound-charcoal dark:text-foreground">
                Organization Name *
              </Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Organization Name"
                disabled={!canEdit}
                required
                className="border-proofound-stone dark:border-border focus-visible:ring-proofound-forest"
              />
            </div>

            <div>
              <Label htmlFor="legalName" className="text-proofound-charcoal dark:text-foreground">
                Legal Name (Optional)
              </Label>
              <Input
                id="legalName"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="Legal company name"
                disabled={!canEdit}
                className="border-proofound-stone dark:border-border focus-visible:ring-proofound-forest"
              />
            </div>

            <div>
              <Label htmlFor="mission" className="text-proofound-charcoal dark:text-foreground">
                Mission Statement
              </Label>
              <textarea
                id="mission"
                value={mission}
                onChange={(e) => setMission(e.target.value)}
                placeholder="Describe your organization's mission and goals"
                className="flex min-h-[120px] w-full rounded-lg border border-proofound-stone dark:border-border bg-white dark:bg-background px-4 py-2 text-base transition-colors placeholder:text-proofound-charcoal/40 dark:placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:border-proofound-forest disabled:cursor-not-allowed disabled:opacity-50 text-proofound-charcoal dark:text-foreground"
                maxLength={2000}
                disabled={!canEdit}
              />
            </div>

            <div>
              <Label htmlFor="vision" className="text-proofound-charcoal dark:text-foreground">
                Vision Statement
              </Label>
              <textarea
                id="vision"
                value={vision}
                onChange={(e) => setVision(e.target.value)}
                placeholder="Describe your organization's long-term vision and aspirations"
                className="flex min-h-[120px] w-full rounded-lg border border-proofound-stone dark:border-border bg-white dark:bg-background px-4 py-2 text-base transition-colors placeholder:text-proofound-charcoal/40 dark:placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:border-proofound-forest disabled:cursor-not-allowed disabled:opacity-50 text-proofound-charcoal dark:text-foreground"
                maxLength={2000}
                disabled={!canEdit}
              />
              <p className="text-xs text-proofound-charcoal/60 dark:text-muted-foreground/60 mt-1">
                Max 300 characters recommended (PRD requirement)
              </p>
            </div>

            <div>
              <OrganizationCausesEditor
                causes={causes}
                onChange={setCauses}
                disabled={!canEdit}
              />
            </div>

            <div>
              <Label htmlFor="website" className="text-proofound-charcoal dark:text-foreground">
                Website
              </Label>
              <Input
                id="website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://your-organization.com"
                disabled={!canEdit}
                className="border-proofound-stone dark:border-border focus-visible:ring-proofound-forest"
              />
            </div>

            {canEdit && (
              <Button
                type="submit"
                disabled={loading}
                className="bg-proofound-forest hover:bg-proofound-forest/90 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      <Card className="border-proofound-stone dark:border-border rounded-2xl">
        <CardHeader>
          <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground">
            Organization Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-proofound-charcoal dark:text-foreground">
              URL Slug
            </p>
            <p className="text-proofound-charcoal/70 dark:text-muted-foreground">{org.slug}</p>
            <p className="text-xs text-proofound-charcoal/70 dark:text-muted-foreground mt-1">
              Your organization URL: /app/o/{org.slug}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-proofound-charcoal dark:text-foreground">Type</p>
            <p className="text-proofound-charcoal/70 dark:text-muted-foreground capitalize">
              {org.type}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

