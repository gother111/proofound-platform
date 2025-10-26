'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { completeOrganizationOnboarding } from '@/actions/onboarding';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle } from 'lucide-react';

export function OrganizationSetup() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [success, setSuccess] = useState<{ orgName: string; orgSlug: string } | null>(null);

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
      <Card className="max-w-2xl mx-auto">
        <CardContent className="py-8 text-center">
          <div className="animate-pulse text-neutral-dark-600">Loading...</div>
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

      // Success - show success message and redirect after delay
      if (result.orgSlug) {
        const orgName = formData.get('displayName') as string;
        setSuccess({ orgName, orgSlug: result.orgSlug });

        // Redirect after 2 seconds to show success message
        setTimeout(() => {
          router.push(`/app/o/${result.orgSlug}/home`);
        }, 2000);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  }

  // Show success message
  if (success) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="py-12 px-8">
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-display font-semibold text-primary-500">
                Organization Created Successfully!
              </h2>
              <p className="text-3xl font-bold text-neutral-dark-900">
                Welcome to {success.orgName}!
              </p>
            </div>

            <div className="bg-neutral-light-100 rounded-xl p-6 text-left space-y-3">
              <p className="font-medium text-neutral-dark-900">
                Your organization has been created and you&apos;re now ready to:
              </p>
              <ul className="space-y-2 text-sm text-neutral-dark-600">
                <li className="flex items-start gap-2">
                  <span className="text-primary-500 font-bold mt-0.5">•</span>
                  <span>Invite team members</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-500 font-bold mt-0.5">•</span>
                  <span>Set up your organization profile</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-500 font-bold mt-0.5">•</span>
                  <span>Start collaborating</span>
                </li>
              </ul>
            </div>

            <p className="text-sm text-neutral-dark-500 animate-pulse">
              Redirecting to your dashboard...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create Your Organization</CardTitle>
        <CardDescription>
          Set up your organization to start collaborating with your team
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="displayName">Organization Name *</Label>
            <Input
              id="displayName"
              name="displayName"
              placeholder="Your Organization"
              required
              disabled={isLoading}
            />
            <p className="text-xs text-neutral-dark-500 mt-1">
              The public-facing name of your organization
            </p>
          </div>

          <div>
            <Label htmlFor="slug">URL Slug *</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-dark-500">proofound.com/o/</span>
              <Input
                id="slug"
                name="slug"
                placeholder="your-org"
                pattern="[a-z0-9-]+"
                required
                disabled={isLoading}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-neutral-dark-500 mt-1">
              Lowercase letters, numbers, and hyphens only
            </p>
          </div>

          <div>
            <Label htmlFor="type">Organization Type *</Label>
            <select
              id="type"
              name="type"
              required
              disabled={isLoading}
              className="flex h-11 w-full rounded-lg border border-neutral-light-300 bg-white px-4 py-2 text-base"
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
            <Label htmlFor="legalName">Legal Name</Label>
            <Input
              id="legalName"
              name="legalName"
              placeholder="Legal entity name"
              disabled={isLoading}
            />
            <p className="text-xs text-neutral-dark-500 mt-1">
              Official registered name (optional)
            </p>
          </div>

          <div>
            <Label htmlFor="mission">Mission Statement</Label>
            <textarea
              id="mission"
              name="mission"
              placeholder="What does your organization do?"
              maxLength={2000}
              disabled={isLoading}
              className="flex min-h-[120px] w-full rounded-lg border border-neutral-light-300 bg-white px-4 py-2 text-base transition-colors placeholder:text-neutral-dark-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:border-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p className="text-xs text-neutral-dark-500 mt-1">
              Describe your organization&apos;s purpose and goals (optional)
            </p>
          </div>

          <div>
            <Label htmlFor="website">Website (optional)</Label>
            <Input
              id="website"
              name="website"
              type="url"
              placeholder="https://your-website.com"
              disabled={isLoading}
            />
            <p className="text-xs text-neutral-dark-500 mt-1">
              You can add this later in your organization profile
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-4">
            <Button type="submit" disabled={isLoading} size="lg">
              {isLoading ? 'Creating Organization...' : 'Create Organization'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
