'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { completeIndividualOnboarding } from '@/actions/onboarding';
import { CheckCircle2, Copy, ExternalLink } from 'lucide-react';

export function IndividualSetup() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [portfolioUrl, setPortfolioUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

      const handle = String(formData.get('handle') || '').toLowerCase();
      if (handle) {
        setPortfolioUrl(`${window.location.origin}/portfolio/${handle}`);
      } else {
        router.push('/app/i/home');
      }

      setIsLoading(false);
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  }

  const handleCopyUrl = async () => {
    if (!portfolioUrl) return;
    try {
      await navigator.clipboard.writeText(portfolioUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  if (portfolioUrl) {
    return (
      <Card className="max-w-2xl mx-auto border-proofound-stone dark:border-border rounded-2xl">
        <CardContent className="py-10 px-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-proofound-forest/10">
              <CheckCircle2 className="h-7 w-7 text-proofound-forest" />
            </div>
            <div>
              <h2 className="text-2xl font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground">
                Public portfolio ready
              </h2>
              <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground">
                Your shareable portfolio link is live.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-proofound-stone bg-proofound-parchment/50 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-proofound-charcoal/60 mb-1">
              Live URL
            </p>
            <p className="text-sm break-all text-proofound-charcoal dark:text-foreground">
              {portfolioUrl}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={handleCopyUrl} className="gap-2">
              <Copy className="h-4 w-4" />
              {copied ? 'Copied' : 'Copy link'}
            </Button>
            <Button asChild type="button" variant="outline" className="gap-2">
              <a href={portfolioUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" />
                Open portfolio
              </a>
            </Button>
            <Button type="button" onClick={() => router.push('/app/i/home')}>
              Continue to app
            </Button>
          </div>
        </CardContent>
      </Card>
    );
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
