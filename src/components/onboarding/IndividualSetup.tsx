'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Link as LinkIcon } from 'lucide-react';

import { completeIndividualOnboarding } from '@/actions/onboarding';
import { PublicPortfolioReadyStep } from '@/components/onboarding/PublicPortfolioReadyStep';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type SetupPhase = 'basics' | 'proof' | 'success';

type BasicsState = {
  displayName: string;
  handle: string;
  headline: string;
  bio: string;
  location: string;
};

const EMPTY_BASICS: BasicsState = {
  displayName: '',
  handle: '',
  headline: '',
  bio: '',
  location: '',
};

export function IndividualSetup() {
  const router = useRouter();
  const [phase, setPhase] = useState<SetupPhase>('basics');
  const [basics, setBasics] = useState<BasicsState>(EMPTY_BASICS);
  const [portfolioUrl, setPortfolioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function finalizeOnboarding(proof?: {
    proofUrl?: string;
    proofTitle?: string;
    proofSkillLabel?: string;
  }) {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set('displayName', basics.displayName);
      formData.set('handle', basics.handle);
      formData.set('headline', basics.headline);
      formData.set('bio', basics.bio);
      formData.set('location', basics.location);

      if (proof?.proofUrl) {
        formData.set('proofUrl', proof.proofUrl);
      }
      if (proof?.proofTitle) {
        formData.set('proofTitle', proof.proofTitle);
      }
      if (proof?.proofSkillLabel) {
        formData.set('proofSkillLabel', proof.proofSkillLabel);
      }

      const result = await completeIndividualOnboarding(formData);

      if (result.error) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      if (result.portfolioReady && result.publicPortfolioUrl) {
        setPortfolioUrl(result.publicPortfolioUrl);
        setPhase('success');
      } else {
        router.push('/app/i/home');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleBasicsSubmit(formData: FormData) {
    const nextBasics = {
      displayName: String(formData.get('displayName') || ''),
      handle: String(formData.get('handle') || ''),
      headline: String(formData.get('headline') || ''),
      bio: String(formData.get('bio') || ''),
      location: String(formData.get('location') || ''),
    };

    setBasics(nextBasics);
    setError(null);
    setPhase('proof');
  }

  async function handleProofSubmit(formData: FormData) {
    await finalizeOnboarding({
      proofUrl: String(formData.get('proofUrl') || '').trim(),
      proofTitle: String(formData.get('proofTitle') || '').trim(),
      proofSkillLabel: String(formData.get('proofSkillLabel') || '').trim(),
    });
  }

  if (phase === 'success' && portfolioUrl) {
    return (
      <PublicPortfolioReadyStep
        persona="individual"
        publicPortfolioUrl={portfolioUrl}
        onContinue={() => router.push('/app/i/home')}
        continueLabel="Continue to app"
      />
    );
  }

  if (phase === 'proof') {
    return (
      <Card className="mx-auto max-w-2xl rounded-2xl border-proofound-stone dark:border-border">
        <CardHeader>
          <button
            type="button"
            onClick={() => setPhase('basics')}
            className="mb-4 inline-flex items-center gap-2 text-sm text-proofound-charcoal/70 transition-colors hover:text-proofound-forest dark:text-muted-foreground dark:hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to basics
          </button>
          <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground">
            Add one proof link
          </CardTitle>
          <CardDescription className="text-proofound-charcoal/70 dark:text-muted-foreground">
            This is the shortest path to a public portfolio you can preview, open, and share today.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleProofSubmit} className="space-y-6">
            <div className="rounded-xl border border-proofound-stone bg-proofound-parchment/60 p-4 text-sm text-proofound-charcoal dark:border-border dark:bg-muted dark:text-foreground">
              <p className="font-medium">What happens next</p>
              <p className="mt-1 text-sm text-proofound-charcoal/70 dark:text-muted-foreground">
                We will attach one proof link to one skill and publish it on your public portfolio.
                Imported evidence is treated as candidate evidence, not automatically verified
                proof. Search engines stay off by default.
              </p>
            </div>

            <div>
              <Label htmlFor="proofSkillLabel">Skill or topic label *</Label>
              <Input
                id="proofSkillLabel"
                name="proofSkillLabel"
                placeholder="e.g. Product onboarding, React, Customer research"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="proofUrl">Proof link *</Label>
              <Input
                id="proofUrl"
                name="proofUrl"
                type="url"
                placeholder="https://"
                required
                disabled={isLoading}
              />
              <p className="mt-1 text-xs text-proofound-charcoal/70 dark:text-muted-foreground">
                Use a project link, article, case study, portfolio page, GitHub repo, or similar
                thin evidence.
              </p>
            </div>

            <div>
              <Label htmlFor="proofTitle">Optional proof label</Label>
              <Input
                id="proofTitle"
                name="proofTitle"
                placeholder="What should this proof be called on your portfolio?"
                disabled={isLoading}
              />
            </div>

            {error ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <div className="flex flex-wrap justify-between gap-3">
              <Button
                type="button"
                variant="ghost"
                disabled={isLoading}
                onClick={() => finalizeOnboarding()}
              >
                Finish for now
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-proofound-forest text-white hover:bg-proofound-forest/90"
              >
                {isLoading ? 'Publishing portfolio...' : 'Publish portfolio'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-2xl rounded-2xl border-proofound-stone dark:border-border">
      <CardHeader>
        <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground">
          Public basics
        </CardTitle>
        <CardDescription className="text-proofound-charcoal/70 dark:text-muted-foreground">
          Start with the basics for your public portfolio. You can defer matching and verification
          work until later.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleBasicsSubmit} className="space-y-6">
          <div>
            <Label htmlFor="displayName">Display name *</Label>
            <Input
              id="displayName"
              name="displayName"
              placeholder="Your full name"
              required
              defaultValue={basics.displayName}
            />
          </div>

          <div>
            <Label htmlFor="handle">Username *</Label>
            <Input
              id="handle"
              name="handle"
              placeholder="your-name"
              pattern="[a-z0-9-]+"
              required
              defaultValue={basics.handle}
            />
            <p className="mt-1 text-xs text-proofound-charcoal/70 dark:text-muted-foreground">
              Lowercase letters, numbers, and hyphens only. Search engines stay off by default.
            </p>
          </div>

          <div>
            <Label htmlFor="headline">Headline *</Label>
            <Input
              id="headline"
              name="headline"
              placeholder="e.g. Product engineer building proof-first onboarding"
              required
              defaultValue={basics.headline}
            />
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <textarea
              id="bio"
              name="bio"
              placeholder="A short summary is enough for day one."
              maxLength={2000}
              defaultValue={basics.bio}
              className="flex min-h-[120px] w-full rounded-lg border border-proofound-stone bg-white px-4 py-2 text-base text-proofound-charcoal transition-colors placeholder:text-proofound-charcoal/40 focus-visible:border-proofound-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest dark:border-border dark:bg-background dark:text-foreground dark:placeholder:text-muted-foreground/40"
            />
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              name="location"
              placeholder="City, country"
              defaultValue={basics.location}
            />
          </div>

          {error ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="flex items-start gap-3 rounded-xl border border-proofound-stone bg-proofound-parchment/60 p-4 text-sm text-proofound-charcoal dark:border-border dark:bg-muted dark:text-foreground">
            <LinkIcon className="mt-0.5 h-4 w-4 flex-none text-proofound-forest" />
            <p>
              The next step is optional but recommended: add one proof link so you leave onboarding
              with a live, shareable public portfolio.
            </p>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              size="lg"
              className="bg-proofound-forest text-white hover:bg-proofound-forest/90"
            >
              Continue
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
