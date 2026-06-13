'use client';

import { useState } from 'react';
import { FileUp, Loader2, ShieldCheck, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { apiFetch } from '@/lib/api/fetch';
import { START_FROM_CV_GUEST_FIRST_PROOF_SCAFFOLDING_SURFACE } from '@/lib/ai/start-from-cv-contract';
import { dispatchClientDiagnostic, dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';
import type { StartFromCvDraftOutput } from '@/lib/ai/start-from-cv';
import type { StartFromCvScaffoldingSurface } from '@/lib/ai/start-from-cv-contract';

type StartFromCvDialogProps = {
  surface: StartFromCvScaffoldingSurface;
  onApplyComplete?: () => void;
};

type DraftBucket =
  | 'workContextDrafts'
  | 'educationContextDrafts'
  | 'volunteeringContextDrafts'
  | 'proofPackIdeaDrafts'
  | 'artifactLinkDrafts'
  | 'unsupportedSkillDrafts';

const DRAFT_BUCKETS: Array<{ key: DraftBucket; label: string }> = [
  { key: 'workContextDrafts', label: 'Work context drafts' },
  { key: 'educationContextDrafts', label: 'Education context drafts' },
  { key: 'volunteeringContextDrafts', label: 'Volunteering context drafts' },
  { key: 'proofPackIdeaDrafts', label: 'Proof Pack ideas' },
  { key: 'artifactLinkDrafts', label: 'Artifact and link suggestions' },
  { key: 'unsupportedSkillDrafts', label: 'Unsupported skill suggestions' },
];

const DRAFT_TITLE_FIELDS: Record<DraftBucket, string> = {
  workContextDrafts: 'roleTitle',
  educationContextDrafts: 'programTitle',
  volunteeringContextDrafts: 'roleTitle',
  proofPackIdeaDrafts: 'titleSuggestion',
  artifactLinkDrafts: 'label',
  unsupportedSkillDrafts: 'skillLabel',
};

const DRAFT_BODY_FIELDS: Record<DraftBucket, { key: string; list?: true }> = {
  workContextDrafts: { key: 'shortContextSummary' },
  educationContextDrafts: { key: 'learningProjectHints', list: true },
  volunteeringContextDrafts: { key: 'contributionSummary' },
  proofPackIdeaDrafts: { key: 'possibleClaim' },
  artifactLinkDrafts: { key: 'sourceContext' },
  unsupportedSkillDrafts: { key: 'sourceContext' },
};

const TECHNICAL_ERROR_TERMS =
  /\b(api|backend|database|schema|endpoint|supabase|worker|python|typescript|gemini|uuid|tenant|cron|migration|rls|queue|job|extract|extraction|fetch|network|provider|token|service|route|status|json|http)\b|[a-z]+_[a-z_]+/i;

const START_FROM_CV_DRAFTS_FAILED_MESSAGE =
  'Start from CV could not create private drafts. Your profile is unchanged; try again or continue manually.';
const START_FROM_CV_ACCEPT_FAILED_MESSAGE =
  'Selected drafts could not be accepted. Your private drafts are still here; review them and try again.';
const START_FROM_CV_DELETE_FAILED_MESSAGE =
  'Import session could not be deleted. Your private drafts are still here; please try again.';

function getResponseStatus(response: Response) {
  return typeof response.status === 'number' ? response.status : 'unknown';
}

function getReturnedError(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return '';
  }

  if ('error' in payload && typeof payload.error === 'string') {
    return payload.error.trim();
  }

  if ('message' in payload && typeof payload.message === 'string') {
    return payload.message.trim();
  }

  return '';
}

function userSafeCvError(value: unknown, fallback: string): string {
  if (typeof value !== 'string') {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed && !TECHNICAL_ERROR_TERMS.test(trimmed) ? trimmed : fallback;
}

function getDraftTitle(item: Record<string, unknown>) {
  return (
    item.roleTitle ||
    item.programTitle ||
    item.titleSuggestion ||
    item.label ||
    item.skillLabel ||
    'Private draft'
  );
}

function getDraftBody(item: Record<string, unknown>) {
  return (
    item.shortContextSummary ||
    item.contributionSummary ||
    item.possibleClaim ||
    item.sourceContext ||
    item.missingEvidenceWarning ||
    'Review before keeping.'
  );
}

function getEditableDraftText(item: Record<string, unknown>, field: { key: string; list?: true }) {
  const value = item[field.key];
  if (field.list) {
    return Array.isArray(value)
      ? value.filter((entry) => typeof entry === 'string').join('\n')
      : '';
  }
  return typeof value === 'string' ? value : '';
}

function normalizeEditableDraftText(value: string, field: { key: string; list?: true }) {
  if (field.list) {
    return value
      .split(/\n+/)
      .map((entry) => entry.trim())
      .filter(Boolean)
      .slice(0, 5);
  }
  return value;
}

export function StartFromCvDialog({ surface, onApplyComplete }: StartFromCvDialogProps) {
  const [consented, setConsented] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [session, setSession] = useState<StartFromCvDraftOutput | null>(null);
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteSessionDialogOpen, setDeleteSessionDialogOpen] = useState(false);

  async function startExtraction() {
    if (!file || !consented) {
      setError('Choose a CV and confirm consent before reading it.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const sessionResponse = await apiFetch('/api/ai/start-from-cv/sessions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          consentToProcessCv: true,
          surface,
        }),
      });
      const created = await sessionResponse.json();
      if (!sessionResponse.ok) {
        throw new Error(userSafeCvError(created.error, 'Start from CV is not available.'));
      }

      const formData = new FormData();
      formData.set('file', file);
      const extractResponse = await apiFetch(
        `/api/ai/start-from-cv/sessions/${created.importSessionId}/extract`,
        {
          method: 'POST',
          body: formData,
        }
      );
      const extracted = await extractResponse.json();
      if (!extractResponse.ok) {
        throw new Error(
          userSafeCvError(extracted.error, 'We could not read this CV. Please try again.')
        );
      }
      setSession(extracted);
      setAcceptedIds(new Set());
    } catch (caught) {
      dispatchClientErrorDiagnostic('start_from_cv.private_drafts.create_failed', caught);
      setError(
        caught instanceof Error
          ? userSafeCvError(caught.message, START_FROM_CV_DRAFTS_FAILED_MESSAGE)
          : START_FROM_CV_DRAFTS_FAILED_MESSAGE
      );
    } finally {
      setLoading(false);
    }
  }

  async function acceptSelected() {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const accepted = Object.fromEntries(
        DRAFT_BUCKETS.map(({ key }) => [
          key,
          ((session[key] as Array<Record<string, unknown>>) || []).filter((item) =>
            acceptedIds.has(String(item.id))
          ),
        ])
      );
      const response = await apiFetch(
        `/api/ai/start-from-cv/sessions/${session.importSessionId}/accept`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ accepted }),
        }
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const returnedError = getReturnedError(payload);
        dispatchClientDiagnostic('start_from_cv.private_drafts.accept_returned_error', {
          status: getResponseStatus(response),
          hasReturnedError: returnedError.length > 0,
        });
        throw new Error('start_from_cv_private_drafts_accept_request_failed');
      }
      onApplyComplete?.();
    } catch (caught) {
      dispatchClientErrorDiagnostic('start_from_cv.private_drafts.accept_failed', caught);
      setError(
        caught instanceof Error
          ? userSafeCvError(caught.message, START_FROM_CV_ACCEPT_FAILED_MESSAGE)
          : START_FROM_CV_ACCEPT_FAILED_MESSAGE
      );
    } finally {
      setLoading(false);
    }
  }

  async function deleteSession() {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch(
        `/api/ai/start-from-cv/sessions/${session.importSessionId}/discard`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ deleteSession: true }),
        }
      );
      let payload: { error?: string } = {};
      try {
        payload = (await response.json()) as { error?: string };
      } catch {
        payload = {};
      }
      if (!response.ok) {
        throw new Error(userSafeCvError(payload.error, START_FROM_CV_DELETE_FAILED_MESSAGE));
      }
      setSession(null);
      setAcceptedIds(new Set());
      setDeleteSessionDialogOpen(false);
      onApplyComplete?.();
    } catch (caught) {
      dispatchClientErrorDiagnostic('start_from_cv.private_drafts.delete_failed', caught);
      setError(
        caught instanceof Error
          ? userSafeCvError(caught.message, START_FROM_CV_DELETE_FAILED_MESSAGE)
          : START_FROM_CV_DELETE_FAILED_MESSAGE
      );
    } finally {
      setLoading(false);
    }
  }

  function toggleAccepted(id: string, checked: boolean) {
    setAcceptedIds((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  function updateDraftField(
    bucket: DraftBucket,
    id: string,
    field: { key: string; list?: true } | string,
    value: string
  ) {
    const fieldConfig = typeof field === 'string' ? { key: field } : field;

    setSession((current) => {
      if (!current) return current;

      const items = ((current[bucket] as Array<Record<string, unknown>>) || []).map((item) =>
        String(item.id) === id
          ? {
              ...item,
              [fieldConfig.key]: normalizeEditableDraftText(value, fieldConfig),
            }
          : item
      );

      return {
        ...current,
        [bucket]: items,
      };
    });
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-proofound-stone/60 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-proofound-forest" aria-hidden="true" />
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Start from your CV</p>
            <p>
              Upload your CV to create private editable drafts. Nothing is published, verified,
              scored, ranked, or shown to organizations unless you choose what to keep later.
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>CV processing is optional.</li>
              <li>The CV may be processed by Google Cloud Document AI and Gemini if enabled.</li>
              <li>Extracted information becomes private draft suggestions only.</li>
              {surface === START_FROM_CV_GUEST_FIRST_PROOF_SCAFFOLDING_SURFACE ? (
                <li>Use it only as optional scaffolding before creating assignment proof.</li>
              ) : null}
              <li>
                Nothing is used for scoring, ranking, shortlisting, matching, or workflow decisions.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {!session ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="start-from-cv-file">CV file</Label>
            <Input
              id="start-from-cv-file"
              type="file"
              accept="application/pdf,image/png,image/jpeg"
              onChange={(event) => setFile(event.currentTarget.files?.[0] ?? null)}
            />
          </div>
          <label
            htmlFor="start-from-cv-consent"
            className="flex items-start gap-2 text-sm text-muted-foreground"
          >
            <Checkbox
              id="start-from-cv-consent"
              checked={consented}
              onCheckedChange={(value) => setConsented(value === true)}
            />
            <span>I consent to optional CV processing for private draft suggestions.</span>
          </label>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={startExtraction}
              disabled={loading || !file || !consented}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileUp className="mr-2 h-4 w-4" />
              )}
              Create private drafts
            </Button>
            <Button type="button" variant="outline" onClick={onApplyComplete}>
              Continue manually
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {session.privacyWarnings.length > 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              {session.privacyWarnings.slice(0, 4).map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          ) : null}

          {DRAFT_BUCKETS.map(({ key, label }) => {
            const items = (session[key] as Array<Record<string, unknown>>) || [];
            if (items.length === 0) return null;
            const titleField = DRAFT_TITLE_FIELDS[key];
            const bodyField = DRAFT_BODY_FIELDS[key];
            return (
              <section key={key} className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">{label}</h4>
                <div className="space-y-2">
                  {items.map((item) => {
                    const id = String(item.id);
                    const draftTitle = String(getDraftTitle(item));
                    return (
                      <div
                        key={id}
                        className="flex gap-3 rounded-lg border border-proofound-stone/60 p-3 text-sm"
                      >
                        <Checkbox
                          aria-label={`Use ${label}: ${draftTitle}`}
                          checked={acceptedIds.has(id)}
                          onCheckedChange={(value) => toggleAccepted(id, value === true)}
                        />
                        <div className="min-w-0 flex-1 space-y-2">
                          <Input
                            aria-label={`${label} title`}
                            value={
                              typeof item[titleField] === 'string'
                                ? String(item[titleField])
                                : draftTitle
                            }
                            onChange={(event) =>
                              updateDraftField(key, id, titleField, event.currentTarget.value)
                            }
                          />
                          <textarea
                            aria-label={`${label} details`}
                            value={
                              getEditableDraftText(item, bodyField) || String(getDraftBody(item))
                            }
                            rows={3}
                            className="flex w-full rounded-md border border-proofound-stone/70 bg-white px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-proofound-forest"
                            onChange={(event) =>
                              updateDraftField(key, id, bodyField, event.currentTarget.value)
                            }
                          />
                          {key === 'unsupportedSkillDrafts' ? (
                            <span className="block text-xs text-amber-700">
                              Unsupported draft. Requires proof and user confirmation. No trust,
                              matching, or verification lift.
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={acceptSelected}
              disabled={loading || acceptedIds.size === 0}
            >
              Accept selected drafts
            </Button>
            <Button type="button" variant="outline" onClick={onApplyComplete}>
              Continue manually
            </Button>
            <AlertDialog
              open={deleteSessionDialogOpen}
              onOpenChange={(open) => {
                if (!loading) {
                  setDeleteSessionDialogOpen(open);
                }
              }}
            >
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setError(null);
                  setDeleteSessionDialogOpen(true);
                }}
                disabled={loading}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete import session
              </Button>
              <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete import session?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes the private CV draft session and any unaccepted suggestions. It
                    will not delete anything you already accepted into your profile.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                {error ? (
                  <p
                    className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                    role="alert"
                  >
                    {error}
                  </p>
                ) : null}
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={loading}>Keep drafts</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-white hover:bg-destructive/90"
                    disabled={loading}
                    onClick={(event) => {
                      event.preventDefault();
                      void deleteSession();
                    }}
                  >
                    {loading ? 'Deleting session...' : 'Delete session'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
    </div>
  );
}
