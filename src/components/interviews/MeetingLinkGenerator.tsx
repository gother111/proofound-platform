/**
 * Meeting Link Generator Component
 *
 * Integrates with Zoom and Google Meet for automatic meeting link generation
 * Implements PRD requirement for streamlined interview scheduling
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Video,
  Calendar,
  Link2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api/fetch';

interface Integration {
  provider: 'zoom' | 'google';
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
      if (response.ok) {
        const data = await response.json();
        setIntegrations(data.integrations || []);
      }
    } catch (error) {
      console.error('Failed to fetch integrations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async (provider: 'zoom' | 'google') => {
    try {
      // In production, this would redirect to OAuth flow
      const response = await apiFetch(`/api/integrations/video/${provider}/auth`);
      if (response.ok) {
        const data = await response.json();
        // Redirect to OAuth URL
        window.location.href = data.authUrl;
      } else {
        toast.error(`Failed to initiate ${provider} connection`);
      }
    } catch (error) {
      console.error(`Failed to connect ${provider}:`, error);
      toast.error(`Failed to connect ${provider}`);
    }
  };

  const handleDisconnect = async (provider: 'zoom' | 'google') => {
    try {
      const response = await apiFetch(`/api/integrations/video/${provider}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success(`${provider === 'zoom' ? 'Zoom' : 'Google Meet'} disconnected`);
        fetchIntegrations();
      } else {
        toast.error('Failed to disconnect');
      }
    } catch (error) {
      console.error('Failed to disconnect:', error);
      toast.error('Failed to disconnect');
    }
  };

  const handleGenerateLink = async (provider: 'zoom' | 'google') => {
    setIsGenerating(true);
    try {
      const response = await apiFetch('/api/integrations/video/generate-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
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

      if (onLinkGenerated) {
        onLinkGenerated(data.meetingLink);
      }

      toast.success('Meeting link generated successfully!');
    } catch (error) {
      console.error('Failed to generate link:', error);
      toast.error('Failed to generate meeting link');
    } finally {
      setIsGenerating(false);
    }
  };

  const zoomIntegration = integrations.find((i) => i.provider === 'zoom');
  const googleIntegration = integrations.find((i) => i.provider === 'google');

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
            Video Conferencing
          </CardTitle>
          <CardDescription className="text-proofound-charcoal/70 dark:text-muted-foreground">
            Connect Zoom or Google Meet to automatically generate interview links
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Zoom Integration */}
          <div className="p-4 border border-proofound-stone dark:border-border rounded-lg">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Video className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground dark:text-foreground">Zoom</h3>
                  {zoomIntegration?.connected ? (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-green-600 dark:text-green-400">Connected</span>
                      {zoomIntegration.email && (
                        <span className="text-muted-foreground dark:text-muted-foreground">
                          • {zoomIntegration.email}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-muted-foreground">
                      <AlertCircle className="w-4 h-4" />
                      Not connected
                    </div>
                  )}
                </div>
              </div>

              {zoomIntegration?.connected ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleGenerateLink('zoom')}
                    disabled={isGenerating}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Generate Link
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDisconnect('zoom')}>
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={() => handleConnect('zoom')}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  Connect Zoom
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground dark:text-muted-foreground">
              Automatically create Zoom meetings for interviews with calendar integration
            </p>
          </div>

          {/* Google Meet Integration */}
          <div className="p-4 border border-proofound-stone dark:border-border rounded-lg">
            <div className="flex items-start justify-between mb-3">
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
                      {googleIntegration.email && (
                        <span className="text-muted-foreground dark:text-muted-foreground">
                          • {googleIntegration.email}
                        </span>
                      )}
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
                    onClick={() => handleGenerateLink('google')}
                    disabled={isGenerating}
                    className="bg-red-600 text-white hover:bg-red-700"
                  >
                    Generate Link
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDisconnect('google')}>
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={() => handleConnect('google')}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  Connect Google
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground dark:text-muted-foreground">
              Create Google Meet links and add to Google Calendar automatically
            </p>
          </div>

          {/* Generated Link Display */}
          {generatedLink && (
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
          )}

          {/* Info Alert */}
          {!zoomIntegration?.connected && !googleIntegration?.connected && (
            <Alert className="border-blue-300 bg-blue-50">
              <Settings className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm">
                <strong>Connect a video service</strong> to automatically generate meeting links for
                interviews. Both Zoom and Google Meet are supported.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Benefits Card */}
      <Card variant="bento" className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-['Crimson_Pro']">Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground dark:text-muted-foreground">
            <p>
              • <strong>Automatic link generation:</strong> Create meeting links with one click
            </p>
            <p>
              • <strong>Calendar integration:</strong> Invites sent to all participants
            </p>
            <p>
              • <strong>No manual setup:</strong> Save time on interview coordination
            </p>
            <p>
              • <strong>Professional experience:</strong> Seamless scheduling for candidates
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
