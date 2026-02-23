'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { completeOrganizationOnboarding } from '@/actions/onboarding';
import { createClient } from '@/lib/supabase/client';
import { PublicPortfolioReadyStep } from '@/components/onboarding/PublicPortfolioReadyStep';

export function OrganizationSetup() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [success, setSuccess] = useState<{ orgSlug: string; publicPortfolioUrl: string } | null>(
    null
  );

  // Check if user already has an organization on mount
  useEffect(() => {
    async function checkExistingOrg() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setCheckingExisting(false);
          return;
        }

        const { data: existingMemberships } = await supabase
          .from('organization_members')
          .select('org_id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .limit(1);

        if (existingMemberships && existingMemberships.length > 0) {
          const { data: orgData } = await supabase
            .from('organizations')
            .select('slug')
            .eq('id', existingMemberships[0].org_id)
            .single();

          if (orgData?.slug) {
            router.push(`/app/o/${orgData.slug}/home`);
            return;
          }
        }
      } catch (err) {
        console.error('Error checking for existing organization:', err);
      } finally {
        setCheckingExisting(false);
      }
    }

    checkExistingOrg();
  }, [router]);

  if (checkingExisting) {
    return (
      <Card className="max-w-2xl mx-auto border-proofound-stone dark:border-border rounded-2xl">
        <CardContent className="py-8 text-center">
          <div className="animate-pulse text-proofound-charcoal/70 dark:text-muted-foreground">
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);

    try {
      const result = await completeOrganizationOnboarding(formData);

      if (result.error) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      if (result.success && result.orgSlug && result.publicPortfolioUrl) {
        setSuccess({
          orgSlug: result.orgSlug,
          publicPortfolioUrl: result.publicPortfolioUrl,
        });
      }
      setIsLoading(false);
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <PublicPortfolioReadyStep
        persona="organization"
        publicPortfolioUrl={success.publicPortfolioUrl}
        onContinue={() => router.push(`/app/o/${success.orgSlug}/home`)}
      />
    );
  }

  return (
    <Card className="max-w-2xl mx-auto border-proofound-stone dark:border-border rounded-2xl">
      <CardHeader>
        <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground">
          Publish Your Organization Portfolio
        </CardTitle>
        <CardDescription className="text-proofound-charcoal/70 dark:text-muted-foreground">
          Create a clean public proof portfolio link your team can share on day 1
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="displayName" className="text-proofound-charcoal dark:text-foreground">
              Organization Name *
            </Label>
            <Input
              id="displayName"
              name="displayName"
              placeholder="Your Organization"
              required
              disabled={isLoading}
              className="border-proofound-stone dark:border-border focus-visible:ring-proofound-forest"
            />
            <p className="text-xs text-proofound-charcoal/70 dark:text-muted-foreground mt-1">
              The public-facing name of your organization
            </p>
          </div>

          <div>
            <Label htmlFor="slug" className="text-proofound-charcoal dark:text-foreground">
              URL Slug *
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground">
                proofound.com/portfolio/org/
              </span>
              <Input
                id="slug"
                name="slug"
                placeholder="your-org"
                pattern="[a-z0-9-]+"
                required
                disabled={isLoading}
                className="flex-1 border-proofound-stone dark:border-border focus-visible:ring-proofound-forest"
              />
            </div>
            <p className="text-xs text-proofound-charcoal/70 dark:text-muted-foreground mt-1">
              Lowercase letters, numbers, and hyphens only
            </p>
          </div>

          <div>
            <Label htmlFor="type" className="text-proofound-charcoal dark:text-foreground">
              Organization Type *
            </Label>
            <select
              id="type"
              name="type"
              required
              disabled={isLoading}
              className="flex h-11 w-full rounded-lg border border-proofound-stone dark:border-border bg-white dark:bg-background px-4 py-2 text-base text-proofound-charcoal dark:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest"
            >
              <option value="">Select a type...</option>
              <option value="company">Company / Business</option>
              <option value="ngo">Non-profit / NGO</option>
              <option value="government">Government / Public Sector</option>
              <option value="network">Network / Community</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <Label htmlFor="legalName" className="text-proofound-charcoal dark:text-foreground">
              Legal Name
            </Label>
            <Input
              id="legalName"
              name="legalName"
              placeholder="Legal entity name"
              disabled={isLoading}
              className="border-proofound-stone dark:border-border focus-visible:ring-proofound-forest"
            />
            <p className="text-xs text-proofound-charcoal/70 dark:text-muted-foreground mt-1">
              Official registered name (optional)
            </p>
          </div>

          <div>
            <Label htmlFor="mission" className="text-proofound-charcoal dark:text-foreground">
              Mission Statement
            </Label>
            <textarea
              id="mission"
              name="mission"
              placeholder="What does your organization do?"
              maxLength={2000}
              disabled={isLoading}
              className="flex min-h-[120px] w-full rounded-lg border border-proofound-stone dark:border-border bg-white dark:bg-background px-4 py-2 text-base transition-colors placeholder:text-proofound-charcoal/40 dark:placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:border-proofound-forest disabled:cursor-not-allowed disabled:opacity-50 text-proofound-charcoal dark:text-foreground"
            />
            <p className="text-xs text-proofound-charcoal/70 dark:text-muted-foreground mt-1">
              Describe your organization&apos;s purpose and goals (optional)
            </p>
          </div>

          <div>
            <Label htmlFor="website" className="text-proofound-charcoal dark:text-foreground">
              Website (optional)
            </Label>
            <Input
              id="website"
              name="website"
              type="url"
              placeholder="https://your-website.com"
              disabled={isLoading}
              className="border-proofound-stone dark:border-border focus-visible:ring-proofound-forest"
            />
            <p className="text-xs text-proofound-charcoal/70 dark:text-muted-foreground mt-1">
              You can add this later in your organization profile
            </p>
          </div>

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-4">
            <Button
              type="submit"
              disabled={isLoading}
              size="lg"
              className="bg-proofound-forest hover:bg-proofound-forest/90 text-white"
            >
              {isLoading ? 'Publishing Portfolio...' : 'Publish Portfolio'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
