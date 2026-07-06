'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle2, Mail, Loader2, AlertCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api/fetch';
import { dispatchClientDiagnostic, dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';

interface WorkEmailVerificationFormProps {
  onSuccess: () => void;
}

interface Organization {
  id: string;
  displayName: string | null;
  display_name?: string | null;
  slug: string;
}

const WORK_EMAIL_SEND_RETRY_MESSAGE =
  'Confirmation email could not be sent. Your work email and organization choice are still here; please try again.';
const ORGANIZATION_LOADING_PLACEHOLDER = 'Loading organization list';
const ORGANIZATION_LOADING_STATUS =
  'Loading organization choices. You can still enter your work email.';
const WORK_EMAIL_SEND_SAFE_ERRORS = new Map([
  [
    'This work email is already verified by another account',
    'This work email is already verified by another account.',
  ],
  ['Failed to send verification email', WORK_EMAIL_SEND_RETRY_MESSAGE],
  ['Failed to save work email', WORK_EMAIL_SEND_RETRY_MESSAGE],
  ['Internal server error', WORK_EMAIL_SEND_RETRY_MESSAGE],
]);

function getResponseStatus(response: Response) {
  return typeof response.status === 'number' ? response.status : 'unknown';
}

function workEmailSendError(error?: string | null, status: number | 'unknown' = 'unknown') {
  const normalized = error?.trim();

  if (!normalized) {
    return WORK_EMAIL_SEND_RETRY_MESSAGE;
  }

  const normalizedKey = normalized.endsWith('.') ? normalized.slice(0, -1) : normalized;
  const safeMessage = WORK_EMAIL_SEND_SAFE_ERRORS.get(normalizedKey);
  if (safeMessage) {
    return safeMessage;
  }

  dispatchClientDiagnostic('settings.work_email.send_returned_error', {
    status,
    hasReturnedError: true,
  });
  return WORK_EMAIL_SEND_RETRY_MESSAGE;
}

export function WorkEmailVerificationForm({ onSuccess }: WorkEmailVerificationFormProps) {
  const [workEmail, setWorkEmail] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState<string>('none');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [organizationLoadError, setOrganizationLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      setLoadingOrgs(true);
      setOrganizationLoadError(null);
      const response = await apiFetch('/api/organizations');

      if (!response.ok) {
        throw new Error('Failed to fetch organizations');
      }

      const data = await response.json();
      const normalizedOrganizations = (
        (data.organizations as Organization[] | undefined) || []
      ).map((organization) => ({
        id: organization.id,
        slug: organization.slug,
        displayName: organization.displayName ?? organization.display_name ?? null,
        display_name: organization.display_name ?? organization.displayName ?? null,
      }));

      setOrganizations(normalizedOrganizations);
    } catch (err) {
      dispatchClientErrorDiagnostic('settings.work_email.organizations_fetch_failed', err);
      setOrganizations([]);
      setOrganizationLoadError(
        'Organization list could not load. You can still send the confirmation email now and link an organization later.'
      );
    } finally {
      setLoadingOrgs(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      setEmailError('Work email is required');
      return false;
    }

    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }

    // Check for common free email providers
    const freeEmailDomains = [
      'gmail.com',
      'yahoo.com',
      'hotmail.com',
      'outlook.com',
      'protonmail.com',
      'icloud.com',
      'aol.com',
      'mail.com',
    ];

    const domain = email.split('@')[1].toLowerCase();
    if (freeEmailDomains.includes(domain)) {
      setEmailError('Please use your company/organization email, not a personal email');
      return false;
    }

    setEmailError(null);
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setWorkEmail(value);
    if (emailError) {
      setEmailError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(workEmail)) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await apiFetch('/api/verification/work-email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workEmail: workEmail.trim().toLowerCase(),
          orgId: selectedOrgId && selectedOrgId !== 'none' ? selectedOrgId : null,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(workEmailSendError(data?.error, getResponseStatus(response)));
        return;
      }

      setSuccess(true);

      // Call onSuccess after showing success message briefly
      setTimeout(() => {
        onSuccess();
      }, 3000);
    } catch (err) {
      dispatchClientErrorDiagnostic('settings.work_email.send_failed', err);
      setError(WORK_EMAIL_SEND_RETRY_MESSAGE);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-900 dark:text-green-100">
          <strong>Confirmation email sent.</strong>
          <br />
          Please check your inbox at <strong>{workEmail}</strong> and click the confirmation link.
          This keeps your work email account check current for 24 hours.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="work-email" className="text-sm font-medium">
          Work Email Address *
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="work-email"
            type="email"
            placeholder="you@company.com"
            value={workEmail}
            onChange={handleEmailChange}
            onBlur={() => validateEmail(workEmail)}
            className={`pl-10 ${emailError ? 'border-red-500' : ''}`}
            disabled={submitting}
            required
          />
        </div>
        {emailError && <p className="text-sm text-red-600 dark:text-red-400">{emailError}</p>}
        <p className="text-xs text-muted-foreground">
          Use your company or organization email address, not a personal email. This supports
          account-side organization linking only.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="organization" className="text-sm font-medium">
          Organization (Optional)
        </Label>
        <Select
          value={selectedOrgId}
          onValueChange={setSelectedOrgId}
          disabled={submitting || loadingOrgs}
        >
          <SelectTrigger id="organization">
            <SelectValue
              placeholder={
                loadingOrgs ? ORGANIZATION_LOADING_PLACEHOLDER : 'Select your organization'
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None - I&apos;ll link later</SelectItem>
            {organizations.map((org) => (
              <SelectItem key={org.id} value={org.id}>
                {org.displayName || org.slug || 'Unnamed organization'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {loadingOrgs ? (
          <p className="text-xs text-muted-foreground" role="status" aria-live="polite">
            {ORGANIZATION_LOADING_STATUS}
          </p>
        ) : organizationLoadError ? (
          <div
            className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900"
            role="alert"
          >
            <p>{organizationLoadError}</p>
            <button
              type="button"
              onClick={() => void fetchOrganizations()}
              disabled={loadingOrgs || submitting}
              className="mt-2 inline-flex min-h-8 items-center rounded-full border border-amber-300 bg-white px-3 text-xs font-semibold text-amber-950 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Retry organization list
            </button>
          </div>
        ) : organizations.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No organizations are available for your account right now. You can still verify your
            email and link an organization later.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Link this account to an organization if relevant. You can change it later.
          </p>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-proofound-forest px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-proofound-forest/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending verification email...
            </>
          ) : (
            <>
              <Mail className="w-4 h-4" />
              Send confirmation email
            </>
          )}
        </button>
      </div>

      <div className="pt-4 border-t">
        <p className="text-xs text-muted-foreground">
          <strong>How it works:</strong>
          <br />
          1. We&apos;ll send a confirmation link to your work email
          <br />
          2. Click the link to confirm you control that inbox
          <br />
          3. Proofound records a work email account check for organization-linking support
        </p>
      </div>
    </form>
  );
}
