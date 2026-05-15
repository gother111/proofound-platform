'use client';

import { type FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, FileUp, Link2, Loader2, UserRound } from 'lucide-react';

import { completeIndividualOnboarding } from '@/actions/onboarding';
import { PublicPortfolioReadyStep } from '@/components/onboarding/PublicPortfolioReadyStep';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  MAX_PROOF_UPLOAD_SIZE_BYTES,
  PROOF_ALLOWED_EXTENSIONS_LABEL,
  PROOF_FILE_ACCEPT_ATTRIBUTE,
} from '@/lib/proofs/constants';
import { uploadFile, validateFile } from '@/lib/upload';

type SetupPhase = 'basic_details' | 'artifact_input' | 'success';
type ArtifactInputMode = 'link' | 'file';
type ArtifactType = 'project' | 'document' | 'credential' | 'media' | 'reference' | 'other';
type ContextKind = 'work' | 'volunteering' | 'education_learning' | 'other_safe';
type ContextType = 'experience' | 'education' | 'volunteering';

const ARTIFACT_TYPE_OPTIONS: Array<{ value: ArtifactType; label: string }> = [
  { value: 'project', label: 'Project or work sample' },
  { value: 'document', label: 'Document' },
  { value: 'credential', label: 'Credential or certificate' },
  { value: 'media', label: 'Media or presentation' },
  { value: 'reference', label: 'Reference or attestation' },
  { value: 'other', label: 'Other proof artifact' },
];

const CONTEXT_KIND_OPTIONS: Array<{ value: ContextKind; label: string; type: ContextType }> = [
  { value: 'work', label: 'Work', type: 'experience' },
  { value: 'volunteering', label: 'Volunteering', type: 'volunteering' },
  { value: 'education_learning', label: 'Education or learning', type: 'education' },
  { value: 'other_safe', label: 'Other safe personal context', type: 'experience' },
];

const CONTEXT_COPY: Record<
  ContextKind,
  {
    titleLabel: string;
    titlePlaceholder: string;
    settingLabel: string;
    settingPlaceholder: string;
    focusLabel: string;
    focusPlaceholder: string;
    summaryPlaceholder: string;
    environmentPlaceholder: string;
    showCompanySize: boolean;
  }
> = {
  work: {
    titleLabel: 'Role, project, or focus *',
    titlePlaceholder: 'Product lead for onboarding launch',
    settingLabel: 'Organization or setting *',
    settingPlaceholder: 'Company, client, team, or project setting',
    focusLabel: 'Industry or domain',
    focusPlaceholder: 'SaaS, healthcare, public sector...',
    summaryPlaceholder: 'What was the work context around this artifact?',
    environmentPlaceholder: 'Remote launch team, cross-functional squad...',
    showCompanySize: true,
  },
  volunteering: {
    titleLabel: 'Volunteer role, project, or focus *',
    titlePlaceholder: 'Community onboarding lead',
    settingLabel: 'Organization or setting *',
    settingPlaceholder: 'Non-profit, mutual aid group, event, or community',
    focusLabel: 'Domain or focus',
    focusPlaceholder: 'Community support, climate, education...',
    summaryPlaceholder: 'What was the volunteering context around this artifact?',
    environmentPlaceholder: 'Local chapter, weekend event team, remote volunteer group...',
    showCompanySize: false,
  },
  education_learning: {
    titleLabel: 'Course, project, or learning focus *',
    titlePlaceholder: 'Applied research methods project',
    settingLabel: 'Institution or learning setting *',
    settingPlaceholder: 'School, course, bootcamp, mentor group, or self-study track',
    focusLabel: 'Domain or focus',
    focusPlaceholder: 'Data analysis, design research, operations...',
    summaryPlaceholder: 'What was the learning context around this artifact?',
    environmentPlaceholder: 'Cohort project, remote course, lab, independent study...',
    showCompanySize: false,
  },
  other_safe: {
    titleLabel: 'Project or focus *',
    titlePlaceholder: 'Personal operations project',
    settingLabel: 'Setting *',
    settingPlaceholder: 'Personal project, family context, community setting...',
    focusLabel: 'Domain or focus',
    focusPlaceholder: 'Operations, research, documentation...',
    summaryPlaceholder: 'What safe context should this artifact be anchored to?',
    environmentPlaceholder: 'Solo project, local setting, distributed collaboration...',
    showCompanySize: false,
  },
};

