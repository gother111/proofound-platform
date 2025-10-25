'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { completeOrganizationOnboarding } from '@/actions/onboarding';

export function OrganizationSetup() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      const destination =
        result.redirectTo ?? (result.orgSlug ? `/app/o/${result.orgSlug}/home` : '/app/i/home');

      router.push(destination);
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
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
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              name="website"
              type="url"
              placeholder="https://your-website.com"
              disabled={isLoading}
            />
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
