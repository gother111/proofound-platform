'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useOrgContext } from '@/features/org/context';
import { actionCheckSlugAvailability, actionConfirmSlug } from '@/features/org/actions';

type OrgSlugBannerProps = {
  orgId: string;
  currentSlug: string;
  confirmed: boolean;
  displayName?: string | null;
};

const MIN_SLUG_LENGTH = 3;

function slugifyLocal(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function OrgSlugBanner({ orgId, currentSlug, confirmed, displayName }: OrgSlugBannerProps) {
  const { canEdit } = useOrgContext();
  const router = useRouter();

  const [open, setOpen] = useState(!confirmed);
  const [inputValue, setInputValue] = useState(currentSlug ?? '');
  const [status, setStatus] = useState<
    'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'saving' | 'error'
  >(confirmed ? 'idle' : 'available');
  const [message, setMessage] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const candidate = useMemo(() => slugifyLocal(inputValue), [inputValue]);
  const candidateValid = candidate.length >= MIN_SLUG_LENGTH;
  const previewSlug = candidate || slugifyLocal(displayName ?? '') || 'your-organization';
  const showLengthHint = !candidateValid && inputValue.length > 0;

  if (!canEdit || !open) {
    return null;
  }

  async function handleCheck() {
    setMessage(null);

    const normalized = slugifyLocal(inputValue);
    if (!normalized || normalized.length < MIN_SLUG_LENGTH) {
      setStatus('invalid');
      setMessage(`Choose a slug with at least ${MIN_SLUG_LENGTH} characters.`);
      return;
    }

    setIsChecking(true);
    setStatus('checking');

    try {
      const formData = new FormData();
      formData.set('slug', normalized);
      formData.set('orgId', orgId);
      const result = await actionCheckSlugAvailability(formData);

      if (!result.slug) {
        setStatus('invalid');
        setMessage('Only letters and numbers are allowed.');
        setInputValue('');
        return;
      }

      setInputValue(result.slug);

      if (result.ok) {
        setStatus('available');
        setMessage('This URL is available.');
      } else {
        setStatus(result.reason === 'invalid' ? 'invalid' : 'taken');
        setMessage(
          result.reason === 'invalid'
            ? 'Only letters and numbers are allowed.'
            : 'That URL is already taken.'
        );
      }
    } catch (error) {
      console.error('[OrgSlugBanner] check failed', error);
      setStatus('error');
      setMessage('Could not check availability. Please try again.');
    } finally {
      setIsChecking(false);
    }
  }

  async function handleSave() {
    setMessage(null);

    const normalized = slugifyLocal(inputValue || currentSlug);
    if (!normalized || normalized.length < MIN_SLUG_LENGTH) {
      setStatus('invalid');
      setMessage(`Choose a slug with at least ${MIN_SLUG_LENGTH} characters.`);
      return;
    }

    if (normalized !== currentSlug && status !== 'available') {
      setMessage('Please check availability before saving.');
      return;
    }

    setIsSaving(true);
    setStatus('saving');

    try {
      const formData = new FormData();
      formData.set('orgId', orgId);
      formData.set('slug', normalized);
      const { slug } = await actionConfirmSlug(formData);
      router.replace(`/o/${slug}/home`);
      router.refresh();
    } catch (error) {
      console.error('[OrgSlugBanner] save failed', error);
      if (error instanceof Error) {
        if (error.message === 'slug-taken') {
          setStatus('taken');
          setMessage('That URL is already taken.');
        } else if (error.message === 'invalid-slug') {
          setStatus('invalid');
          setMessage('Only letters and numbers are allowed.');
        } else if (error.message === 'already-confirmed') {
          setStatus('error');
          setMessage('Your organization URL has already been confirmed.');
        } else if (error.message === 'forbidden' || error.message === 'unauthorized') {
          setStatus('error');
          setMessage('You do not have permission to change the URL.');
        } else {
          setStatus('error');
          setMessage('We could not save your URL. Please try again.');
        }
      } else {
        setStatus('error');
        setMessage('We could not save your URL. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  }

  const canSave = candidateValid && (candidate === currentSlug || status === 'available');

  return (
    <div className="rounded-lg border bg-muted/40 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div>
            <p className="text-sm font-medium text-foreground">Choose your public URL</p>
            <p className="text-sm text-muted-foreground">
              This becomes your organization link (for example,{' '}
              <code className="rounded bg-muted px-1 text-xs text-foreground">
                proofound.io/o/{previewSlug}/home
              </code>
              ).
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              value={inputValue}
              onChange={(event) => {
                setInputValue(slugifyLocal(event.target.value));
                setStatus('idle');
                setMessage(null);
              }}
              placeholder="your-organization"
              className="sm:w-64"
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={isChecking || !candidateValid}
                onClick={handleCheck}
              >
                {isChecking ? 'Checking…' : 'Check'}
              </Button>
              <Button type="button" disabled={!canSave || isSaving} onClick={handleSave}>
                {isSaving ? 'Saving…' : 'Save'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={isSaving}
                onClick={() => setOpen(false)}
              >
                Maybe later
              </Button>
            </div>
          </div>
          {message ? (
            <p
              className={`text-xs ${
                status === 'available'
                  ? 'text-emerald-600'
                  : status === 'error' || status === 'taken' || status === 'invalid'
                    ? 'text-destructive'
                    : 'text-muted-foreground'
              }`}
            >
              {message}
            </p>
          ) : showLengthHint ? (
            <p className="text-xs text-muted-foreground">
              Use at least {MIN_SLUG_LENGTH} characters.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
