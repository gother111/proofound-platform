'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Link2, CheckCircle2, AlertCircle, Settings, Video } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api/fetch';

interface Integration {
  provider: 'google';
  connected: boolean;
  email?: string;
  expiresAt?: string;
}

interface MeetingLinkGeneratorProps {
  interviewId?: string;
  onLinkGenerated?: (link: string) => void;
}

export function MeetingLinkGenerator({ interviewId, onLinkGenerated }: MeetingLinkGeneratorProps) {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      setIsLoading(true);
      const response = await apiFetch('/api/integrations/video');
      if (!response.ok) return;

      const data = await response.json();
      setIntegrations(
        ((data.integrations || []) as Integration[]).filter(
          (integration) => integration.provider === 'google'
        )
      );
    } catch (error) {
      console.error('Failed to fetch integrations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const response = await apiFetch('/api/integrations/video/google/auth');
      if (!response.ok) {
        toast.error('Failed to initiate Google Meet connection');
        return;
      }

      const data = await response.json();
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('Failed to connect Google Meet:', error);
      toast.error('Failed to connect Google Meet');
    }
  };

  const handleDisconnect = async () => {
    try {
      const response = await apiFetch('/api/integrations/video/google', {
        method: 'DELETE',
      });

      if (!response.ok) {
        toast.error('Failed to disconnect');
        return;
      }

      toast.success('Google Meet disconnected');
      fetchIntegrations();
    } catch (error) {
      console.error('Failed to disconnect:', error);
      toast.error('Failed to disconnect');
    }
  };

  const handleGenerateLink = async () => {
    setIsGenerating(true);
    try {
      const response = await apiFetch('/api/integrations/video/generate-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'google',
          interviewId,
          title: 'Interview Meeting',
          duration: 60,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate meeting link');
      }

      const data = await response.json();
      setGeneratedLink(data.meetingLink);
      onLinkGenerated?.(data.meetingLink);
      toast.success('Meeting link generated successfully!');
    } catch (error) {
      console.error('Failed to generate link:', error);
      toast.error('Failed to generate meeting link');
    } finally {
      setIsGenerating(false);
    }
  };

  const googleIntegration = useMemo(
    () => integrations.find((integration) => integration.provider === 'google') ?? null,
    [integrations]
  );

  if (isLoading) {
    return (
      <Card variant="bento" className="rounded-2xl">
        <CardContent className="py-8 text-center text-muted-foreground dark:text-muted-foreground">
          Loading integrations...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card variant="bento" className="rounded-2xl">
        <CardHeader>
          <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground flex items-center gap-2">
            <Video className="w-5 h-5" />
            Interview Scheduling
          </CardTitle>
          <CardDescription className="text-proofound-charcoal/70 dark:text-muted-foreground">
            Connect Google Meet to generate interview links automatically, or use a manual meeting
            link when you prefer not to connect a provider.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="p-4 border border-proofound-stone dark:border-border rounded-lg">
            <div className="flex items-start justify-between mb-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-red-600 dark:text-red-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground dark:text-foreground">
                    Google Meet
                  </h3>
                  {googleIntegration?.connected ? (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-green-600 dark:text-green-400">Connected</span>
                      {googleIntegration.email ? (
                        <span className="text-muted-foreground dark:text-muted-foreground">
                          • {googleIntegration.email}
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-muted-foreground">
                      <AlertCircle className="w-4 h-4" />
                      Not connected
                    </div>
                  )}
                </div>
              </div>

              {googleIntegration?.connected ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleGenerateLink}
                    disabled={isGenerating}
                    className="bg-red-600 text-white hover:bg-red-700"
                  >
                    Generate Link
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleDisconnect}>
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={handleConnect}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  Connect Google Meet
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground dark:text-muted-foreground">
              Create Google Meet links and add them to Google Calendar automatically.
            </p>
          </div>

          {generatedLink ? (
            <Alert className="border-green-300 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">Meeting link generated!</p>
                  <div className="flex items-center gap-2 p-2 bg-white rounded border border-green-200">
                    <Link2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <code className="text-xs flex-1 truncate">{generatedLink}</code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedLink);
                        toast.success('Link copied to clipboard');
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          ) : null}

          {!googleIntegration?.connected ? (
            <Alert className="border-blue-300 bg-blue-50">
              <Settings className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm">
                <strong>Automatic links are optional.</strong> If Google Meet is not connected, you
                can still schedule interviews with a manual meeting link.
              </AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      <Card variant="bento" className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-['Crimson_Pro']">Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground dark:text-muted-foreground">
            <p>
              • <strong>Automatic link generation:</strong> Create interview links with one click
            </p>
            <p>
              • <strong>Calendar integration:</strong> Invites stay tied to your connected Google
              account
            </p>
            <p>
              • <strong>Manual fallback:</strong> Stay launch-safe even when no provider is
              connected
            </p>
            <p>
              • <strong>Cleaner review flow:</strong> Keep scheduling inside the narrow interview
              corridor
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
