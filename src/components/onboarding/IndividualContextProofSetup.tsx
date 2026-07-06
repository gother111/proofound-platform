'use client';

import { type FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileUp, Link2, Loader2, Plus, Send, Trash2, UserRound } from 'lucide-react';

import { completeIndividualOnboarding } from '@/actions/onboarding';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PublicPortfolioReadyStep } from '@/components/onboarding/PublicPortfolioReadyStep';
import { StartFromCvDialog } from '@/components/profile/StartFromCvDialog';
import { useStartFromCvBetaStatus } from '@/hooks/useStartFromCvBetaStatus';
import { START_FROM_CV_GUEST_FIRST_PROOF_SCAFFOLDING_SURFACE } from '@/lib/ai/start-from-cv-contract';
import type { StartFromCvScaffoldingSurface } from '@/lib/ai/start-from-cv-contract';
import {
  MAX_PROOF_UPLOAD_SIZE_BYTES,
  PROOF_ALLOWED_EXTENSIONS_LABEL,
  PROOF_FILE_ACCEPT_ATTRIBUTE,
} from '@/lib/proofs/constants';
import { uploadFile, validateFile } from '@/lib/upload';

type SetupPhase = 'basic_details' | 'artifact_input' | 'success';
type ArtifactInputMode = 'link' | 'file';
type ArtifactType = 'project' | 'document' | 'credential' | 'media' | 'reference' | 'other';
type ContributionMode = 'solo' | 'team';
type OwnershipLevel = 'created_all' | 'led_delivery' | 'owned_scope' | 'contributed_scope';
type VerificationAction = 'none' | 'draft' | 'send_now';
type VerificationRelationship =
  | 'client'
  | 'peer'
  | 'manager'
  | 'teacher'
  | 'collaborator'
  | 'organization_representative';
type VerificationConfirmer = {
  id: string;
  name: string;
  relationship: VerificationRelationship;
  email: string;
};
type MeasuredOutcomeDraft = {
  id: string;
  statement: string;
  value: string;
  timeframe: string;
};

const ARTIFACT_TYPE_OPTIONS: Array<{ value: ArtifactType; label: string }> = [
  { value: 'project', label: 'Project or work sample' },
  { value: 'document', label: 'Document' },
  { value: 'credential', label: 'Credential or certificate' },
  { value: 'media', label: 'Media or presentation' },
  { value: 'reference', label: 'Reference or confirmation' },
  { value: 'other', label: 'Other proof artifact' },
];

const ARTIFACT_TYPE_LABELS = ARTIFACT_TYPE_OPTIONS.reduce(
  (labels, option) => ({ ...labels, [option.value]: option.label }),
  {} as Record<ArtifactType, string>
);

const CONTRIBUTION_MODE_OPTIONS: Array<{ value: ContributionMode; label: string }> = [
  { value: 'solo', label: 'I created this alone' },
  { value: 'team', label: 'This was created with a team' },
];

const OWNERSHIP_LEVEL_OPTIONS: Array<{ value: OwnershipLevel; label: string }> = [
  { value: 'created_all', label: 'I created the artifact and the work it shows' },
  { value: 'led_delivery', label: 'I led delivery and coordinated the work' },
  { value: 'owned_scope', label: 'I owned a defined part of the work' },
  { value: 'contributed_scope', label: 'I contributed a specific part of the work' },
];

const VERIFICATION_RELATIONSHIP_OPTIONS: Array<{ value: VerificationRelationship; label: string }> =
  [
    { value: 'client', label: 'Client' },
    { value: 'peer', label: 'Peer' },
    { value: 'manager', label: 'Manager' },
    { value: 'teacher', label: 'Teacher' },
    { value: 'collaborator', label: 'Collaborator' },
    { value: 'organization_representative', label: 'Organization representative' },
  ];

const MAX_MEASURED_OUTCOMES = 3;
const MAX_VERIFICATION_CONFIRMERS = 2;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createOutcomeDraft(index: number): MeasuredOutcomeDraft {
  return {
    id: `outcome-${index + 1}`,
    statement: '',
    value: '',
    timeframe: '',
  };
}

