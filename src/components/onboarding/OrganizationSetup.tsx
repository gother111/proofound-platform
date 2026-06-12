'use client';

import { type FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { completeOrganizationOnboarding } from '@/actions/onboarding';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle, Copy, ExternalLink } from 'lucide-react';

type CopyFeedback = {
  kind: 'success' | 'error';
  message: string;
};

const ORGANIZATION_SETUP_RETRY_MESSAGE =
  'Organization setup could not be saved. Your details are still here; please try again.';

const ORGANIZATION_SETUP_SAFE_ACTION_ERRORS = new Set([
  'Organization name, slug, and type are required',
  'Slug can only contain lowercase letters, numbers, and hyphens',
  'Invalid organization type',
  'You are already connected to an organization. Please contact support to update your organization membership.',
  'Organization slug already taken. Please choose another.',
  'Failed to create organization. Please try again.',
]);

function organizationSetupActionErrorMessage(message: string) {
  if (ORGANIZATION_SETUP_SAFE_ACTION_ERRORS.has(message)) {
    return message;
  }

  dispatchClientErrorDiagnostic('onboarding.organization.returned_error', new Error(message));
  return ORGANIZATION_SETUP_RETRY_MESSAGE;
}

export function OrganizationSetup() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [success, setSuccess] = useState<{
    orgName: string;
    orgSlug: string;
    portfolioUrl: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<CopyFeedback | null>(null);

  // Check if user already has an organization on mount
  useEffect(() => {
    async function checkExistingOrg() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setCheckingExisting(false);
          return;
        }

        const { data: existingMemberships } = await supabase
          .from('organization_members')
          .select('org_id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .limit(1);

        if (existingMemberships && existingMemberships.length > 0) {
          const { data: orgData } = await supabase
            .from('organizations')
            .select('slug')
            .eq('id', existingMemberships[0].org_id)
            .single();

          if (orgData?.slug) {
            router.push(`/app/o/${orgData.slug}/home`);
            return;
          }
        }
      } catch (err) {
        dispatchClientErrorDiagnostic('onboarding.organization.existing_check_failed', err);
      } finally {
        setCheckingExisting(false);
      }
    }

    checkExistingOrg();
  }, [router]);

  if (checkingExisting) {
    return (
      <Card className="max-w-2xl mx-auto border-proofound-stone dark:border-border rounded-2xl">
        <CardContent className="py-8 text-center">
          <div className="animate-pulse text-proofound-charcoal/70 dark:text-muted-foreground">
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData(event.currentTarget);
      const result = await completeOrganizationOnboarding(formData);

      if (result.error) {
        setError(organizationSetupActionErrorMessage(result.error));
        setIsLoading(false);
        return;
      }

      // Success - show dedicated public portfolio step
      if (result.orgSlug) {
        const orgName = formData.get('displayName') as string;
        const portfolioUrl = `${window.location.origin}/portfolio/org/${result.orgSlug}`;
        setSuccess({ orgName, orgSlug: result.orgSlug, portfolioUrl });
        return;
      }

      setError(
        'Organization was created, but the public link did not finish. Refresh and try again.'
      );
      setIsLoading(false);
    } catch (err) {
      dispatchClientErrorDiagnostic('onboarding.organization.submit_failed', err);
      setError(ORGANIZATION_SETUP_RETRY_MESSAGE);
      setIsLoading(false);
    }
  }

  // Show success message
  if (success) {
    const handleCopy = async () => {
      try {
        setCopyFeedback(null);
        await navigator.clipboard.writeText(success.portfolioUrl);
        setCopied(true);
        setCopyFeedback({ kind: 'success', message: 'Organization portfolio link copied.' });
        setTimeout(() => {
          setCopied(false);
          setCopyFeedback(null);
        }, 1500);
      } catch (err) {
        dispatchClientErrorDiagnostic('onboarding.organization.copy_portfolio_link_failed', err);
        setCopied(false);
        setCopyFeedback({
          kind: 'error',
          message: 'Organization portfolio link could not be copied. Try again.',
        });
      }
    };

    return (
      <Card className="max-w-2xl mx-auto border-proofound-stone dark:border-border rounded-2xl">
        <CardContent className="py-12 px-8">
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-proofound-forest/10 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-proofound-forest dark:text-primary" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-['Crimson_Pro'] font-semibold text-proofound-forest dark:text-primary">
                Organization link ready
              </h2>
              <p className="text-3xl font-bold text-proofound-charcoal dark:text-foreground">
                Welcome to {success.orgName}!
              </p>
              <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground">
                Shareable by link on day 1. Search engines stay off until you opt in.
              </p>
            </div>

            <div className="bg-proofound-stone/30 dark:bg-muted rounded-xl p-6 text-left space-y-3">
              <p className="font-medium text-proofound-charcoal dark:text-foreground">Live URL</p>
              <p className="text-sm break-all text-proofound-charcoal/70 dark:text-muted-foreground">
                {success.portfolioUrl}
              </p>
            </div>

            <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-start">
              <div className="flex w-full flex-col items-stretch gap-1.5 sm:w-auto sm:items-start">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-center gap-2 sm:w-auto"
                  onClick={handleCopy}
                >
                  <Copy className="h-4 w-4" />
                  {copied ? 'Copied' : 'Copy link'}
                </Button>
                {copyFeedback ? (
                  <p
                    className={
                      copyFeedback.kind === 'error'
                        ? 'max-w-64 text-xs leading-5 text-[#8A3F21]'
                        : 'max-w-64 text-xs leading-5 text-proofound-forest'
                    }
                    role={copyFeedback.kind === 'error' ? 'alert' : 'status'}
                    aria-live={copyFeedback.kind === 'error' ? 'assertive' : 'polite'}
                  >
                    {copyFeedback.message}
                  </p>
                ) : null}
              </div>
              <Button
                asChild
                type="button"
                variant="outline"
                className="w-full justify-center gap-2 sm:w-auto"
              >
                <a href={success.portfolioUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Open portfolio
                </a>
              </Button>
              <Button
                type="button"
                onClick={() => router.push(`/app/o/${success.orgSlug}/assignments/new`)}
                className="w-full sm:w-auto"
              >
                Create first assignment
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto border-proofound-stone dark:border-border rounded-2xl">
      <CardHeader>
        <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground">
          Create your organization
        </CardTitle>
        <CardDescription className="text-proofound-charcoal/70 dark:text-muted-foreground">
          Add the basics reviewers need to trust the work context, then create one assignment.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="displayName" className="text-proofound-charcoal dark:text-foreground">
              Organization Name *
            </Label>
            <Input
              id="displayName"
              name="displayName"
              placeholder="Your Organization"
              required
              disabled={isLoading}
              className="border-proofound-stone dark:border-border focus-visible:ring-proofound-forest"
            />
            <p className="text-xs text-proofound-charcoal/70 dark:text-muted-foreground mt-1">
              This appears on your public organization trust page.
            </p>
          </div>

          <div>
            <Label htmlFor="slug" className="text-proofound-charcoal dark:text-foreground">
              Public link name *
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground">
                proofound.io/portfolio/org/
              </span>
              <Input
                id="slug"
                name="slug"
                placeholder="your-org"
                pattern="[a-z0-9-]+"
                required
                disabled={isLoading}
                className="flex-1 border-proofound-stone dark:border-border focus-visible:ring-proofound-forest"
              />
            </div>
            <p className="text-xs text-proofound-charcoal/70 dark:text-muted-foreground mt-1">
              Lowercase letters, numbers, and hyphens only
            </p>
          </div>

          <div>
            <Label htmlFor="type" className="text-proofound-charcoal dark:text-foreground">
              Organization Type *
            </Label>
            <select
              id="type"
              name="type"
              required
              disabled={isLoading}
              className="flex h-11 w-full rounded-lg border border-proofound-stone dark:border-border bg-white dark:bg-background px-4 py-2 text-base text-proofound-charcoal dark:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest"
            >
              <option value="">Select a type...</option>
              <option value="company">Company / Business</option>
              <option value="ngo">Non-profit / NGO</option>
              <option value="government">Government / Public Sector</option>
              <option value="network">Network / Community</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <Label htmlFor="legalName" className="text-proofound-charcoal dark:text-foreground">
              Legal Name
            </Label>
            <Input
              id="legalName"
              name="legalName"
              placeholder="Legal entity name"
              disabled={isLoading}
              className="border-proofound-stone dark:border-border focus-visible:ring-proofound-forest"
            />
            <p className="text-xs text-proofound-charcoal/70 dark:text-muted-foreground mt-1">
              Optional for launch. Add it now only if it helps people verify you.
            </p>
          </div>

          <div>
            <Label htmlFor="mission" className="text-proofound-charcoal dark:text-foreground">
              Mission Statement
            </Label>
            <textarea
              id="mission"
              name="mission"
              placeholder="What does your organization do?"
              maxLength={2000}
              disabled={isLoading}
              className="flex min-h-[120px] w-full rounded-lg border border-proofound-stone dark:border-border bg-white dark:bg-background px-4 py-2 text-base transition-colors placeholder:text-proofound-charcoal/40 dark:placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:border-proofound-forest disabled:cursor-not-allowed disabled:opacity-50 text-proofound-charcoal dark:text-foreground"
            />
            <p className="text-xs text-proofound-charcoal/70 dark:text-muted-foreground mt-1">
              A short purpose statement is enough for launch.
            </p>
          </div>

          <div>
            <Label htmlFor="website" className="text-proofound-charcoal dark:text-foreground">
              Website (optional)
            </Label>
            <Input
              id="website"
              name="website"
              type="url"
              placeholder="https://your-website.com"
              disabled={isLoading}
              className="border-proofound-stone dark:border-border focus-visible:ring-proofound-forest"
            />
            <p className="text-xs text-proofound-charcoal/70 dark:text-muted-foreground mt-1">
              Used for trust basics. Search engines stay off by default.
            </p>
          </div>

          {error ? (
            <div
              className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm"
              role="alert"
              aria-live="assertive"
            >
              {error}
            </div>
          ) : null}

          <div className="flex justify-end gap-4">
            <Button
              type="submit"
              disabled={isLoading}
              size="lg"
              className="bg-proofound-forest hover:bg-proofound-forest/90 text-white"
            >
              {isLoading ? 'Creating Organization...' : 'Create Organization'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
