'use client';

import { type FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  Link2,
  PackageOpen,
  Rocket,
  UserRound,
} from 'lucide-react';

import { completeIndividualOnboarding } from '@/actions/onboarding';
import { PublicPortfolioReadyStep } from '@/components/onboarding/PublicPortfolioReadyStep';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type SetupPhase =
  | 'safe_shell'
  | 'real_context'
  | 'first_proof'
  | 'proof_pack'
  | 'verification'
  | 'publish_portfolio'
  | 'success';

type ContextType = 'experience' | 'education' | 'volunteering';

type SafeShellState = {
  displayName: string;
  handle: string;
  headline: string;
  location: string;
  timezone: string;
  focusArea: string;
  workMode: string;
  engagementType: string;
};

type ContextState = {
  contextType: ContextType;
  title: string;
  organizationName: string;
  duration: string;
  summary: string;
  outcome: string;
};

type ProofState = {
  proofUrl: string;
  proofTitle: string;
  proofSummary: string;
};

type ProofPackState = {
  claim: string;
  ownership: string;
  outcome: string;
};

const SETUP_STEPS: Array<{
  id: Exclude<SetupPhase, 'success'>;
  label: string;
  icon: typeof UserRound;
}> = [
  { id: 'safe_shell', label: 'Create safe shell', icon: UserRound },
  { id: 'real_context', label: 'Add one real context', icon: Briefcase },
  { id: 'first_proof', label: 'Add first proof', icon: Link2 },
  { id: 'proof_pack', label: 'Structure first Proof Pack', icon: PackageOpen },
  { id: 'verification', label: 'Required verification', icon: BadgeCheck },
  { id: 'publish_portfolio', label: 'Publish portfolio', icon: Rocket },
];

const EMPTY_SAFE_SHELL: SafeShellState = {
  displayName: '',
  handle: '',
  headline: '',
  location: '',
  timezone: '',
  focusArea: '',
  workMode: '',
  engagementType: '',
};

const EMPTY_CONTEXT: ContextState = {
  contextType: 'experience',
  title: '',
  organizationName: '',
  duration: '',
  summary: '',
  outcome: '',
};

const EMPTY_PROOF: ProofState = {
  proofUrl: '',
  proofTitle: '',
  proofSummary: '',
};

const EMPTY_PROOF_PACK: ProofPackState = {
  claim: '',
  ownership: '',
  outcome: '',
};