function createConfirmerDraft(index: number): VerificationConfirmer {
  return {
    id: `confirmer-${index + 1}`,
    name: '',
    relationship: 'peer',
    email: '',
  };
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

function parseProofSkills(value: string) {
  return value
    .split(/[\n,]/)
    .map((skill) => skill.trim())
    .filter(Boolean);
}

function buildOwnershipStatement(
  contributionMode: ContributionMode,
  ownershipLevel: OwnershipLevel,
  ownershipNote: string
) {
  const modeLabel =
    contributionMode === 'solo' ? 'Created as solo work' : 'Created as part of a team effort';
  const ownershipLabel =
    OWNERSHIP_LEVEL_OPTIONS.find((option) => option.value === ownershipLevel)?.label ||
    'I owned a defined contribution';

  return `${modeLabel}. ${ownershipLabel}. ${ownershipNote}`.trim();
}

function mapRelationshipToCustomRequest(value: VerificationRelationship) {
  switch (value) {
    case 'client':
      return 'client';
    case 'manager':
      return 'manager';
    case 'teacher':
      return 'mentor_coach';
    case 'collaborator':
      return 'partner';
    case 'organization_representative':
      return 'external';
    case 'peer':
    default:
      return 'peer';
  }
}

function summarizeOutcomes(outcomes: MeasuredOutcomeDraft[]) {
  return outcomes
    .filter((outcome) => outcome.statement.trim())
    .slice(0, MAX_MEASURED_OUTCOMES)
    .map((outcome) =>
      [outcome.statement.trim(), outcome.value.trim(), outcome.timeframe.trim()]
        .filter(Boolean)
        .join(' · ')
    )
    .join('; ');
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
            aria-current={status === 'active' ? 'step' : undefined}
            className={`rounded-lg border p-3 text-sm ${
              status === 'active'
                ? 'border-proofound-forest bg-proofound-parchment/70'
                : status === 'completed'
                  ? 'border-emerald-200 bg-emerald-50/70'
                  : 'border-proofound-stone/60 bg-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-proofound-forest" aria-hidden="true" />
              <span className="font-medium text-proofound-charcoal">{step.label}</span>
              <span className="sr-only">
                {status === 'active'
                  ? 'Current step'
                  : status === 'completed'
                    ? 'Completed step'
                    : 'Upcoming step'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function IndividualSetup({
  completionPath,
  startFromCvScaffoldingSurface,
}: {
  completionPath?: string;
  startFromCvScaffoldingSurface?: StartFromCvScaffoldingSurface;
}) {
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
  const [measuredOutcomes, setMeasuredOutcomes] = useState<MeasuredOutcomeDraft[]>([
    createOutcomeDraft(0),
  ]);
  const [proofDetails, setProofDetails] = useState({
    contributionMode: 'solo' as ContributionMode,
    ownershipLevel: '' as OwnershipLevel | '',
    ownershipNote: '',
    proofPackSkills: '',
  });
  const [verificationAction, setVerificationAction] = useState<VerificationAction>('none');
  const [verificationConfirmers, setVerificationConfirmers] = useState<VerificationConfirmer[]>([
    createConfirmerDraft(0),
  ]);
  const [verificationFollowup, setVerificationFollowup] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCvImportOpen, setIsCvImportOpen] = useState(false);
  const [publicPortfolioUrl, setPublicPortfolioUrl] = useState('');
  const startFromCvStatus = useStartFromCvBetaStatus();
  const displayName = `${basicDetails.firstName} ${basicDetails.lastName}`.trim();
  const canUseStartFromCv =
    startFromCvScaffoldingSurface === START_FROM_CV_GUEST_FIRST_PROOF_SCAFFOLDING_SURFACE &&
    startFromCvStatus.visible &&
    startFromCvStatus.available;
  const proofSource =
    proof.inputMode === 'file'
      ? proof.fileName || 'Uploaded proof file'
      : proof.proofUrl || 'Linked proof artifact';
  const previewOutcome = summarizeOutcomes(measuredOutcomes);
  const previewOwnership =
    proofDetails.ownershipLevel && proofDetails.ownershipNote
      ? buildOwnershipStatement(
          proofDetails.contributionMode,
          proofDetails.ownershipLevel,
          proofDetails.ownershipNote
        )
      : 'Ownership details will come from the proof owner before this is sent.';
  const firstPreviewConfirmer = verificationConfirmers[0];
  const verificationPreview = [
    `Subject: Request to confirm a specific proof on Proofound`,
    '',
    `Hi ${firstPreviewConfirmer?.name.trim() || 'there'},`,
    '',
    `${displayName || 'A Proofound user'} is asking whether you can confirm a scoped part of work you saw directly.`,
    '',
    `Specific claim: ${proof.proofTitle || 'First proof artifact'}`,
    `Context: First proof record setup${displayName ? ` for ${displayName}` : ''}${
      basicDetails.residence ? ` in ${basicDetails.residence}` : ''
    }.`,
    `Artifact or evidence: ${ARTIFACT_TYPE_LABELS[proof.artifactType]} - ${proofSource}`,
    `Ownership: ${previewOwnership}`,
    `Observed behavior to confirm: ${
      proof.proofSummary || 'The concrete work shown by this artifact.'
    }`,
    `Optional outcome: ${previewOutcome || 'No outcome claim included in this request.'}`,
    '',
    'This is a scoped verification request, not a generic recommendation or whole-person endorsement. Email delivery only sends the invitation; verification depends on the secure review response.',
  ].join('\n');

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
    const contributionMode = proofDetails.contributionMode;
    const ownershipLevel = proofDetails.ownershipLevel;
    const ownershipNote = proofDetails.ownershipNote.trim();
    const proofPackSkills = proofDetails.proofPackSkills.trim();
    const skillCount = parseProofSkills(proofPackSkills).length;
    const normalizedOutcomes = measuredOutcomes
      .map((outcome, index) => ({
        id: outcome.id || `outcome-${index + 1}`,
        statement: outcome.statement.trim(),
        value: outcome.value.trim(),
        timeframe: outcome.timeframe.trim(),
      }))
      .filter((outcome) => outcome.statement || outcome.value || outcome.timeframe);

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

    if (!ownershipLevel || !ownershipNote) {
      setError('Describe what you owned in this specific proof before saving.');
      setIsLoading(false);
      return;
    }

    if (skillCount < 3 || skillCount > 5) {
      setError('Add 3 to 5 skills this proof actually supports.');
      setIsLoading(false);
      return;
    }

    if (normalizedOutcomes.some((outcome) => !outcome.statement)) {
      setError('Add what changed for each measured outcome, or leave the row empty.');
      setIsLoading(false);
      return;
    }

    const partiallyFilledConfirmers = verificationConfirmers.filter(
      (confirmer) =>
        confirmer.name.trim() || confirmer.email.trim() || confirmer.relationship !== 'peer'
    );
    const completeConfirmers = verificationConfirmers
      .map((confirmer) => ({
        name: confirmer.name.trim(),
        relationship: confirmer.relationship,
        email: confirmer.email.trim().toLowerCase(),
      }))
      .filter((confirmer) => confirmer.name || confirmer.email);

    if (verificationAction !== 'none') {
      if (completeConfirmers.length === 0) {
        setError(
          'Add at least one person who can confirm this work, or skip verification for now.'
        );
        setIsLoading(false);
        return;
      }

      if (
        partiallyFilledConfirmers.some(
          (confirmer) => !confirmer.name.trim() || !confirmer.email.trim()
        )
      ) {
        setError('Finish the confirmer name and email, or remove the partial row.');
        setIsLoading(false);
        return;
      }

      if (completeConfirmers.some((confirmer) => !EMAIL_PATTERN.test(confirmer.email))) {
        setError('Use a valid email address for each confirmer.');
        setIsLoading(false);
        return;
      }
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
      onboardingData.set('proofPackClaim', finalProofTitle);
      onboardingData.set(
        'proofPackOwnership',
        buildOwnershipStatement(contributionMode, ownershipLevel, ownershipNote)
      );
      onboardingData.set('proofContributionMode', contributionMode);
      onboardingData.set('proofOwnershipLevel', ownershipLevel);
      onboardingData.set('proofOwnershipNote', ownershipNote);
      onboardingData.set('proofPackSkills', proofPackSkills);
      onboardingData.set('firstProofVerificationAction', verificationAction);
      onboardingData.set('firstProofVerificationPreview', verificationPreview);
      onboardingData.set(
        'firstProofVerificationConfirmers',
        JSON.stringify(verificationAction === 'none' ? [] : completeConfirmers.slice(0, 2))
      );
      onboardingData.set(
        'proofPackMeasuredOutcomes',
        JSON.stringify(normalizedOutcomes.slice(0, MAX_MEASURED_OUTCOMES))
      );
      if (normalizedOutcomes.length > 0) {
        onboardingData.set(
          'proofPackOutcome',
          normalizedOutcomes
            .slice(0, MAX_MEASURED_OUTCOMES)
            .map((outcome) =>
              [outcome.statement, outcome.value, outcome.timeframe].filter(Boolean).join(' · ')
            )
            .join('; ')
        );
      }

      const result = await completeIndividualOnboarding(onboardingData);

      if (result.error) {
        setError(result.error);
        return;
      }

      let verificationMessage: string | null = null;
      if (verificationAction === 'send_now' && completeConfirmers.length > 0) {
        const artifact = result.firstProofVerificationArtifact;
        if (artifact?.id && artifact?.type) {
          const sendResults = await Promise.all(
            completeConfirmers.slice(0, 2).map(async (confirmer) => {
              try {
                const response = await fetch('/api/verification/requests/custom', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    verifierEmail: confirmer.email,
                    relationship: mapRelationshipToCustomRequest(confirmer.relationship),
                    message: verificationPreview,
                    artifacts: [{ type: artifact.type, id: artifact.id }],
                  }),
                });

                return response.ok;
              } catch {
                return false;
              }
            })
          );
          const sentCount = sendResults.filter(Boolean).length;
          verificationMessage =
            sentCount === completeConfirmers.length
              ? `Verification request sent to ${sentCount} confirmer${sentCount === 1 ? '' : 's'}.`
              : `First proof record saved. ${sentCount} of ${completeConfirmers.length} verification request emails sent.`;
        } else {
          verificationMessage =
            'First proof record saved. Verification request details were saved so you can send them later.';
        }
      } else if (verificationAction === 'draft' && completeConfirmers.length > 0) {
        verificationMessage =
          'Verification request saved without sending. You can send it after the first milestone.';
      }

      setProof((current) => ({
        ...current,
        inputMode,
        artifactType,
        proofUrl,
        proofTitle: finalProofTitle,
        proofSummary,
      }));
      setVerificationFollowup(verificationMessage);
      setPublicPortfolioUrl(
        result.publicPortfolioUrl ||
          (result.handle
            ? `${window.location.origin}/portfolio/${encodeURIComponent(result.handle)}`
            : '')
      );
      setPhase('success');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  async function publishPublicPortfolio() {
    const response = await fetch('/api/portfolio/visibility', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        publicPageEnabled: true,
        searchIndexingEnabled: false,
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      return {
        error:
          typeof payload?.error === 'string'
            ? payload.error
            : 'Could not publish your Public Page. You can try again from profile visibility.',
      };
    }

    return { success: true };
  }

  if (phase === 'success') {
    return (
      <PublicPortfolioReadyStep
        persona="individual"
        publicPortfolioUrl={publicPortfolioUrl}
        initiallyPublished={false}
        onPublish={publishPublicPortfolio}
        onContinue={() => router.push(completionPath || '/app/i/home')}
        continueLabel="Continue to home"
        onDecline={() => router.push('/app/i/home')}
        previewTitle={proof.proofTitle || 'First proof record'}
        previewDescription={
          proof.proofSummary ||
          'Your first structured proof can be shared as a public-safe portfolio link.'
        }
        notice={verificationFollowup}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-3">
        <h1 className="font-['Crimson_Pro'] text-3xl font-semibold text-proofound-charcoal dark:text-foreground">
          Start with one proof record
        </h1>
        <p className="max-w-2xl text-sm text-proofound-charcoal/70 dark:text-muted-foreground">
          Add your name, where you are based, and one artifact that can become your first proof
          record.
        </p>
        <StepRail phase={phase} />
      </div>

      {phase === 'basic_details' ? (
        <div className="space-y-5">
          {canUseStartFromCv ? (
            <Card className="mx-auto rounded-lg border-proofound-forest/25 bg-proofound-forest/5 dark:border-proofound-forest/30">
              <CardHeader>
                <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground">
                  Import your CV
                </CardTitle>
                <CardDescription className="text-proofound-charcoal/70 dark:text-muted-foreground">
                  Let Proofound draft private proof context from your CV before you build your first
                  proof record. You decide what to keep.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button
                    type="button"
                    className="bg-proofound-forest text-white hover:bg-proofound-forest/90"
                    onClick={() => setIsCvImportOpen(true)}
                  >
                    <FileUp className="mr-2 h-4 w-4" aria-hidden="true" />
                    Import your CV
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="justify-start text-proofound-charcoal/70 hover:text-proofound-forest dark:text-muted-foreground dark:hover:text-primary"
                    onClick={() => document.getElementById('firstName')?.focus()}
                  >
                    or start from scratch
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card className="mx-auto rounded-lg border-proofound-stone dark:border-border">
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
        </div>
      ) : null}

      {phase === 'artifact_input' ? (
        <Card className="mx-auto rounded-lg border-proofound-stone dark:border-border">
          <CardHeader>
            <button
              type="button"
              onClick={() => setPhase('basic_details')}
              className="mb-4 inline-flex items-center gap-2 text-sm text-proofound-charcoal/70 transition-colors hover:text-proofound-forest dark:text-muted-foreground dark:hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to basic details
            </button>
            <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground">
              Add one proof artifact
            </CardTitle>
            <CardDescription className="text-proofound-charcoal/70 dark:text-muted-foreground">
              Choose a link or a file. One artifact is enough to continue.
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
                  value={proof.artifactType}
                  onChange={(event) =>
                    setProof((current) => ({
                      ...current,
                      artifactType: event.target.value as ArtifactType,
                    }))
                  }
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
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-proofound-stone bg-white p-3 text-sm text-proofound-charcoal dark:border-border dark:bg-background dark:text-foreground">
                    <input
                      type="radio"
                      name="artifactInputMode"
                      value="link"
                      checked={proof.inputMode === 'link'}
                      onChange={() => setProof((current) => ({ ...current, inputMode: 'link' }))}
                    />
                    <Link2 className="h-4 w-4 text-proofound-forest" aria-hidden="true" />
                    Link
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-proofound-stone bg-white p-3 text-sm text-proofound-charcoal dark:border-border dark:bg-background dark:text-foreground">
                    <input
                      type="radio"
                      name="artifactInputMode"
                      value="file"
                      checked={proof.inputMode === 'file'}
                      onChange={() => setProof((current) => ({ ...current, inputMode: 'file' }))}
                    />
                    <FileUp className="h-4 w-4 text-proofound-forest" aria-hidden="true" />
                    File upload
                  </label>
                </div>
              </div>

              {proof.inputMode === 'link' ? (
                <div key="proof-link-input">
                  <Label htmlFor="proofUrl">Proof link *</Label>
                  <Input
                    id="proofUrl"
                    name="proofUrl"
                    type="url"
                    placeholder="https://..."
                    value={proof.proofUrl || ''}
                    onChange={(event) =>
                      setProof((current) => ({ ...current, proofUrl: event.target.value }))
                    }
                  />
                </div>
              ) : (
                <div key="proof-file-input" className="space-y-2">
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
                    <p
                      className="flex items-center gap-2 text-sm text-proofound-charcoal/70 dark:text-muted-foreground"
                      aria-live="polite"
                    >
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Uploading proof...
                    </p>
                  ) : null}
                  {uploadError ? (
                    <p className="text-sm text-red-600" role="alert">
                      {uploadError}
                    </p>
                  ) : null}
                </div>
              )}

              <div>
                <Label htmlFor="proofTitle">Proof title *</Label>
                <Input
                  id="proofTitle"
                  name="proofTitle"
                  required
                  value={proof.proofTitle || ''}
                  onChange={(event) =>
                    setProof((current) => ({ ...current, proofTitle: event.target.value }))
                  }
                  placeholder="Launch memo, certificate, demo, reference..."
                />
              </div>

              <div>
                <Label htmlFor="proofSummary">What does this artifact show? *</Label>
                <textarea
                  id="proofSummary"
                  name="proofSummary"
                  required
                  value={proof.proofSummary || ''}
                  onChange={(event) =>
                    setProof((current) => ({ ...current, proofSummary: event.target.value }))
                  }
                  rows={4}
                  className="flex w-full rounded-lg border border-proofound-stone bg-white px-4 py-3 text-base text-proofound-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest dark:border-border dark:bg-background dark:text-foreground"
                  placeholder="Describe the concrete work, context, or evidence visible in this artifact."
                />
              </div>

              <div className="rounded-lg border border-proofound-stone bg-proofound-parchment/40 p-4 dark:border-border dark:bg-muted/40">
                <div className="mb-4">
                  <h2 className="font-['Crimson_Pro'] text-xl font-semibold text-proofound-charcoal dark:text-foreground">
                    Ownership for this proof
                  </h2>
                  <p className="mt-1 text-sm text-proofound-charcoal/70 dark:text-muted-foreground">
                    Keep this scoped to the artifact and the work it shows.
                  </p>
                </div>

                <div className="space-y-5">
                  <div>
                    <Label>Was this created alone or with a team? *</Label>
                    <div className="mt-2 grid gap-3 sm:grid-cols-2">
                      {CONTRIBUTION_MODE_OPTIONS.map((option) => (
                        <label
                          key={option.value}
                          className="flex cursor-pointer items-center gap-3 rounded-lg border border-proofound-stone bg-white p-3 text-sm text-proofound-charcoal dark:border-border dark:bg-background dark:text-foreground"
                        >
                          <input
                            type="radio"
                            name="proofContributionMode"
                            value={option.value}
                            checked={proofDetails.contributionMode === option.value}
                            onChange={() =>
                              setProofDetails((current) => ({
                                ...current,
                                contributionMode: option.value,
                              }))
                            }
                          />
                          {option.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="proofOwnershipLevel">What was your ownership? *</Label>
                    <select
                      id="proofOwnershipLevel"
                      name="proofOwnershipLevel"
                      required
                      value={proofDetails.ownershipLevel || ''}
                      onChange={(event) =>
                        setProofDetails((current) => ({
                          ...current,
                          ownershipLevel: event.target.value as OwnershipLevel,
                        }))
                      }
                      className="flex h-11 w-full rounded-lg border border-proofound-stone bg-white px-4 py-2 text-base text-proofound-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest dark:border-border dark:bg-background dark:text-foreground"
                    >
                      <option value="">Choose the closest claim</option>
                      {OWNERSHIP_LEVEL_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="proofOwnershipNote">Concrete ownership note *</Label>
                    <textarea
                      id="proofOwnershipNote"
                      name="proofOwnershipNote"
                      required
                      rows={3}
                      value={proofDetails.ownershipNote || ''}
                      onChange={(event) =>
                        setProofDetails((current) => ({
                          ...current,
                          ownershipNote: event.target.value,
                        }))
                      }
                      className="flex w-full rounded-lg border border-proofound-stone bg-white px-4 py-3 text-base text-proofound-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest dark:border-border dark:bg-background dark:text-foreground"
                      placeholder="Example: I owned the onboarding copy, evidence mapping, and final launch checklist."
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
                  value={proofDetails.proofPackSkills || ''}
                  onChange={(event) =>
                    setProofDetails((current) => ({
                      ...current,
                      proofPackSkills: event.target.value,
                    }))
                  }
                  className="flex w-full rounded-lg border border-proofound-stone bg-white px-4 py-3 text-base text-proofound-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest dark:border-border dark:bg-background dark:text-foreground"
                  placeholder="Documentation, stakeholder interviews, onboarding design"
                />
                <p className="mt-2 text-xs text-proofound-charcoal/60 dark:text-muted-foreground">
                  Use only skills visible in this artifact or the context around it.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Label>Measured outcomes</Label>
                    <p className="mt-1 text-xs text-proofound-charcoal/60 dark:text-muted-foreground">
                      Optional. These stay claimed until connected to supporting proof or scoped
                      verification.
                    </p>
                  </div>
                  {measuredOutcomes.length < MAX_MEASURED_OUTCOMES ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setMeasuredOutcomes((current) => [
                          ...current,
                          createOutcomeDraft(current.length),
                        ])
                      }
                    >
                      <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                      Add
                    </Button>
                  ) : null}
                </div>
                <div className="space-y-3">
                  {measuredOutcomes.map((outcome, index) => (
                    <div
                      key={outcome.id}
                      className="rounded-lg border border-proofound-stone bg-proofound-parchment/40 p-3 dark:border-border dark:bg-muted/40"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-proofound-charcoal dark:text-foreground">
                          Outcome {index + 1}
                        </p>
                        {measuredOutcomes.length > 1 ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setMeasuredOutcomes((current) =>
                                current.filter((item) => item.id !== outcome.id)
                              )
                            }
                            aria-label={`Remove outcome ${index + 1}`}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        ) : null}
                      </div>
                      <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.8fr)]">
                        <div>
                          <Label htmlFor={`${outcome.id}-statement`}>What changed?</Label>
                          <Input
                            id={`${outcome.id}-statement`}
                            value={outcome.statement ?? ''}
                            onChange={(event) =>
                              setMeasuredOutcomes((current) =>
                                current.map((item) =>
                                  item.id === outcome.id
                                    ? { ...item, statement: event.target.value }
                                    : item
                                )
                              )
                            }
                            placeholder="Reduced review time"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`${outcome.id}-value`}>Measure</Label>
                          <Input
                            id={`${outcome.id}-value`}
                            value={outcome.value ?? ''}
                            onChange={(event) =>
                              setMeasuredOutcomes((current) =>
                                current.map((item) =>
                                  item.id === outcome.id
                                    ? { ...item, value: event.target.value }
                                    : item
                                )
                              )
                            }
                            placeholder="23%"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`${outcome.id}-timeframe`}>Scope</Label>
                          <Input
                            id={`${outcome.id}-timeframe`}
                            value={outcome.timeframe ?? ''}
                            onChange={(event) =>
                              setMeasuredOutcomes((current) =>
                                current.map((item) =>
                                  item.id === outcome.id
                                    ? { ...item, timeframe: event.target.value }
                                    : item
                                )
                              )
                            }
                            placeholder="Q1 pilot"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-proofound-stone bg-white p-4 dark:border-border dark:bg-background">
                <div className="space-y-2">
                  <h2 className="font-['Crimson_Pro'] text-xl font-semibold text-proofound-charcoal dark:text-foreground">
                    Who can confirm this work?
                  </h2>
                  <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground">
                    Optional for the first proof record. Keep it scoped to what this person saw
                    happen.
                  </p>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {[
                    { value: 'none', label: 'Skip for now' },
                    { value: 'draft', label: 'Save without sending' },
                    { value: 'send_now', label: 'Send now' },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border border-proofound-stone bg-proofound-parchment/30 p-3 text-sm text-proofound-charcoal dark:border-border dark:bg-muted/30 dark:text-foreground"
                    >
                      <input
                        type="radio"
                        name="firstProofVerificationActionChoice"
                        value={option.value}
                        checked={verificationAction === option.value}
                        onChange={() => setVerificationAction(option.value as VerificationAction)}
                      />
                      {option.label}
                    </label>
                  ))}
                </div>

                {verificationAction !== 'none' ? (
                  <div className="mt-5 space-y-4">
                    <div className="space-y-3">
                      {verificationConfirmers.map((confirmer, index) => (
                        <div
                          key={confirmer.id}
                          className="rounded-lg border border-proofound-stone bg-proofound-parchment/40 p-3 dark:border-border dark:bg-muted/40"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium text-proofound-charcoal dark:text-foreground">
                              Confirmer {index + 1}
                            </p>
                            {verificationConfirmers.length > 1 ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setVerificationConfirmers((current) =>
                                    current.filter((item) => item.id !== confirmer.id)
                                  )
                                }
                                aria-label={`Remove confirmer ${index + 1}`}
                              >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                              </Button>
                            ) : null}
                          </div>
                          <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,1fr)]">
                            <div>
                              <Label htmlFor={`${confirmer.id}-name`}>Name</Label>
                              <Input
                                id={`${confirmer.id}-name`}
                                value={confirmer.name || ''}
                                onChange={(event) =>
                                  setVerificationConfirmers((current) =>
                                    current.map((item) =>
                                      item.id === confirmer.id
                                        ? { ...item, name: event.target.value }
                                        : item
                                    )
                                  )
                                }
                              />
                            </div>
                            <div>
                              <Label htmlFor={`${confirmer.id}-relationship`}>Relationship</Label>
                              <select
                                id={`${confirmer.id}-relationship`}
                                value={confirmer.relationship}
                                onChange={(event) =>
                                  setVerificationConfirmers((current) =>
                                    current.map((item) =>
                                      item.id === confirmer.id
                                        ? {
                                            ...item,
                                            relationship: event.target
                                              .value as VerificationRelationship,
                                          }
                                        : item
                                    )
                                  )
                                }
                                className="flex h-11 w-full rounded-lg border border-proofound-stone bg-white px-4 py-2 text-base text-proofound-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest dark:border-border dark:bg-background dark:text-foreground"
                              >
                                {VERIFICATION_RELATIONSHIP_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <Label htmlFor={`${confirmer.id}-email`}>Email</Label>
                              <Input
                                id={`${confirmer.id}-email`}
                                type="email"
                                value={confirmer.email || ''}
                                onChange={(event) =>
                                  setVerificationConfirmers((current) =>
                                    current.map((item) =>
                                      item.id === confirmer.id
                                        ? { ...item, email: event.target.value }
                                        : item
                                    )
                                  )
                                }
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {verificationConfirmers.length < MAX_VERIFICATION_CONFIRMERS ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setVerificationConfirmers((current) => [
                            ...current,
                            createConfirmerDraft(current.length),
                          ])
                        }
                      >
                        <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                        Add confirmer
                      </Button>
                    ) : null}

                    <div className="rounded-lg border border-proofound-stone bg-proofound-parchment/50 p-3 dark:border-border dark:bg-muted/40">
                      <p className="text-sm font-medium text-proofound-charcoal dark:text-foreground">
                        Email preview
                      </p>
                      <pre className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-proofound-charcoal/75 dark:text-muted-foreground">
                        {verificationPreview}
                      </pre>
                    </div>
                  </div>
                ) : null}
              </div>

              {error ? (
                <p
                  className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300"
                  role="alert"
                >
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
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      <span aria-live="polite">Saving first proof...</span>
                    </>
                  ) : verificationAction === 'send_now' ? (
                    <>
                      <Send className="mr-2 h-4 w-4" aria-hidden="true" />
                      Save and send request
                    </>
                  ) : (
                    'Save first proof record'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Dialog open={isCvImportOpen} onOpenChange={setIsCvImportOpen}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Start from your CV</DialogTitle>
            <DialogDescription>
              Private draft scaffolding only. Continue manually anytime.
            </DialogDescription>
          </DialogHeader>
          {startFromCvScaffoldingSurface ? (
            <StartFromCvDialog
              surface={startFromCvScaffoldingSurface}
              onApplyComplete={() => setIsCvImportOpen(false)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
