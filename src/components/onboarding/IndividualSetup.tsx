'use client';

import { useState } from 'react';
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
  | 'optional_verification'
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
  summary: string;
  duration: string;
  outcomes: string;
  projects: string;
  collaboration: string;
  achievement: string;
  degree: string;
  skills: string;
  cause: string;
  impact: string;
  skillsDeployed: string;
  personalWhy: string;
};

type ProofState = {
  proofUrl: string;
  proofTitle: string;
  proofSummary: string;
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
  { id: 'optional_verification', label: 'Optional verification', icon: BadgeCheck },
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
  summary: '',
  duration: '',
  outcomes: '',
  projects: '',
  collaboration: '',
  achievement: '',
  degree: '',
  skills: '',
  cause: '',
  impact: '',
  skillsDeployed: '',
  personalWhy: '',
};

const EMPTY_PROOF: ProofState = {
  proofUrl: '',
  proofTitle: '',
  proofSummary: '',
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
      formData.set('contextSummary', context.summary);
      formData.set('contextDuration', context.duration);
      formData.set('contextOutcomes', context.outcomes);
      formData.set('contextProjects', context.projects);
      formData.set('contextCollaboration', context.collaboration);
      formData.set('contextAchievement', context.achievement);
      formData.set('contextDegree', context.degree);
      formData.set('contextSkills', context.skills);
      formData.set('contextCause', context.cause);
      formData.set('contextImpact', context.impact);
      formData.set('contextSkillsDeployed', context.skillsDeployed);
      formData.set('contextPersonalWhy', context.personalWhy);

      formData.set('proofUrl', proof.proofUrl);
      formData.set('proofTitle', proof.proofTitle);
      formData.set('proofSummary', proof.proofSummary);

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
      summary: String(formData.get('summary') || '').trim(),
      duration: String(formData.get('duration') || '').trim(),
      outcomes: String(formData.get('outcomes') || '').trim(),
      projects: String(formData.get('projects') || '').trim(),
      collaboration: String(formData.get('collaboration') || '').trim(),
      achievement: String(formData.get('achievement') || '').trim(),
      degree: String(formData.get('degree') || '').trim(),
      skills: String(formData.get('skills') || '').trim(),
      cause: String(formData.get('cause') || '').trim(),
      impact: String(formData.get('impact') || '').trim(),
      skillsDeployed: String(formData.get('skillsDeployed') || '').trim(),
      personalWhy: String(formData.get('personalWhy') || '').trim(),
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
    setError(null);
    setPhase('proof_pack');
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
            <form action={handleSafeShellSubmit} className="space-y-5">
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
            <form action={handleContextSubmit} className="space-y-5">
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
                    placeholder="What was the role, program, or initiative?"
                    required
                    defaultValue={context.title}
                  />
                </div>
                <div>
                  <Label htmlFor="organizationName">Organization or institution *</Label>
                  <Input
                    id="organizationName"
                    name="organizationName"
                    placeholder="Where did this happen?"
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
                    placeholder="What setting should the proof be read inside?"
                    required
                    defaultValue={context.summary}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="outcomes">Outcome or impact *</Label>
                <textarea
                  id="outcomes"
                  name="outcomes"
                  required
                  defaultValue={context.outcomes}
                  placeholder="What changed, improved, or mattered?"
                  className="flex min-h-[110px] w-full rounded-lg border border-proofound-stone bg-white px-4 py-2 text-base text-proofound-charcoal transition-colors placeholder:text-proofound-charcoal/40 focus-visible:border-proofound-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest dark:border-border dark:bg-background dark:text-foreground dark:placeholder:text-muted-foreground/40"
                />
              </div>

              <div>
                <Label htmlFor="projects">Work or project summary *</Label>
                <textarea
                  id="projects"
                  name="projects"
                  required
                  defaultValue={context.projects}
                  placeholder="What did you build, deliver, learn, or contribute?"
                  className="flex min-h-[110px] w-full rounded-lg border border-proofound-stone bg-white px-4 py-2 text-base text-proofound-charcoal transition-colors placeholder:text-proofound-charcoal/40 focus-visible:border-proofound-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest dark:border-border dark:bg-background dark:text-foreground dark:placeholder:text-muted-foreground/40"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <Label htmlFor="collaboration">Collaboration or supporting detail *</Label>
                  <textarea
                    id="collaboration"
                    name="collaboration"
                    required
                    defaultValue={context.collaboration}
                    placeholder="Who was involved, or what capability did this build?"
                    className="flex min-h-[110px] w-full rounded-lg border border-proofound-stone bg-white px-4 py-2 text-base text-proofound-charcoal transition-colors placeholder:text-proofound-charcoal/40 focus-visible:border-proofound-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest dark:border-border dark:bg-background dark:text-foreground dark:placeholder:text-muted-foreground/40"
                  />
                </div>
                <div>
                  <Label htmlFor="achievement">What should stand out? *</Label>
                  <textarea
                    id="achievement"
                    name="achievement"
                    required
                    defaultValue={context.achievement}
                    placeholder="Call out the strongest result, growth, or contribution."
                    className="flex min-h-[110px] w-full rounded-lg border border-proofound-stone bg-white px-4 py-2 text-base text-proofound-charcoal transition-colors placeholder:text-proofound-charcoal/40 focus-visible:border-proofound-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest dark:border-border dark:bg-background dark:text-foreground dark:placeholder:text-muted-foreground/40"
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <Label htmlFor="degree">Degree or learning path</Label>
                  <Input
                    id="degree"
                    name="degree"
                    placeholder="Used when the context is education or learning"
                    defaultValue={context.degree}
                  />
                </div>
                <div>
                  <Label htmlFor="skills">Skills gained or practiced</Label>
                  <Input
                    id="skills"
                    name="skills"
                    placeholder="Used when the context is education or learning"
                    defaultValue={context.skills}
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <Label htmlFor="cause">Cause</Label>
                  <Input
                    id="cause"
                    name="cause"
                    placeholder="Used when the context is volunteering"
                    defaultValue={context.cause}
                  />
                </div>
                <div>
                  <Label htmlFor="impact">Volunteering impact</Label>
                  <Input
                    id="impact"
                    name="impact"
                    placeholder="Used when the context is volunteering"
                    defaultValue={context.impact}
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <Label htmlFor="skillsDeployed">Skills deployed</Label>
                  <Input
                    id="skillsDeployed"
                    name="skillsDeployed"
                    placeholder="Used when the context is volunteering"
                    defaultValue={context.skillsDeployed}
                  />
                </div>
                <div>
                  <Label htmlFor="personalWhy">Personal why</Label>
                  <Input
                    id="personalWhy"
                    name="personalWhy"
                    placeholder="Used when the context is volunteering"
                    defaultValue={context.personalWhy}
                  />
                </div>
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
              One real proof is enough for day one. You can add more after publishing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handleProofSubmit} className="space-y-5">
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
                <Label htmlFor="proofSummary">What does this proof show? *</Label>
                <textarea
                  id="proofSummary"
                  name="proofSummary"
                  required
                  defaultValue={proof.proofSummary}
                  placeholder="Describe the evidence, what it proves, and why it matters."
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
              We&apos;ll publish one proof with its anchor context. Keep the first Proof Pack clean
              and specific.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-proofound-stone bg-proofound-parchment/60 p-4 text-sm text-proofound-charcoal dark:border-border dark:bg-muted dark:text-foreground">
              <p className="font-medium">Proof Pack preview</p>
              <p className="mt-2">
                <span className="font-medium">Context:</span> {context.title} at{' '}
                {context.organizationName}
              </p>
              <p className="mt-1">
                <span className="font-medium">Proof:</span> {proof.proofTitle}
              </p>
              <p className="mt-1 text-proofound-charcoal/70 dark:text-muted-foreground">
                {proof.proofSummary}
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                size="lg"
                className="bg-proofound-forest text-white hover:bg-proofound-forest/90"
                onClick={() => setPhase('optional_verification')}
              >
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {phase === 'optional_verification' ? (
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
              Optional verification
            </CardTitle>
            <CardDescription className="text-proofound-charcoal/70 dark:text-muted-foreground">
              Verification can wait. The locked MVP lets you publish first and request verification
              after.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-proofound-stone bg-proofound-parchment/60 p-4 text-sm text-proofound-charcoal dark:border-border dark:bg-muted dark:text-foreground">
              <p className="font-medium">What happens next</p>
              <p className="mt-1 text-proofound-charcoal/70 dark:text-muted-foreground">
                We&apos;ll keep your portfolio calm and public-safe. You can request verification
                from the app once this first proof is live.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/app/i/verifications')}
              >
                Open verification center later
              </Button>
              <Button
                type="button"
                size="lg"
                className="bg-proofound-forest text-white hover:bg-proofound-forest/90"
                onClick={() => setPhase('publish_portfolio')}
              >
                Continue to publish
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
              onClick={() => setPhase('optional_verification')}
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
                <span className="font-medium">Proof:</span> {proof.proofTitle}
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
