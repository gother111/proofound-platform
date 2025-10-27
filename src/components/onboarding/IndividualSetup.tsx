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

      // Success - redirect to individual home
      router.push('/app/i/home');
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  }

  return (
    <Card className="max-w-2xl mx-auto border-proofound-stone dark:border-border rounded-2xl">
      <CardHeader>
        <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground">
          Complete Your Profile
        </CardTitle>
        <CardDescription className="text-proofound-charcoal/70 dark:text-muted-foreground">
          Let&apos;s set up your individual profile so others can find and connect with you
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="displayName" className="text-proofound-charcoal dark:text-foreground">
              Display Name *
            </Label>
            <Input
              id="displayName"
              name="displayName"
              placeholder="Your full name"
              required
              disabled={isLoading}
              className="border-proofound-stone dark:border-border focus-visible:ring-proofound-forest"
            />
            <p className="text-xs text-proofound-charcoal/70 dark:text-muted-foreground mt-1">
              This is how others will see your name
            </p>
          </div>

          <div>
            <Label htmlFor="handle" className="text-proofound-charcoal dark:text-foreground">
              Username *
            </Label>
            <Input
              id="handle"
              name="handle"
              placeholder="your-username"
              pattern="[a-zA-Z0-9_-]+"
              required
              disabled={isLoading}
              className="border-proofound-stone dark:border-border focus-visible:ring-proofound-forest"
            />
            <p className="text-xs text-proofound-charcoal/70 dark:text-muted-foreground mt-1">
              Letters, numbers, hyphens, and underscores only
            </p>
          </div>

          <div>
            <Label htmlFor="headline" className="text-proofound-charcoal dark:text-foreground">
              Headline
            </Label>
            <Input
              id="headline"
              name="headline"
              placeholder="e.g., Software Engineer | Designer | Entrepreneur"
              maxLength={200}
              disabled={isLoading}
              className="border-proofound-stone dark:border-border focus-visible:ring-proofound-forest"
            />
            <p className="text-xs text-proofound-charcoal/70 dark:text-muted-foreground mt-1">
              A brief professional tagline (optional)
            </p>
          </div>

          <div>
            <Label htmlFor="bio" className="text-proofound-charcoal dark:text-foreground">
              Bio
            </Label>
            <textarea
              id="bio"
              name="bio"
              placeholder="Tell us about yourself..."
              maxLength={2000}
              disabled={isLoading}
              className="flex min-h-[120px] w-full rounded-lg border border-proofound-stone dark:border-border bg-white dark:bg-background px-4 py-2 text-base transition-colors placeholder:text-proofound-charcoal/40 dark:placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:border-proofound-forest disabled:cursor-not-allowed disabled:opacity-50 text-proofound-charcoal dark:text-foreground"
            />
            <p className="text-xs text-proofound-charcoal/70 dark:text-muted-foreground mt-1">
              Share your experience, interests, or what you&apos;re looking for (optional)
            </p>
          </div>

          <div>
            <Label htmlFor="location" className="text-proofound-charcoal dark:text-foreground">
              Location
            </Label>
            <Input
              id="location"
              name="location"
              placeholder="City, Country"
              disabled={isLoading}
              className="border-proofound-stone dark:border-border focus-visible:ring-proofound-forest"
            />
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
              {isLoading ? 'Creating Profile...' : 'Complete Setup'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
