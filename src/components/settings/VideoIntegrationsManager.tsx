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
  provider: 'zoom' | 'google';
  connected: boolean;
  connectedAt?: string | null;
  expiresAt?: string | null;
}

interface VideoIntegrationsManagerProps {
  variant?: 'inline' | 'standalone';
  returnTo?: string;
}

const SETTINGS_TAB_PATH = '/app/i/settings?tab=integrations';

export function VideoIntegrationsManager({
  variant = 'inline',
  returnTo = SETTINGS_TAB_PATH,
}: VideoIntegrationsManagerProps) {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const cleanupPath = returnTo;

  useEffect(() => {
    fetchIntegrations();

    // Handle OAuth callbacks when users return to the settings tab.
    const success = searchParams?.get('success');
    const error = searchParams?.get('error');
    const message = searchParams?.get('message');

    if (success === 'zoom_connected') {
      toast.success('Zoom connected successfully');
      window.history.replaceState({}, '', cleanupPath);
    } else if (success === 'google_connected') {
      toast.success('Google Meet connected successfully');
      window.history.replaceState({}, '', cleanupPath);
    } else if (error) {
      toast.error(`Connection failed: ${message || error}`);
      window.history.replaceState({}, '', cleanupPath);
    }
  }, [searchParams, cleanupPath]);

  const fetchIntegrations = async () => {
    try {
      const response = await fetch('/api/integrations/video');
      if (response.ok) {
        const data = await response.json();
        setIntegrations(data.integrations || []);
      }
    } catch (error) {
      console.error('Failed to fetch integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (provider: 'zoom' | 'google') => {
    setConnecting(provider);
    try {
      // Endpoint returns a canonical provider connect path.
      const authParams = new URLSearchParams({ returnTo: cleanupPath });
      const response = await fetch(`/api/integrations/video/${provider}/auth?${authParams}`);
      if (!response.ok) {
        throw new Error('Failed to initiate connection');
      }

      const data = await response.json();
      window.location.href = data.authUrl;
    } catch (error) {
      console.error(`Failed to connect ${provider}:`, error);
      toast.error(`Failed to connect ${provider === 'zoom' ? 'Zoom' : 'Google Calendar'}`);
      setConnecting(null);
    }
  };

  const handleDisconnect = async (provider: 'zoom' | 'google') => {
    if (
      !confirm(
        `Are you sure you want to disconnect ${provider === 'zoom' ? 'Zoom' : 'Google Calendar'}?`
      )
    ) {
      return;
    }

    try {
      const response = await apiFetch(`/api/integrations/video/${provider}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect');
      }

      toast.success(`${provider === 'zoom' ? 'Zoom' : 'Google Calendar'} disconnected`);
      await fetchIntegrations();
    } catch (error) {
      console.error(`Failed to disconnect ${provider}:`, error);
      toast.error(`Failed to disconnect ${provider === 'zoom' ? 'Zoom' : 'Google Calendar'}`);
    }
  };

  const byProvider = useMemo(() => {
    const zoom = integrations.find((i) => i.provider === 'zoom');
    const google = integrations.find((i) => i.provider === 'google');
    return {
      zoom,
      google,
    };
  }, [integrations]);

  const formatConnectedDate = (date?: string | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className={variant === 'standalone' ? 'py-12 text-center text-[#6B6760]' : 'py-4'}>
        <span className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground">
          Loading integrations...
        </span>
      </div>
    );
  }

  const content = (
    <div className="space-y-4">
      <Card className="border-[#E8E6DD] dark:border-border">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Video className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Zoom</CardTitle>
                <CardDescription>Create Zoom links automatically when scheduling</CardDescription>
              </div>
            </div>
            {byProvider.zoom?.connected ? (
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-200">
                <XCircle className="w-3 h-3 mr-1" />
                Not Connected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {byProvider.zoom?.connected ? (
            <>
              <p className="text-sm text-[#6B6760] dark:text-muted-foreground">
                Connected since {formatConnectedDate(byProvider.zoom.connectedAt)}
              </p>
              <p className="text-xs text-[#6B6760] dark:text-muted-foreground">
                Proofound will create Zoom meetings from your connected Zoom account when you host
                interviews. Participants join using the generated meeting link.
              </p>
              <Button
                variant="outline"
                onClick={() => handleDisconnect('zoom')}
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                Disconnect Zoom
              </Button>
            </>
          ) : (
            <>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-900">
                    Optional integration. If not connected, you can still schedule interviews using
                    a manual meeting link.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => handleConnect('zoom')}
                disabled={connecting === 'zoom'}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {connecting === 'zoom' ? 'Connecting...' : 'Connect Zoom'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-[#E8E6DD] dark:border-border">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Video className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Google Meet</CardTitle>
                <CardDescription>
                  Create Meet links via Google Calendar automatically
                </CardDescription>
              </div>
            </div>
            {byProvider.google?.connected ? (
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-200">
                <XCircle className="w-3 h-3 mr-1" />
                Not Connected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {byProvider.google?.connected ? (
            <>
              <p className="text-sm text-[#6B6760] dark:text-muted-foreground">
                Connected since {formatConnectedDate(byProvider.google.connectedAt)}
              </p>
              <p className="text-xs text-[#6B6760] dark:text-muted-foreground">
                Proofound will create Google Meet meetings from your connected Google account when
                you host interviews. Participants join using the generated meeting link.
              </p>
              <Button
                variant="outline"
                onClick={() => handleDisconnect('google')}
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
                    Optional integration. If not connected, you can still schedule interviews using
                    a manual meeting link.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => handleConnect('google')}
                disabled={connecting === 'google'}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                {connecting === 'google' ? 'Connecting...' : 'Connect Google Calendar'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );

  if (variant === 'standalone') {
    return (
      <div className="min-h-screen bg-[#F7F6F1]">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-[#2D3330] mb-2">Integrations</h1>
            <p className="text-[#6B6760]">
              Connect video calling platforms for interview scheduling
            </p>
          </div>
          {content}
        </div>
      </div>
    );
  }

  return content;
}
