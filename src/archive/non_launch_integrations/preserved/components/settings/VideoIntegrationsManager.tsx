'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api/fetch';

interface Integration {
  provider: 'google';
  connected: boolean;
  connectedAt?: string | null;
  expiresAt?: string | null;
}

interface VideoIntegrationsManagerProps {
  variant?: 'inline' | 'standalone';
  returnTo?: string;
}

const SETTINGS_TAB_PATH = '/app/i/settings?tab=interviews';
const GOOGLE_VERIFICATION_HELP =
  'Google blocked access because the Proofound app is not verified for your account. Ask an admin to add your Google account as a test user (Testing mode) or complete Google app verification (Production mode), then try again.';

function isGoogleVerificationDenied(error?: string | null, message?: string | null): boolean {
  const combined = `${error || ''} ${message || ''}`.toLowerCase();
  return (
    combined.includes('access_denied') &&
    (combined.includes('has not completed the google verification process') ||
      combined.includes('app not verified') ||
      combined.includes('verification process') ||
      combined.includes('unverified') ||
      combined.includes('sensitive') ||
      combined.includes('restricted'))
  );
}

function getOAuthErrorToastMessage(error?: string | null, message?: string | null): string {
  if (isGoogleVerificationDenied(error, message)) {
    return GOOGLE_VERIFICATION_HELP;
  }

  return `Connection failed: ${message || error || 'Unknown error'}`;
}

export function VideoIntegrationsManager({
  variant = 'inline',
  returnTo = SETTINGS_TAB_PATH,
}: VideoIntegrationsManagerProps) {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const searchParams = useSearchParams();

  const cleanupPath = returnTo;

  useEffect(() => {
    fetchIntegrations();

    const success = searchParams?.get('success');
    const error = searchParams?.get('error');
    const message = searchParams?.get('message');

    if (success === 'google_connected') {
      toast.success('Google Meet connected successfully');
      window.history.replaceState({}, '', cleanupPath);
    } else if (error) {
      toast.error(getOAuthErrorToastMessage(error, message));
      window.history.replaceState({}, '', cleanupPath);
    }
  }, [searchParams, cleanupPath]);

  const fetchIntegrations = async () => {
    try {
      const response = await fetch('/api/integrations/video');
      if (response.ok) {
        const data = await response.json();
        const googleOnly = ((data.integrations || []) as Integration[]).filter(
          (integration) => integration.provider === 'google'
        );
        setIntegrations(googleOnly);
      }
    } catch (error) {
      console.error('Failed to fetch integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const authParams = new URLSearchParams({ returnTo: cleanupPath });
      const response = await fetch(`/api/integrations/video/google/auth?${authParams}`);
      if (!response.ok) {
        throw new Error('Failed to initiate connection');
      }

      const data = await response.json();
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('Failed to connect Google Meet:', error);
      toast.error('Failed to connect Google Calendar');
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Google Calendar?')) {
      return;
    }

    try {
      const response = await apiFetch('/api/integrations/video/google', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect');
      }

      toast.success('Google Calendar disconnected');
      await fetchIntegrations();
    } catch (error) {
      console.error('Failed to disconnect Google Calendar:', error);
      toast.error('Failed to disconnect Google Calendar');
    }
  };

  const googleIntegration = useMemo(
    () => integrations.find((integration) => integration.provider === 'google') ?? null,
    [integrations]
  );

  const formatConnectedDate = (date?: string | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <div
        className={variant === 'standalone' ? 'py-12 text-center text-muted-foreground' : 'py-4'}
      >
        <span className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground">
          Loading interview scheduling setup...
        </span>
      </div>
    );
  }

  const content = (
    <div className="space-y-4">
      <Card variant="bento" className="border-proofound-stone dark:border-border">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Video className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Google Meet</CardTitle>
                <CardDescription>
                  Create Google Meet links automatically when you schedule interviews
                </CardDescription>
              </div>
            </div>
            {googleIntegration?.connected ? (
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-muted text-muted-foreground border-border">
                <XCircle className="w-3 h-3 mr-1" />
                Not Connected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-900">
              Launch corridor note: Google Meet is the only connected provider in scope. If you do
              not connect it, you can still schedule interviews with a manual meeting link.
            </p>
          </div>

          {googleIntegration?.connected ? (
            <>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                Connected since {formatConnectedDate(googleIntegration.connectedAt)}
              </p>
              <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                Proofound will create Google Meet meetings from your connected Google account when
                you host interviews. Participants join using the generated meeting link.
              </p>
              <Button
                variant="outline"
                onClick={handleDisconnect}
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                Disconnect Google Calendar
              </Button>
            </>
          ) : (
            <>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-900">
                    Google Meet is optional. If not connected, schedule interviews with a manual
                    meeting link instead.
                  </p>
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-900">
                  If Google shows "Access blocked" with "Error 403: access_denied", an admin must
                  add your Google account as a test user or complete Google app verification.
                </p>
              </div>
              <Button
                onClick={handleConnect}
                disabled={connecting}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                {connecting ? 'Connecting...' : 'Connect Google Calendar'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );

  if (variant === 'standalone') {
    return (
      <div className="min-h-screen bg-japandi-bg">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-foreground mb-2">Interview Scheduling</h1>
            <p className="text-muted-foreground">
              Connect Google Meet for interview scheduling or stay with manual meeting links.
            </p>
          </div>
          {content}
        </div>
      </div>
    );
  }

  return content;
}
