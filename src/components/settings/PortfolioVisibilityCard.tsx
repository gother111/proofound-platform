'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck } from 'lucide-react';
import { apiFetch } from '@/lib/api/fetch';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';
import { useAssistiveAiFlag } from '@/hooks/useAssistiveAiFlag';

type VisibilityFlags = {
  header: boolean;
  proofBar: boolean;
  workEmail: boolean;
  linkedin: boolean;
  identity: boolean;
  skills: boolean;
  bio: boolean;
  contact: boolean;
};

type PrivacyPreflightPayload = {
  riskLevel?: 'low' | 'medium' | 'high';
  safeToPublishSuggestion?: string;
  flags?: Array<{
    message?: string;
    field?: string | null;
  }>;
  error?: string;
  fallbackAvailable?: boolean;
};

type SaveFeedback = {
  tone: 'success' | 'error';
  message: string;
};

const defaults: VisibilityFlags = {
  header: true,
  proofBar: true,
  workEmail: false,
  linkedin: false,
  identity: true,
  skills: false,
  bio: false,
  contact: false,
};

function normalizeVisibilityFlags(input: Partial<VisibilityFlags> | null | undefined) {
  return {
    ...defaults,
    ...(input ?? {}),
    header: true,
    linkedin: false,
  };
}

function formatPrivacyPreflightMessage(payload: PrivacyPreflightPayload) {
  const flags = Array.isArray(payload.flags) ? payload.flags : [];
  const firstFlag = flags[0];

  if (payload.riskLevel === 'high') {
    const flagDetail = firstFlag?.message
      ? ` First flag: ${firstFlag.field ? `${firstFlag.field}: ` : ''}${firstFlag.message}`
      : '';
    return `${
      payload.safeToPublishSuggestion ||
      'Privacy review is required before publishing. Remove or rewrite flagged private details first.'
    } ${flags.length} privacy concern${flags.length === 1 ? '' : 's'} found.${flagDetail}`;
  }

  return (
    payload.safeToPublishSuggestion ||
    'No high-risk privacy concerns were found. This is not a privacy guarantee.'
  );
}

