import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CAUSES_TAXONOMY } from '@/lib/taxonomy/data';
import { uploadFile, validateFile } from '@/lib/upload';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';
import type {
  ImpactStory,
  ImpactStoryArtifact,
  ImpactStoryArtifactKind,
  ImpactStoryOutcome,
  ImpactStoryOutcomeConfidence,
  ImpactStoryOutcomeValueMode,
  ImpactStoryVerificationRequestDispatchParams,
  ImpactStoryVerificationRequestDispatchResult,
  ImpactStoryVerificationRequestStatus,
  ImpactStoryRoleScope,
  ImpactStoryTimeline,
  ImpactStoryTimelineMode,
  ImpactStoryTimelinePrecision,
} from '@/types/profile';

interface ImpactStoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  story?: ImpactStory | null;
  onSave: (story: Omit<ImpactStory, 'id'>) => Promise<void> | void;
  onSaveExisting?: (storyId: string, story: Omit<ImpactStory, 'id'>) => Promise<void> | void;
  onSendVerificationRequest?: (
    params: ImpactStoryVerificationRequestDispatchParams
  ) =>
    | Promise<ImpactStoryVerificationRequestDispatchResult>
    | ImpactStoryVerificationRequestDispatchResult;
}

type OutcomeDraft = {
  id: string;
  change: string;
  value: string;
  unit: string;
  valueMode: ImpactStoryOutcomeValueMode;
  timeframe: string;
  baseline: string;
  after: string;
  confidence: ImpactStoryOutcomeConfidence;
};

type ArtifactDraft = ImpactStoryArtifact & {
  isUploading?: boolean;
  error?: string | null;
};

const ROLE_SCOPE_OPTIONS: Array<{ value: ImpactStoryRoleScope; label: string }> = [
  { value: 'owned', label: 'Owned' },
  { value: 'co_led', label: 'Co-led' },
  { value: 'contributed', label: 'Contributed' },
];

const OUTCOME_CONFIDENCE_OPTIONS: ImpactStoryOutcomeConfidence[] = [
  'exact',
  'estimated',
  'directional',
];

const ARTIFACT_KIND_OPTIONS: ImpactStoryArtifactKind[] = [
  'link',
  'file',
  'video',
  'doc',
  'image',
  'other',
];
const IMPACT_ARTIFACT_UPLOAD_RETRY_MESSAGE =
  'Artifact upload could not be saved. Your story details are still here; try again or choose another file.';
const IMPACT_STORY_SAVE_RETRY_MESSAGE =
  'Impact story could not be saved. Your story details are still here; review them and try again.';
const IMPACT_STORY_VERIFICATION_RETRY_MESSAGE =
  'Proof confirmation request could not be sent. Your story details are still here; review the verifier details and try again.';
const IMPACT_ARTIFACT_SAFE_UPLOAD_ERRORS = new Set([
  'The uploaded file type did not match its file signature.',
  'The uploaded file is not allowed for this proof or document flow.',
  'The uploaded file is too large for this upload flow.',
  'The upload could not be accepted for this flow.',
  'Security token could not be initialized. Please refresh and try again.',
  'Failed to upload file. Please try again.',
]);

function impactArtifactUploadErrorMessage(message: string) {
  if (IMPACT_ARTIFACT_SAFE_UPLOAD_ERRORS.has(message)) {
    return message;
  }

  dispatchClientErrorDiagnostic(
    'profile.impact_story.artifact_upload_returned_error',
    new Error(message)
  );
  return IMPACT_ARTIFACT_UPLOAD_RETRY_MESSAGE;
}

function createOutcomeDraft(seed?: Partial<OutcomeDraft>): OutcomeDraft {
  return {
    id: seed?.id || crypto.randomUUID(),
    change: seed?.change || '',
    value: seed?.value || '',
    unit: seed?.unit || '',
    valueMode: seed?.valueMode || 'absolute',
    timeframe: seed?.timeframe || '',
    baseline: seed?.baseline || '',
    after: seed?.after || '',
    confidence: seed?.confidence || 'exact',
  };
}

function createArtifactDraft(seed?: Partial<ArtifactDraft>): ArtifactDraft {
  return {
    id: seed?.id || crypto.randomUUID(),
    kind: seed?.kind || 'link',
    title: seed?.title || '',
    url: seed?.url || '',
    filePath: seed?.filePath || null,
    mimeType: seed?.mimeType || null,
    isUploading: false,
    error: null,
  };
}