const SCOPE_OPTIONS = [
  { value: '', label: 'Choose scope' },
  { value: 'local', label: 'Local' },
  { value: 'regional', label: 'Regional' },
  { value: 'global', label: 'Global' },
  { value: 'remote_distributed', label: 'Remote or distributed' },
];

function contextTypeFor(kind: ContextKind): ContextType {
  return CONTEXT_KIND_OPTIONS.find((option) => option.value === kind)?.type || 'experience';
}

function deriveProofTitleFromUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    const lastSegment = parsed.pathname.replace(/\/+$/, '').split('/').filter(Boolean).pop();
    return lastSegment
      ? decodeURIComponent(lastSegment).replace(/[-_]+/g, ' ').trim()
      : parsed.hostname;
  } catch {
    return 'First proof artifact';
  }
}

function parseSkills(value: string) {
  return value
    .split(/[\n,]/)
    .map((skill) => skill.trim())
    .filter(Boolean);
}

function StepRail({ phase }: { phase: Exclude<SetupPhase, 'success'> }) {
  const steps = [
    { id: 'basic_details', label: 'Basic details', icon: UserRound },
    { id: 'artifact_input', label: 'One proof artifact', icon: Link2 },
  ] as const;
  const activeIndex = steps.findIndex((step) => step.id === phase);

  return (
    <div className="grid gap-3 sm:grid-cols-2" data-testid="individual-setup-steps">
      {steps.map((step, index) => {
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
  const [phase, setPhase] = useState<SetupPhase>('basic_details');
  const [basicDetails, setBasicDetails] = useState({
    firstName: '',
    lastName: '',
    residence: '',
  });
  const [proof, setProof] = useState({
    inputMode: 'link' as ArtifactInputMode,
    artifactType: 'project' as ArtifactType,
    proofUrl: '',
    uploadedFileId: '',
    fileName: '',
    proofTitle: '',
    proofSummary: '',
  });
  const [contextKind, setContextKind] = useState<ContextKind>('work');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nextPath, setNextPath] = useState('/app/i/profile');
  const [publicPortfolioUrl, setPublicPortfolioUrl] = useState('');
  const [portfolioReady, setPortfolioReady] = useState(false);
  const contextCopy = CONTEXT_COPY[contextKind];

  function submitBasicDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setBasicDetails({
      firstName: String(formData.get('firstName') || '').trim(),
      lastName: String(formData.get('lastName') || '').trim(),
      residence: String(formData.get('residence') || '').trim(),
    });
    setError(null);
    setPhase('artifact_input');
  }

  async function handleFileSelected(file: File | null) {
    if (!file) return;

    const validation = validateFile(file, 'document', { category: 'proof' });
    if (!validation.valid) {
      setUploadError(validation.error || 'Choose a supported proof file.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setProof((current) => ({
      ...current,
      inputMode: 'file',
      uploadedFileId: '',
      fileName: file.name,
      proofTitle: current.proofTitle || file.name.replace(/\.[^.]+$/, ''),
    }));

    try {
      const result = await uploadFile({
        file,
        type: 'document',
        category: 'proof',
        profileType: 'individual',
      });

      if (!result.success || !result.uploadedFileId) {
        setUploadError(result.message || result.error || 'Upload failed. Please try again.');
        return;
      }

      setProof((current) => ({
        ...current,
        inputMode: 'file',
        proofUrl: result.url || current.proofUrl,
        uploadedFileId: result.uploadedFileId || '',
        fileName: result.artifactDisplayName || result.fileName || file.name,
        proofTitle:
          current.proofTitle ||
          result.artifactDisplayName ||
          result.fileName ||
          file.name.replace(/\.[^.]+$/, ''),
      }));
    } catch {
      setUploadError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }

  async function submitArtifact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const inputMode = String(formData.get('artifactInputMode') || 'link') as ArtifactInputMode;
    const artifactType = String(formData.get('artifactType') || 'project') as ArtifactType;
    const proofUrl = String(formData.get('proofUrl') || '').trim();
    const proofTitle = String(formData.get('proofTitle') || '').trim();
    const proofSummary = String(formData.get('proofSummary') || '').trim();
    const finalProofTitle =
      proofTitle || (proofUrl ? deriveProofTitleFromUrl(proofUrl) : proof.fileName);
    const selectedContextKind = String(formData.get('contextKind') || 'work') as ContextKind;
    const contextType = contextTypeFor(selectedContextKind);
    const contextTitle = String(formData.get('contextTitle') || '').trim();
    const contextOrganizationName = String(formData.get('contextOrganizationName') || '').trim();
    const contextDuration = String(formData.get('contextDuration') || '').trim();
    const contextSummary = String(formData.get('contextSummary') || '').trim();
    const contextOutcome = String(formData.get('contextOutcome') || '').trim();
    const contextCompanySize =
      selectedContextKind === 'work' ? String(formData.get('contextCompanySize') || '').trim() : '';
    const contextFocusArea = String(formData.get('contextFocusArea') || '').trim();
    const contextScope = String(formData.get('contextScope') || '').trim();
    const contextOperatingEnvironment = String(
      formData.get('contextOperatingEnvironment') || ''
    ).trim();
    const secondaryContextNote = String(formData.get('secondaryContextNote') || '').trim();
    const proofPackSkills = String(formData.get('proofPackSkills') || '').trim();

    if (inputMode === 'link' && !proofUrl) {
      setError('Add one proof link before saving.');
      setIsLoading(false);
      return;
    }

    if (inputMode === 'file' && !proof.uploadedFileId) {
      setError('Upload one proof file before saving.');
      setIsLoading(false);
      return;
    }

    if (!finalProofTitle || !proofSummary) {
      setError('Add a title and a short note for this proof artifact.');
      setIsLoading(false);
      return;
    }

    if (!contextTitle || !contextOrganizationName || !contextDuration || !contextSummary) {
      setError('Anchor this artifact to one real private context before saving.');
      setIsLoading(false);
      return;
    }

    const skillCount = parseSkills(proofPackSkills).length;
    if (skillCount < 3 || skillCount > 5) {
      setError('Add 3 to 5 skills this proof actually supports.');
      setIsLoading(false);
      return;
    }

    try {
      const onboardingData = new FormData();
      const displayName = `${basicDetails.firstName} ${basicDetails.lastName}`.trim();
      onboardingData.set('firstName', basicDetails.firstName);
      onboardingData.set('lastName', basicDetails.lastName);
      onboardingData.set('displayName', displayName);
      onboardingData.set('residence', basicDetails.residence);
      onboardingData.set('cityOrResidence', basicDetails.residence);
      onboardingData.set('location', basicDetails.residence);

      onboardingData.set('artifactInputMode', inputMode);
      onboardingData.set('artifactType', artifactType);
      onboardingData.set('proofInputType', inputMode);
      onboardingData.set('proofArtifactType', artifactType);
      onboardingData.set('proofUrl', proofUrl);
      onboardingData.set('uploadedFileId', proof.uploadedFileId);
      onboardingData.set('proofUploadedFileId', proof.uploadedFileId);
      onboardingData.set('proofFileName', proof.fileName);
      onboardingData.set('proofTitle', finalProofTitle);
      onboardingData.set('proofSummary', proofSummary);

      onboardingData.set('contextKind', selectedContextKind);
      onboardingData.set('contextType', contextType);
      onboardingData.set('contextTitle', contextTitle);
      onboardingData.set('contextOrganizationName', contextOrganizationName);
      onboardingData.set('contextDuration', contextDuration);
      onboardingData.set('contextSummary', contextSummary);
      onboardingData.set('contextOutcome', contextOutcome);
      onboardingData.set('contextCompanySize', contextCompanySize);
      onboardingData.set('contextIndustryDomain', contextFocusArea);
      onboardingData.set('contextFocusArea', contextFocusArea);
      onboardingData.set('contextScope', contextScope);
      onboardingData.set('contextOperatingEnvironment', contextOperatingEnvironment);
      onboardingData.set('secondaryContextNote', secondaryContextNote);

      onboardingData.set('proofPackClaim', finalProofTitle);
      onboardingData.set(
        'proofPackOwnership',
        'I owned the contribution shown in this proof inside this context.'
      );
      onboardingData.set('proofPackOutcome', contextOutcome || proofSummary);
      onboardingData.set('proofPackSkills', proofPackSkills);

      const result = await completeIndividualOnboarding(onboardingData);

      if (result.error) {
        setError(result.error);
        return;
      }

      setProof((current) => ({
        ...current,
        inputMode,
        artifactType,
        proofUrl,
        proofTitle: finalProofTitle,
        proofSummary,
      }));
      setPortfolioReady(Boolean(result.portfolioReady && result.publicPortfolioUrl));
      setPublicPortfolioUrl(result.publicPortfolioUrl || '');
      setNextPath(result.scaffoldProfilePath || '/app/i/profile');
      setPhase('success');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  if (phase === 'success') {
    if (portfolioReady && publicPortfolioUrl) {
      return (
        <PublicPortfolioReadyStep
          persona="individual"
          publicPortfolioUrl={publicPortfolioUrl}
          onContinue={() => router.push(nextPath)}
          continueLabel="Continue to scaffold profile"
        />
      );
    }

    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Card className="rounded-2xl border-proofound-stone dark:border-border">
          <CardHeader>
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-proofound-forest/10 text-proofound-forest">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground">
              First Proof Pack created
            </CardTitle>
            <CardDescription className="text-proofound-charcoal/70 dark:text-muted-foreground">
              Your scaffold profile now has one context-anchored Proof Pack. Verification is
              optional for this first milestone and can be added later.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-proofound-stone bg-proofound-parchment/60 p-4 text-sm text-proofound-charcoal dark:border-border dark:bg-muted dark:text-foreground">
              <p className="font-medium">{proof.proofTitle}</p>
              <p className="mt-1 text-proofound-charcoal/70 dark:text-muted-foreground">
                {proof.proofSummary}
              </p>
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                size="lg"
                className="bg-proofound-forest text-white hover:bg-proofound-forest/90"
                onClick={() => router.push(nextPath)}
              >
                Continue to scaffold profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-3">
        <h1 className="font-['Crimson_Pro'] text-3xl font-semibold text-proofound-charcoal dark:text-foreground">
          Start with one Proof Pack
        </h1>
        <p className="max-w-2xl text-sm text-proofound-charcoal/70 dark:text-muted-foreground">
          Add your name, where you are based, and one artifact that can become your first Proof
          Pack.
        </p>
        <StepRail phase={phase} />
      </div>

      {phase === 'basic_details' ? (
        <Card className="mx-auto rounded-2xl border-proofound-stone dark:border-border">
          <CardHeader>
            <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground">
              Basic details
            </CardTitle>
            <CardDescription className="text-proofound-charcoal/70 dark:text-muted-foreground">
              Name and residence only. The proof comes next.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitBasicDetails} className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <Label htmlFor="firstName">First name *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    required
                    defaultValue={basicDetails.firstName}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last name *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    required
                    defaultValue={basicDetails.lastName}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="residence">City or residence *</Label>
                <Input
                  id="residence"
                  name="residence"
                  required
                  defaultValue={basicDetails.residence}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="lg"
                  className="bg-proofound-forest text-white hover:bg-proofound-forest/90"
                >
                  Continue to proof artifact
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {phase === 'artifact_input' ? (
        <Card className="mx-auto rounded-2xl border-proofound-stone dark:border-border">
          <CardHeader>
            <button
              type="button"
              onClick={() => setPhase('basic_details')}
              className="mb-4 inline-flex items-center gap-2 text-sm text-proofound-charcoal/70 transition-colors hover:text-proofound-forest dark:text-muted-foreground dark:hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to basic details
            </button>
            <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground">
              Add one proof artifact
            </CardTitle>
            <CardDescription className="text-proofound-charcoal/70 dark:text-muted-foreground">
              Choose a link or a file, then anchor it to one real private context.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitArtifact} className="space-y-5">
              <div>
                <Label htmlFor="artifactType">Artifact type *</Label>
                <select
                  id="artifactType"
                  name="artifactType"
                  required
                  defaultValue={proof.artifactType}
                  className="flex h-11 w-full rounded-lg border border-proofound-stone bg-white px-4 py-2 text-base text-proofound-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest dark:border-border dark:bg-background dark:text-foreground"
                >
                  {ARTIFACT_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Artifact source *</Label>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-proofound-stone bg-white p-3 text-sm text-proofound-charcoal dark:border-border dark:bg-background dark:text-foreground">
                    <input
                      type="radio"
                      name="artifactInputMode"
                      value="link"
                      checked={proof.inputMode === 'link'}
                      onChange={() => setProof((current) => ({ ...current, inputMode: 'link' }))}
                    />
                    <Link2 className="h-4 w-4 text-proofound-forest" />
                    Link
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-proofound-stone bg-white p-3 text-sm text-proofound-charcoal dark:border-border dark:bg-background dark:text-foreground">
                    <input
                      type="radio"
                      name="artifactInputMode"
                      value="file"
                      checked={proof.inputMode === 'file'}
                      onChange={() => setProof((current) => ({ ...current, inputMode: 'file' }))}
                    />
                    <FileUp className="h-4 w-4 text-proofound-forest" />
                    File upload
                  </label>
                </div>
              </div>

              {proof.inputMode === 'link' ? (
                <div>
                  <Label htmlFor="proofUrl">Proof link *</Label>
                  <Input
                    id="proofUrl"
                    name="proofUrl"
                    type="url"
                    placeholder="https://..."
                    defaultValue={proof.proofUrl}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="proofFile">Proof file *</Label>
                  <Input
                    id="proofFile"
                    type="file"
                    accept={PROOF_FILE_ACCEPT_ATTRIBUTE}
                    onChange={(event) => void handleFileSelected(event.target.files?.[0] || null)}
                  />
                  <p className="text-xs text-proofound-charcoal/60 dark:text-muted-foreground">
                    {PROOF_ALLOWED_EXTENSIONS_LABEL}. Max{' '}
                    {Math.round(MAX_PROOF_UPLOAD_SIZE_BYTES / 1024 / 1024)} MB.
                  </p>
                  {proof.fileName ? (
                    <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground">
                      Selected: {proof.fileName}
                    </p>
                  ) : null}
                  {isUploading ? (
                    <p className="flex items-center gap-2 text-sm text-proofound-charcoal/70 dark:text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading proof...
                    </p>
                  ) : null}
                  {uploadError ? <p className="text-sm text-red-600">{uploadError}</p> : null}
                </div>
              )}

              <div>
                <Label htmlFor="proofTitle">Proof title *</Label>
                <Input
                  id="proofTitle"
                  name="proofTitle"
                  required
                  defaultValue={proof.proofTitle}
                  placeholder="Launch memo, certificate, demo, reference..."
                />
              </div>

              <div>
                <Label htmlFor="proofSummary">Short proof note *</Label>
                <textarea
                  id="proofSummary"
                  name="proofSummary"
                  required
                  defaultValue={proof.proofSummary}
                  rows={4}
                  className="flex w-full rounded-lg border border-proofound-stone bg-white px-4 py-3 text-base text-proofound-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest dark:border-border dark:bg-background dark:text-foreground"
                  placeholder="What does this artifact prove?"
                />
              </div>

              <div className="rounded-xl border border-proofound-stone bg-proofound-parchment/40 p-4 dark:border-border dark:bg-muted/40">
                <div className="mb-4">
                  <h2 className="font-['Crimson_Pro'] text-xl font-semibold text-proofound-charcoal dark:text-foreground">
                    Anchor it to one real private context
                  </h2>
                  <p className="mt-1 text-sm text-proofound-charcoal/70 dark:text-muted-foreground">
                    This is the required primary anchor. Secondary context is optional.
                  </p>
                </div>

                <div className="space-y-5">
                  <div>
                    <Label htmlFor="contextKind">What does this artifact relate to? *</Label>
                    <select
                      id="contextKind"
                      name="contextKind"
                      required
                      value={contextKind}
                      onChange={(event) => setContextKind(event.target.value as ContextKind)}
                      className="flex h-11 w-full rounded-lg border border-proofound-stone bg-white px-4 py-2 text-base text-proofound-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest dark:border-border dark:bg-background dark:text-foreground"
                    >
                      {CONTEXT_KIND_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <Label htmlFor="contextTitle">{contextCopy.titleLabel}</Label>
                      <Input
                        id="contextTitle"
                        name="contextTitle"
                        required
                        placeholder={contextCopy.titlePlaceholder}
                      />
                    </div>
                    <div>
                      <Label htmlFor="contextOrganizationName">{contextCopy.settingLabel}</Label>
                      <Input
                        id="contextOrganizationName"
                        name="contextOrganizationName"
                        required
                        placeholder={contextCopy.settingPlaceholder}
                      />
                    </div>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <Label htmlFor="contextDuration">When did this happen? *</Label>
                      <Input
                        id="contextDuration"
                        name="contextDuration"
                        required
                        placeholder="Spring 2026, 2024-2025, one week..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="contextFocusArea">{contextCopy.focusLabel}</Label>
                      <Input
                        id="contextFocusArea"
                        name="contextFocusArea"
                        placeholder={contextCopy.focusPlaceholder}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="contextSummary">Context summary *</Label>
                    <textarea
                      id="contextSummary"
                      name="contextSummary"
                      required
                      rows={3}
                      placeholder={contextCopy.summaryPlaceholder}
                      className="flex w-full rounded-lg border border-proofound-stone bg-white px-4 py-3 text-base text-proofound-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest dark:border-border dark:bg-background dark:text-foreground"
                    />
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    {contextCopy.showCompanySize ? (
                      <div>
                        <Label htmlFor="contextCompanySize">Company or team size</Label>
                        <select
                          id="contextCompanySize"
                          name="contextCompanySize"
                          className="flex h-11 w-full rounded-lg border border-proofound-stone bg-white px-4 py-2 text-base text-proofound-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest dark:border-border dark:bg-background dark:text-foreground"
                        >
                          <option value="">Choose size</option>
                          <option value="1-10">1-10</option>
                          <option value="11-50">11-50</option>
                          <option value="51-200">51-200</option>
                          <option value="201-500">201-500</option>
                          <option value="501-1000">501-1000</option>
                          <option value="1001-5000">1001-5000</option>
                          <option value="5001+">5001+</option>
                        </select>
                      </div>
                    ) : null}
                    <div>
                      <Label htmlFor="contextScope">Scope</Label>
                      <select
                        id="contextScope"
                        name="contextScope"
                        className="flex h-11 w-full rounded-lg border border-proofound-stone bg-white px-4 py-2 text-base text-proofound-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest dark:border-border dark:bg-background dark:text-foreground"
                      >
                        {SCOPE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <Label htmlFor="contextOperatingEnvironment">Operating environment</Label>
                      <Input
                        id="contextOperatingEnvironment"
                        name="contextOperatingEnvironment"
                        placeholder={contextCopy.environmentPlaceholder}
                      />
                    </div>
                    <div>
                      <Label htmlFor="contextOutcome">Outcome or contribution</Label>
                      <Input
                        id="contextOutcome"
                        name="contextOutcome"
                        placeholder="Optional: what changed or what you contributed"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="secondaryContextNote">Secondary context link</Label>
                    <Input
                      id="secondaryContextNote"
                      name="secondaryContextNote"
                      placeholder="Optional: another context this proof touches"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="proofPackSkills">3 to 5 skills this proof supports *</Label>
                <textarea
                  id="proofPackSkills"
                  name="proofPackSkills"
                  required
                  rows={3}
                  className="flex w-full rounded-lg border border-proofound-stone bg-white px-4 py-3 text-base text-proofound-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest dark:border-border dark:bg-background dark:text-foreground"
                  placeholder="Documentation, volunteer coordination, onboarding design"
                />
              </div>

              {error ? (
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
                  {error}
                </p>
              ) : null}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="lg"
                  className="bg-proofound-forest text-white hover:bg-proofound-forest/90"
                  disabled={isLoading || isUploading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving first proof...
                    </>
                  ) : (
                    'Save first proof'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