export function PortfolioVisibilityCard() {
  const assistiveAiEnabled = useAssistiveAiFlag();
  const [flags, setFlags] = useState<VisibilityFlags>(defaults);
  const [publicPageEnabled, setPublicPageEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [preflightMessage, setPreflightMessage] = useState<string | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<SaveFeedback | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/portfolio/visibility');
        if (res.ok) {
          const data = await res.json();
          if (data.visibility) setFlags(normalizeVisibilityFlags(data.visibility));
          setPublicPageEnabled(data.publicPageEnabled !== false);
        }
      } catch (e) {
        dispatchClientErrorDiagnostic('settings.portfolio_visibility.load_failed', e);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const toggle = (key: keyof VisibilityFlags) => {
    if (key === 'header') {
      return;
    }
    setSaveFeedback(null);
    setPreflightMessage(null);
    setFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const save = async () => {
    setSaving(true);
    setSaveFeedback(null);
    const normalizedFlags = normalizeVisibilityFlags(flags);
    try {
      const res = await apiFetch('/api/portfolio/visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicPageEnabled,
          searchIndexingEnabled: false,
          ...normalizedFlags,
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      setSaveFeedback({
        tone: 'success',
        message: publicPageEnabled
          ? 'Visibility saved. Your Public Page remains shareable by direct link.'
          : 'Visibility saved. Your Public Page is now unavailable from the public route.',
      });
    } catch (e) {
      dispatchClientErrorDiagnostic('settings.portfolio_visibility.save_failed', e);
      setSaveFeedback({
        tone: 'error',
        message: 'Visibility could not be saved. Your previous settings are unchanged.',
      });
    } finally {
      setSaving(false);
    }
  };

  const checkPrivacy = async () => {
    setChecking(true);
    setPreflightMessage(null);
    try {
      const res = await apiFetch('/api/ai/privacy-preflight/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surface: 'public_portfolio',
          includeModelReview: false,
        }),
      });
      const payload = await res.json();
      if (!res.ok) {
        if (payload?.fallbackAvailable) {
          setPreflightMessage(
            'Privacy check is temporarily unavailable. Manual checklist: remove private contact details, hidden identity terms, original filenames, private URLs, and unsupported sensitive details before publishing.'
          );
          return;
        }
        throw new Error(payload?.error || 'Privacy check failed');
      }
      setPreflightMessage(formatPrivacyPreflightMessage(payload));
    } catch (e) {
      dispatchClientErrorDiagnostic('settings.portfolio_visibility.privacy_check_failed', e);
      setPreflightMessage(
        'Manual checklist: remove private contact details, hidden identity terms, original filenames, private URLs, and unsupported sensitive details before publishing.'
      );
    } finally {
      setChecking(false);
    }
  };

  return (
    <Card variant="bento">
      <CardHeader>
        <CardTitle>Public Page visibility</CardTitle>
        <CardDescription>
          A direct-link proof snapshot comes first. Search engines stay off until you opt in.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-700">
        {loading ? (
          <div className="flex items-center gap-2 text-slate-500" role="status" aria-live="polite">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading Public Page visibility controls...
          </div>
        ) : (
          <>
            <VisibilityRow
              label="Public page enabled"
              description="Anyone with the link can view your Public Page."
              checked={publicPageEnabled}
              onCheckedChange={() => {
                setSaveFeedback(null);
                setPreflightMessage(null);
                setPublicPageEnabled((prev) => !prev);
              }}
            />
            <VisibilityRow
              label="Header (name, handle, headline)"
              description="Required so your direct-link Public Page has a trustworthy identity anchor."
              checked={flags.header}
              onCheckedChange={() => toggle('header')}
              disabled
            />
            <VisibilityRow
              label="Proof bar block"
              description="Shows proof-backed snapshot details."
              checked={flags.proofBar}
              onCheckedChange={() => toggle('proofBar')}
            />
            <VisibilityRow
              label="Identity badge"
              description="Shows coarse verification status only."
              checked={flags.identity}
              onCheckedChange={() => toggle('identity')}
            />
            <VisibilityRow
              label="Work email"
              checked={flags.workEmail}
              onCheckedChange={() => toggle('workEmail')}
            />
            <VisibilityRow
              label="Skills snapshot"
              checked={flags.skills}
              onCheckedChange={() => toggle('skills')}
            />
            <VisibilityRow
              label="Bio/About"
              checked={flags.bio}
              onCheckedChange={() => toggle('bio')}
            />
            <VisibilityRow
              label="Contact section"
              description="Keep this off unless you explicitly want contact requests surfaced."
              checked={flags.contact}
              onCheckedChange={() => toggle('contact')}
            />

            <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              {publicPageEnabled
                ? 'Public page is on and shareable by direct link. Search engines should not index it.'
                : 'Public page is off. The public route will be unavailable.'}
            </p>

            {assistiveAiEnabled ? (
              <p className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                AI suggestions are drafts. They do not verify, score, rank, or evaluate anyone.
              </p>
            ) : (
              <p className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                Manual guidance: review visible fields for private contact details, hidden identity
                terms, sensitive filenames, and private links before publishing.
              </p>
            )}

            {preflightMessage ? (
              <p className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                {preflightMessage}
              </p>
            ) : null}

            {saveFeedback ? (
              <p
                className={
                  saveFeedback.tone === 'error'
                    ? 'rounded-md border border-[#E9C9B8] bg-[#FFF6F0] px-3 py-2 text-xs leading-5 text-[#8A3F21]'
                    : 'rounded-md border border-proofound-sage/50 bg-proofound-parchment/50 px-3 py-2 text-xs leading-5 text-proofound-forest'
                }
                role={saveFeedback.tone === 'error' ? 'alert' : 'status'}
                aria-live={saveFeedback.tone === 'error' ? 'assertive' : 'polite'}
              >
                {saveFeedback.message}
              </p>
            ) : null}

            <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
              {assistiveAiEnabled ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={checkPrivacy}
                  disabled={checking}
                  className="w-full justify-center sm:w-auto"
                >
                  {checking ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="mr-2 h-4 w-4" /> Check privacy before publishing
                    </>
                  )}
                </Button>
              ) : null}
              <Button size="sm" onClick={save} disabled={saving} className="w-full sm:w-auto">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  'Save visibility'
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function VisibilityRow({
  label,
  description,
  checked,
  onCheckedChange,
  disabled = false,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2">
      <div className="min-w-0 flex-1 space-y-0.5">
        <Label className="text-sm text-slate-800">{label}</Label>
        {description ? <p className="text-xs text-slate-500">{description}</p> : null}
      </div>
      <Switch
        aria-label={label}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="shrink-0"
      />
    </div>
  );
}
