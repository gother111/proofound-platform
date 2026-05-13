'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck } from 'lucide-react';
import { apiFetch } from '@/lib/api/fetch';
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

const defaults: VisibilityFlags = {
  header: true,
  proofBar: true,
  workEmail: false,
  linkedin: true,
  identity: true,
  skills: false,
  bio: false,
  contact: false,
};

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
    } ${flags.length} deterministic flag${flags.length === 1 ? '' : 's'} found.${flagDetail}`;
  }

  return (
    payload.safeToPublishSuggestion ||
    'No high-risk deterministic flags were found. This is not a privacy guarantee.'
  );
}

export function PortfolioVisibilityCard() {
  const assistiveAiEnabled = useAssistiveAiFlag();
  const [flags, setFlags] = useState<VisibilityFlags>(defaults);
  const [publicPageEnabled, setPublicPageEnabled] = useState(true);
  const [searchIndexingEnabled, setSearchIndexingEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [preflightMessage, setPreflightMessage] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/portfolio/visibility');
        if (res.ok) {
          const data = await res.json();
          if (data.visibility) setFlags(data.visibility);
          setPublicPageEnabled(data.publicPageEnabled !== false);
          setSearchIndexingEnabled(Boolean(data.searchIndexingEnabled));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const toggle = (key: keyof VisibilityFlags) => {
    setFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await apiFetch('/api/portfolio/visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicPageEnabled,
          searchIndexingEnabled,
          ...flags,
        }),
      });
      if (!res.ok) throw new Error('Save failed');
    } catch (e) {
      console.error(e);
      alert('Could not save visibility. Please try again.');
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
            'Privacy preflight is temporarily unavailable. Manual checklist: remove private contact details, hidden identity terms, original filenames, private URLs, and unsupported sensitive details before publishing.'
          );
          return;
        }
        throw new Error(payload?.error || 'Privacy check failed');
      }
      setPreflightMessage(formatPrivacyPreflightMessage(payload));
    } catch (e) {
      console.error(e);
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
        <CardTitle>Public Portfolio Visibility</CardTitle>
        <CardDescription>
          Shareable by link comes first. Search engines are off by default.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-700">
        {loading ? (
          <div className="flex items-center gap-2 text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </div>
        ) : (
          <>
            <VisibilityRow
              label="Public page enabled"
              description="Anyone with the link can view your public portfolio."
              checked={publicPageEnabled}
              onCheckedChange={() => setPublicPageEnabled((prev) => !prev)}
            />
            <VisibilityRow
              label="Allow search engines"
              description="Only enable this when the page is meant to be searchable."
              checked={searchIndexingEnabled}
              onCheckedChange={() => setSearchIndexingEnabled((prev) => !prev)}
              disabled={!publicPageEnabled}
            />
            <VisibilityRow
              label="Header (name, handle, headline)"
              description="Required for a credible public portfolio."
              checked={flags.header}
              onCheckedChange={() => toggle('header')}
            />
            <VisibilityRow
              label="Proof bar block"
              description="Shows proof-backed trust summary."
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
              label="LinkedIn confidence"
              checked={flags.linkedin}
              onCheckedChange={() => toggle('linkedin')}
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
                ? searchIndexingEnabled
                  ? 'Public page is on and eligible for search indexing when the content is safe to index.'
                  : 'Public page is on and shareable by direct link. Search engines should not index it.'
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

            <div className="flex flex-wrap gap-2">
              {assistiveAiEnabled ? (
                <Button size="sm" variant="outline" onClick={checkPrivacy} disabled={checking}>
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
              <Button size="sm" onClick={save} disabled={saving}>
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
      <div className="space-y-0.5">
        <Label className="text-sm text-slate-800">{label}</Label>
        {description ? <p className="text-xs text-slate-500">{description}</p> : null}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  );
}