function formatTimelineForLegacy(timeline: ImpactStoryTimeline): string {
  if (timeline.mode === 'single') {
    return timeline.start;
  }

  if (timeline.ongoing) {
    return `${timeline.start} - Present`;
  }

  return timeline.end ? `${timeline.start} - ${timeline.end}` : timeline.start;
}

function getVerificationStatusLabel(status: ImpactStoryVerificationRequestStatus | null) {
  if (!status) return null;
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function hasMetricValue(value: string) {
  return value.trim().length > 0;
}

function formatOutcomeSummary(outcome: ImpactStoryOutcome) {
  const changeText = (outcome.change || outcome.label || '').trim();
  if (!changeText) return null;

  const hasValue = outcome.value !== null && outcome.value !== undefined;
  if (!hasValue) {
    return changeText;
  }

  const renderedValue = String(outcome.value).trim();
  if (!renderedValue) {
    return changeText;
  }

  const unitSuffix = outcome.unit?.trim() ? ` ${outcome.unit.trim()}` : '';
  return `${changeText}: ${renderedValue}${unitSuffix}`;
}

export function ImpactStoryForm({
  open,
  onOpenChange,
  story,
  onSave,
  onSaveExisting,
  onSendVerificationRequest,
}: ImpactStoryFormProps) {
  const [title, setTitle] = useState('');
  const [timelineMode, setTimelineMode] = useState<ImpactStoryTimelineMode>('range');
  const [timelinePrecision, setTimelinePrecision] = useState<ImpactStoryTimelinePrecision>('date');
  const [timelineStart, setTimelineStart] = useState('');
  const [timelineEnd, setTimelineEnd] = useState('');
  const [timelineOngoing, setTimelineOngoing] = useState(false);

  const [affiliationType, setAffiliationType] = useState<'organization' | 'individual'>(
    'organization'
  );
  const [affiliationDetails, setAffiliationDetails] = useState('');

  const [roleTitle, setRoleTitle] = useState('');
  const [roleScope, setRoleScope] = useState<ImpactStoryRoleScope>('contributed');

  const [primaryCause, setPrimaryCause] = useState('');
  const [secondaryCauses, setSecondaryCauses] = useState<string[]>([]);

  const [outcomes, setOutcomes] = useState<OutcomeDraft[]>([createOutcomeDraft()]);
  const [artifacts, setArtifacts] = useState<ArtifactDraft[]>([]);

  const [verifierEmail, setVerifierEmail] = useState('');
  const [verifierName, setVerifierName] = useState('');
  const [verifierRelationship, setVerifierRelationship] = useState('');
  const [verificationMessage, setVerificationMessage] = useState('');
  const [verificationStatus, setVerificationStatus] =
    useState<ImpactStoryVerificationRequestStatus | null>(null);
  const [verificationRequestedAt, setVerificationRequestedAt] = useState<string | null>(null);
  const [verificationFeedbackMessage, setVerificationFeedbackMessage] = useState('');
  const [persistedStoryId, setPersistedStoryId] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  useEffect(() => {
    if (!open) return;

    if (story) {
      const structuredTimeline = story.timelineStructured;

      setTitle(story.title || '');
      setTimelineMode(structuredTimeline?.mode || 'range');
      setTimelinePrecision(structuredTimeline?.precision || 'date');
      setTimelineStart(structuredTimeline?.start || '');
      setTimelineEnd(structuredTimeline?.end || '');
      setTimelineOngoing(Boolean(structuredTimeline?.ongoing));

      setAffiliationType(story.affiliationType || 'organization');
      setAffiliationDetails(story.affiliationDetails || story.orgDescription || '');

      setRoleTitle(story.roleTitle || '');
      setRoleScope(story.roleScope || 'contributed');

      setPrimaryCause(story.primaryCause || '');
      setSecondaryCauses(story.secondaryCauses || []);

      if (story.measuredOutcomes?.length) {
        setOutcomes(
          story.measuredOutcomes.map((outcome) =>
            createOutcomeDraft({
              id: outcome.id,
              change: outcome.change || outcome.label || '',
              value:
                outcome.value !== null && outcome.value !== undefined ? String(outcome.value) : '',
              unit: outcome.unit || '',
              valueMode: outcome.valueMode || 'absolute',
              timeframe: outcome.timeframe || '',
              baseline:
                outcome.baseline !== null && outcome.baseline !== undefined
                  ? String(outcome.baseline)
                  : '',
              after:
                outcome.after !== null && outcome.after !== undefined ? String(outcome.after) : '',
              confidence: outcome.confidence || 'exact',
            })
          )
        );
      } else {
        setOutcomes([createOutcomeDraft()]);
      }

      setArtifacts(
        (story.supportingArtifacts || []).map((artifact) => createArtifactDraft(artifact))
      );
    } else {
      setTitle('');
      setTimelineMode('range');
      setTimelinePrecision('date');
      setTimelineStart('');
      setTimelineEnd('');
      setTimelineOngoing(false);

      setAffiliationType('organization');
      setAffiliationDetails('');

      setRoleTitle('');
      setRoleScope('contributed');

      setPrimaryCause('');
      setSecondaryCauses([]);
      setOutcomes([createOutcomeDraft()]);
      setArtifacts([]);
    }

    setPersistedStoryId(story?.id || null);
    setVerifierEmail('');
    setVerifierName('');
    setVerifierRelationship('');
    setVerificationMessage('');
    setVerificationStatus(story?.verificationRequestStatus || null);
    setVerificationRequestedAt(story?.verificationRequestedAt || null);
    setVerificationFeedbackMessage('');
    setErrors({});
    setIsSaving(false);
    setIsSendingVerification(false);
    setSubmitMessage('');
  }, [open, story]);

  const availableSecondaryCauses = useMemo(
    () => CAUSES_TAXONOMY.filter((item) => item.key !== primaryCause),
    [primaryCause]
  );

  const hasUploadingArtifacts = artifacts.some((artifact) => artifact.isUploading);

  const toggleSecondaryCause = (causeKey: string) => {
    setSecondaryCauses((prev) =>
      prev.includes(causeKey) ? prev.filter((item) => item !== causeKey) : [...prev, causeKey]
    );
  };

  const updateOutcome = (id: string, updates: Partial<OutcomeDraft>) => {
    setOutcomes((prev) =>
      prev.map((outcome) => (outcome.id === id ? { ...outcome, ...updates } : outcome))
    );
  };

  const addOutcome = () => {
    setOutcomes((prev) => [...prev, createOutcomeDraft()]);
  };

  const removeOutcome = (id: string) => {
    setOutcomes((prev) => (prev.length > 1 ? prev.filter((outcome) => outcome.id !== id) : prev));
  };

  const updateArtifact = (id: string, updates: Partial<ArtifactDraft>) => {
    setArtifacts((prev) =>
      prev.map((artifact) => (artifact.id === id ? { ...artifact, ...updates } : artifact))
    );
  };

  const addArtifact = () => {
    setArtifacts((prev) => [...prev, createArtifactDraft()]);
  };

  const removeArtifact = (id: string) => {
    setArtifacts((prev) => prev.filter((artifact) => artifact.id !== id));
  };

  const handleArtifactFileUpload = async (artifactId: string, file: File | null) => {
    if (!file) return;

    const validation = validateFile(file, 'document');
    if (!validation.valid) {
      updateArtifact(artifactId, { error: validation.error || 'Invalid file' });
      return;
    }

    updateArtifact(artifactId, { isUploading: true, error: null });

    try {
      const result = await uploadFile({
        file,
        type: 'document',
        category: 'artifact',
      });

      if (!result.success || !result.url) {
        const uploadMessage =
          result.message || result.error || IMPACT_ARTIFACT_UPLOAD_RETRY_MESSAGE;
        updateArtifact(artifactId, {
          isUploading: false,
          error: impactArtifactUploadErrorMessage(uploadMessage),
        });
        return;
      }

      updateArtifact(artifactId, {
        url: result.url,
        filePath: result.path || null,
        mimeType: file.type || null,
        isUploading: false,
        error: null,
        title: (result.artifactDisplayName || result.fileName || file.name || '').trim(),
      });
    } catch (error) {
      dispatchClientErrorDiagnostic('profile.impact_story.artifact_upload_failed', error);
      updateArtifact(artifactId, {
        isUploading: false,
        error: IMPACT_ARTIFACT_UPLOAD_RETRY_MESSAGE,
      });
    }
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!title.trim()) {
      nextErrors.title = 'Title is required';
    }

    if (!timelineStart.trim()) {
      nextErrors.timelineStart = 'Timeline start is required';
    }

    if (timelineMode === 'range' && !timelineOngoing && !timelineEnd.trim()) {
      nextErrors.timelineEnd = 'Timeline end is required unless ongoing';
    }

    if (!affiliationType) {
      nextErrors.affiliationType = 'Affiliation type is required';
    }

    if (!roleTitle.trim()) {
      nextErrors.roleTitle = 'Role title is required';
    }

    if (!roleScope) {
      nextErrors.roleScope = 'Role scope is required';
    }

    if (!primaryCause.trim()) {
      nextErrors.primaryCause = 'Primary cause is required';
    }

    if (outcomes.length === 0) {
      nextErrors.outcomes = 'At least one change outcome is required';
    }

    outcomes.forEach((outcome, index) => {
      if (!outcome.change.trim()) {
        nextErrors[`outcome.${index}.change`] = 'Change statement is required';
      }

      if (hasMetricValue(outcome.value) && Number.isNaN(Number(outcome.value))) {
        nextErrors[`outcome.${index}.value`] = 'Value must be numeric';
      }

      if (hasMetricValue(outcome.value) && !outcome.unit.trim()) {
        nextErrors[`outcome.${index}.unit`] = 'Unit/type is required when value is provided';
      }

      if (outcome.baseline.trim() && Number.isNaN(Number(outcome.baseline))) {
        nextErrors[`outcome.${index}.baseline`] = 'Baseline must be numeric';
      }

      if (outcome.after.trim() && Number.isNaN(Number(outcome.after))) {
        nextErrors[`outcome.${index}.after`] = 'After must be numeric';
      }
    });

    artifacts.forEach((artifact, index) => {
      if (!artifact.title.trim())
        nextErrors[`artifact.${index}.title`] = 'Artifact title is required';
      if (!artifact.url.trim())
        nextErrors[`artifact.${index}.url`] = 'Artifact URL or uploaded file is required';
    });

    if (hasUploadingArtifacts) {
      nextErrors.artifactsUploading = 'Please wait for all artifact uploads to finish';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateVerificationFields = () => {
    const email = verifierEmail.trim();
    if (!email) {
      setErrors((prev) => ({ ...prev, verifierEmail: 'Verifier email is required' }));
      return false;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setErrors((prev) => ({ ...prev, verifierEmail: 'Verifier email must be valid' }));
      return false;
    }

    setErrors((prev) => ({ ...prev, verifierEmail: '' }));
    return true;
  };

  const buildStoryPayload = (): Omit<ImpactStory, 'id'> => {
    const timelineStructured: ImpactStoryTimeline = {
      mode: timelineMode,
      precision: timelinePrecision,
      start: timelineStart.trim(),
      end: timelineMode === 'range' && !timelineOngoing ? timelineEnd.trim() : null,
      ongoing: timelineMode === 'range' ? timelineOngoing : false,
    };

    const measuredOutcomes: ImpactStoryOutcome[] = outcomes.map((outcome) => ({
      id: outcome.id,
      change: outcome.change.trim(),
      label: outcome.change.trim(),
      value: hasMetricValue(outcome.value) ? Number(outcome.value) : null,
      unit: outcome.unit.trim() || null,
      valueMode: hasMetricValue(outcome.value) ? outcome.valueMode : null,
      timeframe: outcome.timeframe.trim() || null,
      baseline: outcome.baseline.trim() ? Number(outcome.baseline) : null,
      after: outcome.after.trim() ? Number(outcome.after) : null,
      confidence: hasMetricValue(outcome.value) ? outcome.confidence : null,
    }));

    const supportingArtifacts: ImpactStoryArtifact[] = artifacts.map((artifact) => ({
      id: artifact.id,
      kind: artifact.kind,
      title: artifact.title.trim(),
      url: artifact.url.trim(),
      filePath: artifact.filePath || null,
      mimeType: artifact.mimeType || null,
    }));

    return {
      title: title.trim(),
      timeline: formatTimelineForLegacy(timelineStructured),
      timelineStructured,
      orgDescription:
        affiliationDetails.trim() ||
        (affiliationType === 'organization' ? 'Affiliated organization' : 'Individual effort'),
      impact: `${ROLE_SCOPE_OPTIONS.find((item) => item.value === roleScope)?.label || 'Contributed'} as ${roleTitle.trim()}`,
      businessValue: measuredOutcomes.length
        ? `Documented ${measuredOutcomes.length} impact change${measuredOutcomes.length > 1 ? 's' : ''}`
        : 'Structured impact story',
      outcomes: measuredOutcomes.map(formatOutcomeSummary).filter(Boolean).join('; '),
      affiliationType,
      affiliationDetails: affiliationDetails.trim() || null,
      roleTitle: roleTitle.trim(),
      roleScope,
      primaryCause,
      secondaryCauses,
      measuredOutcomes,
      supportingArtifacts,
      verified: false,
      verificationRequest: null,
    };
  };

  const handleSave = async (event?: React.FormEvent) => {
    event?.preventDefault();

    setSubmitMessage('');

    if (!validate()) {
      setSubmitMessage('Please fix highlighted fields before saving.');
      return;
    }
    const payload = buildStoryPayload();
    const currentStoryId = story?.id || persistedStoryId;

    setIsSaving(true);

    try {
      if (currentStoryId) {
        if (!onSaveExisting) {
          throw new Error('Unable to save changes for this impact story.');
        }
        await onSaveExisting(currentStoryId, payload);
      } else {
        await onSave(payload);
      }

      setSubmitMessage('');
      onOpenChange(false);
    } catch (error) {
      dispatchClientErrorDiagnostic('profile.impact_story.save_failed', error);
      setSubmitMessage(IMPACT_STORY_SAVE_RETRY_MESSAGE);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendVerification = async () => {
    if (!onSendVerificationRequest) {
      setVerificationFeedbackMessage('Verification sending is currently unavailable.');
      return;
    }

    setSubmitMessage('');
    setVerificationFeedbackMessage('');

    if (!validateVerificationFields()) {
      setVerificationFeedbackMessage('Enter a valid verifier email before sending.');
      return;
    }

    const verificationRequest = {
      verifierEmail: verifierEmail.trim(),
      verifierName: verifierName.trim() || null,
      verifierRelationship: verifierRelationship.trim() || null,
      message: verificationMessage.trim() || null,
    };

    const currentStoryId = story?.id || persistedStoryId;

    if (!validate()) {
      setVerificationFeedbackMessage(
        'Please fix highlighted fields before sending the verification request.'
      );
      return;
    }

    const storyDraft = buildStoryPayload();

    setIsSendingVerification(true);

    try {
      const result = await onSendVerificationRequest(
        currentStoryId
          ? {
              storyId: currentStoryId,
              storyDraft,
              verificationRequest,
            }
          : {
              storyDraft,
              verificationRequest,
            }
      );

      setPersistedStoryId(result.story.id);
      setVerificationStatus(result.verification.status);
      setVerificationRequestedAt(result.verification.createdAt);
      setVerificationFeedbackMessage(
        result.verification.warning
          ? result.verification.warning
          : 'Proof confirmation request sent. Status is now pending.'
      );
    } catch (error) {
      dispatchClientErrorDiagnostic('profile.impact_story.verification_send_failed', error);
      setVerificationFeedbackMessage(IMPACT_STORY_VERIFICATION_RETRY_MESSAGE);
    } finally {
      setIsSendingVerification(false);
    }
  };

  const currentStoryId = story?.id || persistedStoryId;
  const submitLabel = currentStoryId ? 'Save Changes' : 'Add Story';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSave} className="space-y-6">
          <DialogHeader>
            <DialogTitle>{currentStoryId ? 'Edit Impact Story' : 'Add Impact Story'}</DialogTitle>
            <DialogDescription>
              Capture structured impact, save changes independently, and ask someone to confirm this
              proof only when needed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            <div className="space-y-2">
              <Label htmlFor="impact-title">Title *</Label>
              <Input
                id="impact-title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setErrors((prev) => ({ ...prev, title: '' }));
                }}
                placeholder="e.g., Youth Climate Mentorship Program"
              />
              {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
            </div>

            <div className="space-y-3">
              <Label>Timeline *</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={timelineMode === 'range' ? 'default' : 'outline'}
                  onClick={() => setTimelineMode('range')}
                >
                  Start and End
                </Button>
                <Button
                  type="button"
                  variant={timelineMode === 'single' ? 'default' : 'outline'}
                  onClick={() => setTimelineMode('single')}
                >
                  Single Date/Year
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={timelinePrecision === 'date' ? 'default' : 'outline'}
                  onClick={() => setTimelinePrecision('date')}
                >
                  Date
                </Button>
                <Button
                  type="button"
                  variant={timelinePrecision === 'year' ? 'default' : 'outline'}
                  onClick={() => setTimelinePrecision('year')}
                >
                  Year
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="timeline-start">
                    {timelineMode === 'single' ? 'When' : 'Start'} *
                  </Label>
                  <Input
                    id="timeline-start"
                    type={timelinePrecision === 'date' ? 'date' : 'number'}
                    value={timelineStart}
                    onChange={(e) => {
                      setTimelineStart(e.target.value);
                      setErrors((prev) => ({ ...prev, timelineStart: '' }));
                    }}
                    min={timelinePrecision === 'year' ? '1900' : undefined}
                    max={timelinePrecision === 'year' ? '2100' : undefined}
                  />
                  {errors.timelineStart && (
                    <p className="text-xs text-red-500">{errors.timelineStart}</p>
                  )}
                </div>

                {timelineMode === 'range' && (
                  <div className="space-y-1">
                    <Label htmlFor="timeline-end">End {!timelineOngoing ? '*' : ''}</Label>
                    <Input
                      id="timeline-end"
                      type={timelinePrecision === 'date' ? 'date' : 'number'}
                      value={timelineEnd}
                      onChange={(e) => {
                        setTimelineEnd(e.target.value);
                        setErrors((prev) => ({ ...prev, timelineEnd: '' }));
                      }}
                      disabled={timelineOngoing}
                      min={timelinePrecision === 'year' ? '1900' : undefined}
                      max={timelinePrecision === 'year' ? '2100' : undefined}
                    />
                    {errors.timelineEnd && (
                      <p className="text-xs text-red-500">{errors.timelineEnd}</p>
                    )}
                  </div>
                )}
              </div>

              {timelineMode === 'range' && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="timeline-ongoing"
                    checked={timelineOngoing}
                    onCheckedChange={(checked) => {
                      setTimelineOngoing(Boolean(checked));
                      if (checked) {
                        setTimelineEnd('');
                        setErrors((prev) => ({ ...prev, timelineEnd: '' }));
                      }
                    }}
                  />
                  <Label htmlFor="timeline-ongoing">Ongoing</Label>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label>Affiliation *</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={affiliationType === 'organization' ? 'default' : 'outline'}
                  onClick={() => setAffiliationType('organization')}
                >
                  Affiliated organization
                </Button>
                <Button
                  type="button"
                  variant={affiliationType === 'individual' ? 'default' : 'outline'}
                  onClick={() => setAffiliationType('individual')}
                >
                  Individual effort
                </Button>
              </div>

              <div className="space-y-1">
                <Label htmlFor="affiliation-details">Affiliation details (optional)</Label>
                <Input
                  id="affiliation-details"
                  value={affiliationDetails}
                  onChange={(e) => setAffiliationDetails(e.target.value)}
                  placeholder={
                    affiliationType === 'organization'
                      ? 'e.g., Mid-size nonprofit, Climate sector'
                      : 'e.g., Independent initiative'
                  }
                />
              </div>
              {errors.affiliationType && (
                <p className="text-xs text-red-500">{errors.affiliationType}</p>
              )}
            </div>

            <div className="space-y-3">
              <Label>Role and scope *</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="role-title">Role title *</Label>
                  <Input
                    id="role-title"
                    value={roleTitle}
                    onChange={(e) => {
                      setRoleTitle(e.target.value);
                      setErrors((prev) => ({ ...prev, roleTitle: '' }));
                    }}
                    placeholder="e.g., Program Lead"
                  />
                  {errors.roleTitle && <p className="text-xs text-red-500">{errors.roleTitle}</p>}
                </div>

                <div className="space-y-1">
                  <Label>Scope *</Label>
                  <div className="flex flex-wrap gap-2">
                    {ROLE_SCOPE_OPTIONS.map((option) => (
                      <Button
                        key={option.value}
                        type="button"
                        variant={roleScope === option.value ? 'default' : 'outline'}
                        onClick={() => {
                          setRoleScope(option.value);
                          setErrors((prev) => ({ ...prev, roleScope: '' }));
                        }}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                  {errors.roleScope && <p className="text-xs text-red-500">{errors.roleScope}</p>}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Impact area / context tags *</Label>
              <div className="space-y-2">
                <Label htmlFor="primary-cause">Primary area *</Label>
                <select
                  id="primary-cause"
                  value={primaryCause}
                  onChange={(e) => {
                    const nextPrimary = e.target.value;
                    setPrimaryCause(nextPrimary);
                    setSecondaryCauses((prev) => prev.filter((item) => item !== nextPrimary));
                    setErrors((prev) => ({ ...prev, primaryCause: '' }));
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select primary area</option>
                  {CAUSES_TAXONOMY.map((cause) => (
                    <option key={cause.key} value={cause.key}>
                      {cause.label}
                    </option>
                  ))}
                </select>
                {errors.primaryCause && (
                  <p className="text-xs text-red-500">{errors.primaryCause}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Additional areas (optional)</Label>
                <div className="flex flex-wrap gap-2">
                  {availableSecondaryCauses.map((cause) => (
                    <Button
                      key={cause.key}
                      type="button"
                      variant={secondaryCauses.includes(cause.key) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleSecondaryCause(cause.key)}
                    >
                      {cause.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Outcomes (change-first) *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addOutcome}>
                  Add outcome
                </Button>
              </div>

              {errors.outcomes && <p className="text-xs text-red-500">{errors.outcomes}</p>}

              <div className="space-y-3">
                {outcomes.map((outcome, index) => (
                  <div key={outcome.id} className="rounded-lg border p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Outcome {index + 1}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOutcome(outcome.id)}
                      >
                        Remove
                      </Button>
                    </div>

                    <div className="space-y-1">
                      <Label>Change/impact statement *</Label>
                      <Textarea
                        value={outcome.change}
                        onChange={(e) => updateOutcome(outcome.id, { change: e.target.value })}
                        placeholder="e.g., Increased awareness about stories of Ukrainians living in Sweden"
                        rows={2}
                      />
                      {errors[`outcome.${index}.change`] && (
                        <p className="text-xs text-red-500">{errors[`outcome.${index}.change`]}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label>Supporting metric value (optional)</Label>
                        <Input
                          value={outcome.value}
                          onChange={(e) => updateOutcome(outcome.id, { value: e.target.value })}
                          placeholder="e.g., 5000"
                        />
                        {errors[`outcome.${index}.value`] && (
                          <p className="text-xs text-red-500">{errors[`outcome.${index}.value`]}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Label>Metric unit/type</Label>
                        <Input
                          value={outcome.unit}
                          onChange={(e) => updateOutcome(outcome.id, { unit: e.target.value })}
                          placeholder="e.g., views, %, USD"
                        />
                        {errors[`outcome.${index}.unit`] && (
                          <p className="text-xs text-red-500">{errors[`outcome.${index}.unit`]}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Label>Metric timeframe (optional)</Label>
                        <Input
                          value={outcome.timeframe}
                          onChange={(e) => updateOutcome(outcome.id, { timeframe: e.target.value })}
                          placeholder="e.g., Q3 2025"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label>Delta vs absolute (optional)</Label>
                        <select
                          value={outcome.valueMode}
                          onChange={(e) =>
                            updateOutcome(outcome.id, {
                              valueMode: e.target.value as ImpactStoryOutcomeValueMode,
                            })
                          }
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="absolute">Absolute</option>
                          <option value="delta">Delta</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <Label>Metric confidence (optional)</Label>
                        <select
                          value={outcome.confidence}
                          onChange={(e) =>
                            updateOutcome(outcome.id, {
                              confidence: e.target.value as ImpactStoryOutcomeConfidence,
                            })
                          }
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          {OUTCOME_CONFIDENCE_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <Label>Baseline (optional)</Label>
                        <Input
                          value={outcome.baseline}
                          onChange={(e) => updateOutcome(outcome.id, { baseline: e.target.value })}
                          placeholder="e.g., 40"
                        />
                        {errors[`outcome.${index}.baseline`] && (
                          <p className="text-xs text-red-500">
                            {errors[`outcome.${index}.baseline`]}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Label>After (optional)</Label>
                        <Input
                          value={outcome.after}
                          onChange={(e) => updateOutcome(outcome.id, { after: e.target.value })}
                          placeholder="e.g., 75"
                        />
                        {errors[`outcome.${index}.after`] && (
                          <p className="text-xs text-red-500">{errors[`outcome.${index}.after`]}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Supporting artifacts (optional)</Label>
                <Button type="button" variant="outline" size="sm" onClick={addArtifact}>
                  Add artifact
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Artifacts are added to this story when you submit the form.
              </p>

              {artifacts.length > 0 && (
                <div className="space-y-3">
                  {artifacts.map((artifact, index) => (
                    <div key={artifact.id} className="rounded-lg border p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">Artifact {index + 1}</Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeArtifact(artifact.id)}
                        >
                          Remove
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label>Type</Label>
                          <select
                            value={artifact.kind}
                            onChange={(e) =>
                              updateArtifact(artifact.id, {
                                kind: e.target.value as ImpactStoryArtifactKind,
                              })
                            }
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            {ARTIFACT_KIND_OPTIONS.map((kind) => (
                              <option key={kind} value={kind}>
                                {kind}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <Label>Title *</Label>
                          <Input
                            value={artifact.title}
                            onChange={(e) =>
                              updateArtifact(artifact.id, { title: e.target.value, error: null })
                            }
                            placeholder="e.g., Impact report"
                          />
                          {errors[`artifact.${index}.title`] && (
                            <p className="text-xs text-red-500">
                              {errors[`artifact.${index}.title`]}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label>URL *</Label>
                        <Input
                          value={artifact.url}
                          onChange={(e) =>
                            updateArtifact(artifact.id, { url: e.target.value, error: null })
                          }
                          placeholder="https://..."
                        />
                        {errors[`artifact.${index}.url`] && (
                          <p className="text-xs text-red-500">{errors[`artifact.${index}.url`]}</p>
                        )}
                      </div>

                      {(artifact.kind === 'file' ||
                        artifact.kind === 'doc' ||
                        artifact.kind === 'image') && (
                        <div className="space-y-1">
                          <Label>Upload file</Label>
                          <Input
                            type="file"
                            onChange={(event) => {
                              const file = event.target.files?.[0] || null;
                              void handleArtifactFileUpload(artifact.id, file);
                            }}
                          />
                        </div>
                      )}

                      {artifact.isUploading && (
                        <p className="text-xs text-muted-foreground">Uploading...</p>
                      )}
                      {artifact.error && (
                        <p role="alert" className="text-xs text-red-500">
                          {artifact.error}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {errors.artifactsUploading && (
                <p className="text-xs text-red-500">{errors.artifactsUploading}</p>
              )}
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label htmlFor="verifier-email" className="text-sm font-medium">
                  Proof confirmation request
                </Label>
                {verificationStatus && (
                  <Badge variant={verificationStatus === 'failed' ? 'destructive' : 'outline'}>
                    {getVerificationStatusLabel(verificationStatus)}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Optional. Skipping is fine while getting portfolio-ready, but intro-readiness may
                still wait on a non-self verification tied to this proof.
              </p>
              <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
                <p>
                  <strong>What this request supports:</strong> {title.trim() || 'This impact story'}
                </p>
                <p className="mt-1">
                  <strong>What they will confirm:</strong> Your role, the outcomes, and the
                  supporting evidence attached here.
                </p>
                <p className="mt-1">
                  <strong>What changes if confirmed:</strong> This proof gains a non-self
                  confirmation signal for intro-readiness review.
                </p>
              </div>

              <div className="space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="verifier-email">Verifier email *</Label>
                  <Input
                    id="verifier-email"
                    type="email"
                    value={verifierEmail}
                    onChange={(e) => {
                      setVerifierEmail(e.target.value);
                      setErrors((prev) => ({ ...prev, verifierEmail: '' }));
                    }}
                    placeholder="name@company.com"
                  />
                  {errors.verifierEmail && (
                    <p className="text-xs text-red-500">{errors.verifierEmail}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="verifier-name">Verifier name (optional)</Label>
                    <Input
                      id="verifier-name"
                      value={verifierName}
                      onChange={(e) => setVerifierName(e.target.value)}
                      placeholder="e.g., Jane Doe"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="verifier-relationship">Relationship (optional)</Label>
                    <Input
                      id="verifier-relationship"
                      value={verifierRelationship}
                      onChange={(e) => setVerifierRelationship(e.target.value)}
                      placeholder="e.g., Program Director"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="verification-message">Message (optional)</Label>
                  <Textarea
                    id="verification-message"
                    value={verificationMessage}
                    onChange={(e) => setVerificationMessage(e.target.value)}
                    placeholder="Explain what part of this proof you want them to confirm"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleSendVerification()}
                  disabled={isSendingVerification || isSaving}
                >
                  {isSendingVerification ? 'Sending...' : 'Ask to confirm this proof'}
                </Button>
                <p className="text-xs text-muted-foreground">
                  {currentStoryId
                    ? 'For existing stories, this auto-saves current edits first and keeps the dialog open.'
                    : 'For new stories, this auto-saves first and keeps the dialog open.'}
                </p>
              </div>

              {(verificationFeedbackMessage || verificationRequestedAt) && (
                <p
                  className={`text-xs rounded-md border p-2 ${
                    verificationStatus === 'failed'
                      ? 'text-amber-800 bg-amber-50 border-amber-200'
                      : 'text-proofound-forest bg-[#EEF6F2] border-[#B8D8C8]'
                  }`}
                >
                  {verificationFeedbackMessage || 'Proof confirmation status updated.'}
                  {verificationRequestedAt
                    ? ` Requested on ${new Date(verificationRequestedAt).toLocaleDateString()}.`
                    : ''}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            {submitMessage && (
              <p className="w-full text-sm text-red-600" role="alert">
                {submitMessage}
              </p>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving || isSendingVerification}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving || isSendingVerification || hasUploadingArtifacts}
            >
              {isSaving ? 'Saving...' : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
