'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { completeIndividualOnboarding } from '@/actions/onboarding';

export function IndividualSetup() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);

    try {
      const result = await completeIndividualOnboarding(formData);

      if (result.error) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      const destination = result.redirectTo ?? '/app/i/home';

      router.push(destination);
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Complete Your Profile</CardTitle>
        <CardDescription>
          Let&apos;s set up your individual profile so others can find and connect with you
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="displayName">Display Name *</Label>
            <Input
              id="displayName"
              name="displayName"
              placeholder="Your full name"
              required
              disabled={isLoading}
            />
            <p className="text-xs text-neutral-dark-500 mt-1">
              This is how others will see your name
            </p>
          </div>

          <div>
            <Label htmlFor="handle">Username *</Label>
            <Input
              id="handle"
              name="handle"
              placeholder="your-username"
              pattern="[a-zA-Z0-9_-]+"
              required
              disabled={isLoading}
            />
            <p className="text-xs text-neutral-dark-500 mt-1">
              Letters, numbers, hyphens, and underscores only
            </p>
          </div>

          <div>
            <Label htmlFor="headline">Headline</Label>
            <Input
              id="headline"
              name="headline"
              placeholder="e.g., Software Engineer | Designer | Entrepreneur"
              maxLength={200}
              disabled={isLoading}
            />
            <p className="text-xs text-neutral-dark-500 mt-1">
              A brief professional tagline (optional)
            </p>
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <textarea
              id="bio"
              name="bio"
              placeholder="Tell us about yourself..."
              maxLength={2000}
              disabled={isLoading}
              className="flex min-h-[120px] w-full rounded-lg border border-neutral-light-300 bg-white px-4 py-2 text-base transition-colors placeholder:text-neutral-dark-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:border-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p className="text-xs text-neutral-dark-500 mt-1">
              Share your experience, interests, or what you&apos;re looking for (optional)
            </p>
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" placeholder="City, Country" disabled={isLoading} />
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-4">
            <Button type="submit" disabled={isLoading} size="lg">
              {isLoading ? 'Creating Profile...' : 'Complete Setup'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