function StepRail({ phase }: { phase: Exclude<SetupPhase, 'success'> }) {
  const activeIndex = SETUP_STEPS.findIndex((step) => step.id === phase);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="individual-setup-steps">
      {SETUP_STEPS.map((step, index) => {
        const Icon = step.icon;
        const status =
          index < activeIndex ? 'completed' : index === activeIndex ? 'active' : 'upcoming';

        return (
          <div
            key={step.id}
            className={`rounded-xl border p-3 text-sm ${
              status === 'active'
                ? 'border-proofound-forest bg-proofound-parchment/70'
                : status === 'completed'
                  ? 'border-emerald-200 bg-emerald-50/70'
                  : 'border-proofound-stone/60 bg-white'
            }`}
            data-testid={`individual-setup-step-${step.id}`}
          >
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-proofound-forest" />
              <span className="font-medium text-proofound-charcoal">{step.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function IndividualSetup() {
  const router = useRouter();
  const [phase, setPhase] = useState<SetupPhase>('safe_shell');
  const [safeShell, setSafeShell] = useState<SafeShellState>(EMPTY_SAFE_SHELL);
  const [context, setContext] = useState<ContextState>(EMPTY_CONTEXT);
  const [proof, setProof] = useState<ProofState>(EMPTY_PROOF);
  const [proofPack, setProofPack] = useState<ProofPackState>(EMPTY_PROOF_PACK);
  const [portfolioUrl, setPortfolioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function finalizeOnboarding() {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set('displayName', safeShell.displayName);
      formData.set('handle', safeShell.handle);
      formData.set('headline', safeShell.headline);
      formData.set('location', safeShell.location);
      formData.set('timezone', safeShell.timezone);
      formData.set('focusArea', safeShell.focusArea);
      formData.set('workMode', safeShell.workMode);
      formData.set('engagementType', safeShell.engagementType);

      formData.set('contextType', context.contextType);
      formData.set('contextTitle', context.title);
      formData.set('contextOrganizationName', context.organizationName);
      formData.set('contextDuration', context.duration);
      formData.set('contextSummary', context.summary);
      formData.set('contextOutcome', context.outcome);

      formData.set('proofUrl', proof.proofUrl);
      formData.set('proofTitle', proof.proofTitle);
      formData.set('proofSummary', proof.proofSummary);
      formData.set('proofPackClaim', proofPack.claim);
      formData.set('proofPackOwnership', proofPack.ownership);
      formData.set('proofPackOutcome', proofPack.outcome);

      const result = await completeIndividualOnboarding(formData);

      if (result.error) {
        setError(result.error);
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

  function submitSafeShell(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    handleSafeShellSubmit(new FormData(event.currentTarget));
  }

  function submitContext(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    handleContextSubmit(new FormData(event.currentTarget));
  }

  function submitProof(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    handleProofSubmit(new FormData(event.currentTarget));
  }

  function submitProofPack(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    handleProofPackSubmit();
  }

  function handleSafeShellSubmit(formData: FormData) {
    setSafeShell({
      displayName: String(formData.get('displayName') || '').trim(),
      handle: String(formData.get('handle') || '').trim(),
      headline: String(formData.get('headline') || '').trim(),
      location: String(formData.get('location') || '').trim(),
      timezone: String(formData.get('timezone') || '').trim(),
      focusArea: String(formData.get('focusArea') || '').trim(),
      workMode: String(formData.get('workMode') || '').trim(),
      engagementType: String(formData.get('engagementType') || '').trim(),
    });
    setError(null);
    setPhase('real_context');
  }

  function handleContextSubmit(formData: FormData) {
    const contextType = String(formData.get('contextType') || 'experience') as ContextType;
    setContext({
      contextType,
      title: String(formData.get('title') || '').trim(),
      organizationName: String(formData.get('organizationName') || '').trim(),
      duration: String(formData.get('duration') || '').trim(),
      summary: String(formData.get('summary') || '').trim(),
      outcome: String(formData.get('outcome') || '').trim(),
    });
    setError(null);
    setPhase('first_proof');
  }

  function handleProofSubmit(formData: FormData) {
    setProof({
      proofUrl: String(formData.get('proofUrl') || '').trim(),
      proofTitle: String(formData.get('proofTitle') || '').trim(),
      proofSummary: String(formData.get('proofSummary') || '').trim(),
    });
    setProofPack((current) => ({
      claim: current.claim || String(formData.get('proofTitle') || '').trim(),
      ownership:
        current.ownership || 'I owned the contribution shown in this proof inside this context.',
      outcome: current.outcome || context.outcome,
    }));
    setError(null);
    setPhase('proof_pack');
  }

  function handleProofPackSubmit() {
    setError(null);
    setPhase('verification');
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

  const visiblePhase = phase === 'success' ? 'publish_portfolio' : phase;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-3">
        <h1 className="font-['Crimson_Pro'] text-3xl font-semibold text-proofound-charcoal dark:text-foreground">
          Build your first proof-backed portfolio
        </h1>
        <p className="max-w-2xl text-sm text-proofound-charcoal/70 dark:text-muted-foreground">
          Keep the first session light. We start with a safe shell, anchor one real context, add
          your first proof, and publish. Values, causes, and broad skill setup can wait.
        </p>
        <StepRail phase={visiblePhase} />
      </div>

      {phase === 'safe_shell' ? (
        <Card className="mx-auto rounded-2xl border-proofound-stone dark:border-border">
          <CardHeader>
            <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground">
              Create a safe shell
            </CardTitle>
            <CardDescription className="text-proofound-charcoal/70 dark:text-muted-foreground">
              Only the locked MVP basics. No résumé wizard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitSafeShell} className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <Label htmlFor="displayName">Display name *</Label>
                  <Input
                    id="displayName"
                    name="displayName"
                    placeholder="Your full name"
                    required
                    defaultValue={safeShell.displayName}
                  />
                </div>

                <div>
                  <Label htmlFor="handle">Handle *</Label>
                  <Input
                    id="handle"
                    name="handle"
                    placeholder="your-name"
                    pattern="[a-z0-9_-]+"
                    required
                    defaultValue={safeShell.handle}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="headline">Headline *</Label>
                <Input
                  id="headline"
                  name="headline"
                  placeholder="What should people know before they open your proof?"
                  required
                  defaultValue={safeShell.headline}
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <Label htmlFor="location">Broad location *</Label>
                  <Input
                    id="location"
                    name="location"
                    placeholder="City or region, country"
                    required
                    defaultValue={safeShell.location}
                  />
                </div>
                <div>
                  <Label htmlFor="timezone">Timezone *</Label>
                  <Input
                    id="timezone"
                    name="timezone"
                    placeholder="Europe/Stockholm"
                    required
                    defaultValue={safeShell.timezone}
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <Label htmlFor="focusArea">Target role or focus area *</Label>
                  <Input
                    id="focusArea"
                    name="focusArea"
                    placeholder="Product onboarding, climate operations, community design"
                    required
                    defaultValue={safeShell.focusArea}
                  />
                </div>
                <div>
                  <Label htmlFor="workMode">Work preference *</Label>
                  <select
                    id="workMode"
                    name="workMode"
                    required
                    defaultValue={safeShell.workMode}
                    className="flex h-11 w-full rounded-lg border border-proofound-stone bg-white px-4 py-2 text-base text-proofound-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest dark:border-border dark:bg-background dark:text-foreground"
                  >
                    <option value="">Select one</option>
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="onsite">On-site</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="engagementType">Engagement preference *</Label>
                <select
                  id="engagementType"
                  name="engagementType"
                  required
                  defaultValue={safeShell.engagementType}
                  className="flex h-11 w-full rounded-lg border border-proofound-stone bg-white px-4 py-2 text-base text-proofound-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest dark:border-border dark:bg-background dark:text-foreground"
                >
                  <option value="">Select one</option>
                  <option value="full_time">Full-time</option>
                  <option value="part_time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="fractional">Fractional</option>
                  <option value="project_based">Project-based</option>
                  <option value="volunteer">Volunteer</option>
                </select>
              </div>

              {error ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                  {error}
                </div>
              ) : null}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="lg"
                  className="bg-proofound-forest text-white hover:bg-proofound-forest/90"
                >
                  Continue to real context
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {phase === 'real_context' ? (
        <Card className="mx-auto rounded-2xl border-proofound-stone dark:border-border">
          <CardHeader>
            <button
              type="button"
              onClick={() => setPhase('safe_shell')}
              className="mb-4 inline-flex items-center gap-2 text-sm text-proofound-charcoal/70 transition-colors hover:text-proofound-forest dark:text-muted-foreground dark:hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to safe shell
            </button>
            <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground">
              Add one real context
            </CardTitle>
            <CardDescription className="text-proofound-charcoal/70 dark:text-muted-foreground">
              Choose one real work, learning, or volunteering context to anchor your first proof.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitContext} className="space-y-5">
              <div>
                <Label htmlFor="contextType">Context type *</Label>
                <select
                  id="contextType"
                  name="contextType"
                  required
                  defaultValue={context.contextType}
                  className="flex h-11 w-full rounded-lg border border-proofound-stone bg-white px-4 py-2 text-base text-proofound-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest dark:border-border dark:bg-background dark:text-foreground"
                >
                  <option value="experience">Work</option>
                  <option value="education">Education or learning</option>
                  <option value="volunteering">Volunteering</option>
                </select>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <Label htmlFor="title">Title or focus *</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Role, title, focus, or contribution area"
                    required
                    defaultValue={context.title}
                  />
                </div>
                <div>
                  <Label htmlFor="organizationName">Organization or institution *</Label>
                  <Input
                    id="organizationName"
                    name="organizationName"
                    placeholder="Organization, institution, or community"
                    required
                    defaultValue={context.organizationName}
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <Label htmlFor="duration">Duration *</Label>
                  <Input
                    id="duration"
                    name="duration"
                    placeholder="2024 to present"
                    required
                    defaultValue={context.duration}
                  />
                </div>
                <div>
                  <Label htmlFor="summary">Context summary *</Label>
                  <Input
                    id="summary"
                    name="summary"
                    placeholder="One short sentence that sets the context"
                    required
                    defaultValue={context.summary}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="outcome">Outcome or contribution *</Label>
                <Input
                  id="outcome"
                  name="outcome"
                  required
                  defaultValue={context.outcome}
                  placeholder="One short sentence on what changed or what you contributed"
                />
              </div>

              {error ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                  {error}
                </div>
              ) : null}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="lg"
                  className="bg-proofound-forest text-white hover:bg-proofound-forest/90"
                >
                  Continue to add your first proof
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {phase === 'first_proof' ? (
        <Card className="mx-auto rounded-2xl border-proofound-stone dark:border-border">
          <CardHeader>
            <button
              type="button"
              onClick={() => setPhase('real_context')}
              className="mb-4 inline-flex items-center gap-2 text-sm text-proofound-charcoal/70 transition-colors hover:text-proofound-forest dark:text-muted-foreground dark:hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to real context
            </button>
            <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground">
              Add your first proof
            </CardTitle>
            <CardDescription className="text-proofound-charcoal/70 dark:text-muted-foreground">
              Add one evidence item that will feed your first Proof Pack. One real link is enough
              for day one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitProof} className="space-y-5">
              <div>
                <Label htmlFor="proofTitle">Proof title *</Label>
                <Input
                  id="proofTitle"
                  name="proofTitle"
                  placeholder="What should this proof be called?"
                  required
                  defaultValue={proof.proofTitle}
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
                  defaultValue={proof.proofUrl}
                />
              </div>

              <div>
                <Label htmlFor="proofSummary">Evidence item note *</Label>
                <textarea
                  id="proofSummary"
                  name="proofSummary"
                  required
                  defaultValue={proof.proofSummary}
                  placeholder="What is this evidence item, and why does it matter to this proof?"
                  className="flex min-h-[120px] w-full rounded-lg border border-proofound-stone bg-white px-4 py-2 text-base text-proofound-charcoal transition-colors placeholder:text-proofound-charcoal/40 focus-visible:border-proofound-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest dark:border-border dark:bg-background dark:text-foreground dark:placeholder:text-muted-foreground/40"
                />
              </div>

              {error ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                  {error}
                </div>
              ) : null}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="lg"
                  className="bg-proofound-forest text-white hover:bg-proofound-forest/90"
                >
                  Continue to structure Proof Pack
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {phase === 'proof_pack' ? (
        <Card className="mx-auto rounded-2xl border-proofound-stone dark:border-border">
          <CardHeader>
            <button
              type="button"
              onClick={() => setPhase('first_proof')}
              className="mb-4 inline-flex items-center gap-2 text-sm text-proofound-charcoal/70 transition-colors hover:text-proofound-forest dark:text-muted-foreground dark:hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to first proof
            </button>
            <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground">
              Structure your first Proof Pack
            </CardTitle>
            <CardDescription className="text-proofound-charcoal/70 dark:text-muted-foreground">
              Turn the anchor context and evidence item into one clean Proof Pack. Keep it specific
              and portfolio-ready.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitProofPack} className="space-y-5">
              <div>
                <Label htmlFor="proofPackClaim">Claim *</Label>
                <Input
                  id="proofPackClaim"
                  name="proofPackClaim"
                  required
                  value={proofPack.claim}
                  onChange={(event) =>
                    setProofPack((current) => ({ ...current, claim: event.target.value }))
                  }
                  placeholder="What should this Proof Pack claim in one clear line?"
                />
              </div>

              <div>
                <Label htmlFor="proofPackOwnership">Ownership *</Label>
                <Input
                  id="proofPackOwnership"
                  name="proofPackOwnership"
                  required
                  value={proofPack.ownership}
                  onChange={(event) =>
                    setProofPack((current) => ({ ...current, ownership: event.target.value }))
                  }
                  placeholder="What was your role or ownership in this work?"
                />
              </div>

              <div>
                <Label htmlFor="proofPackOutcome">Outcome *</Label>
                <Input
                  id="proofPackOutcome"
                  name="proofPackOutcome"
                  required
                  value={proofPack.outcome}
                  onChange={(event) =>
                    setProofPack((current) => ({ ...current, outcome: event.target.value }))
                  }
                  placeholder="What result or contribution should a reviewer understand?"
                />
              </div>

              <div className="rounded-xl border border-proofound-stone bg-proofound-parchment/60 p-4 text-sm text-proofound-charcoal dark:border-border dark:bg-muted dark:text-foreground">
                <p className="font-medium">Proof Pack preview</p>
                <p className="mt-3">
                  <span className="font-medium">Claim:</span>{' '}
                  {proofPack.claim || 'Add a clear claim'}
                </p>
                <p className="mt-1">
                  <span className="font-medium">Ownership:</span>{' '}
                  {proofPack.ownership || 'State your role or ownership'}
                </p>
                <p className="mt-1">
                  <span className="font-medium">Outcome:</span>{' '}
                  {proofPack.outcome || 'Describe the key result or contribution'}
                </p>
                <p className="mt-1">
                  <span className="font-medium">Anchor context:</span> {context.title} at{' '}
                  {context.organizationName} · {context.duration}
                </p>
                <p className="mt-1 text-proofound-charcoal/70 dark:text-muted-foreground">
                  {context.summary}
                </p>
                <p className="mt-1">
                  <span className="font-medium">Evidence item:</span> {proof.proofTitle}
                </p>
                <p className="mt-1 text-proofound-charcoal/70 dark:text-muted-foreground">
                  {proof.proofSummary}
                </p>
                <p className="mt-1 break-all text-proofound-charcoal/70 dark:text-muted-foreground">
                  {proof.proofUrl}
                </p>
                <p className="mt-3">
                  <span className="font-medium">Visibility summary:</span> Public portfolio-safe by
                  default. Blind review stays intact. Public readiness requires an accepted non-self
                  verification before this Proof Pack can unlock visibility.
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
      ) : null}

      {phase === 'verification' ? (
        <Card className="mx-auto rounded-2xl border-proofound-stone dark:border-border">
          <CardHeader>
            <button
              type="button"
              onClick={() => setPhase('proof_pack')}
              className="mb-4 inline-flex items-center gap-2 text-sm text-proofound-charcoal/70 transition-colors hover:text-proofound-forest dark:text-muted-foreground dark:hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Proof Pack
            </button>
            <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground">
              Required verification
            </CardTitle>
            <CardDescription className="text-proofound-charcoal/70 dark:text-muted-foreground">
              Public readiness needs one accepted non-self verification tied to anchored proof or
              context. This keeps the portfolio proof-first instead of self-claimed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-proofound-stone bg-proofound-parchment/60 p-4 text-sm text-proofound-charcoal dark:border-border dark:bg-muted dark:text-foreground">
              <p className="font-medium">What happens next</p>
              <p className="mt-1 text-proofound-charcoal/70 dark:text-muted-foreground">
                Request verification for the Proof Pack before publishing. Once it is accepted, the
                portfolio can become public-ready and matching can build from a verified trust
                signal.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/app/i/verifications')}
              >
                Open verification center
              </Button>
              <Button
                type="button"
                size="lg"
                className="bg-proofound-forest text-white hover:bg-proofound-forest/90"
                onClick={() => setPhase('publish_portfolio')}
              >
                Continue after verification is accepted
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {phase === 'publish_portfolio' ? (
        <Card className="mx-auto rounded-2xl border-proofound-stone dark:border-border">
          <CardHeader>
            <button
              type="button"
              onClick={() => setPhase('verification')}
              className="mb-4 inline-flex items-center gap-2 text-sm text-proofound-charcoal/70 transition-colors hover:text-proofound-forest dark:text-muted-foreground dark:hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to verification step
            </button>
            <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground">
              Publish portfolio
            </CardTitle>
            <CardDescription className="text-proofound-charcoal/70 dark:text-muted-foreground">
              Publish one real context-backed proof. Matching and deeper verification can come
              after.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-proofound-stone bg-proofound-parchment/60 p-4 text-sm text-proofound-charcoal dark:border-border dark:bg-muted dark:text-foreground">
              <p className="font-medium">Ready to publish</p>
              <p className="mt-2">
                <span className="font-medium">Handle:</span> {safeShell.handle}
              </p>
              <p className="mt-1">
                <span className="font-medium">Focus area:</span> {safeShell.focusArea}
              </p>
              <p className="mt-1">
                <span className="font-medium">Context:</span> {context.title}
              </p>
              <p className="mt-1">
                <span className="font-medium">Proof Pack claim:</span> {proofPack.claim}
              </p>
              <p className="mt-1">
                <span className="font-medium">Evidence item:</span> {proof.proofTitle}
              </p>
              <p className="mt-1">
                <span className="font-medium">Visibility:</span> Public portfolio-safe
              </p>
            </div>

            {error ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <div className="flex justify-end">
              <Button
                type="button"
                size="lg"
                disabled={isLoading}
                onClick={finalizeOnboarding}
                className="bg-proofound-forest text-white hover:bg-proofound-forest/90"
              >
                {isLoading ? 'Publishing portfolio...' : 'Publish portfolio'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
