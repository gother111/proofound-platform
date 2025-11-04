'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';

interface Integration {
  provider: 'zoom' | 'google';
  connected: boolean;
  connectedAt?: string;
}

export function IntegrationsClient() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchIntegrations();

    // Handle OAuth callbacks
    const success = searchParams?.get('success');
    const error = searchParams?.get('error');
    const message = searchParams?.get('message');

    if (success === 'zoom_connected') {
      toast.success('Zoom connected successfully!');
      // Clear URL params
      window.history.replaceState({}, '', '/app/i/settings/integrations');
    } else if (success === 'google_connected') {
      toast.success('Google Calendar connected successfully!');
      window.history.replaceState({}, '', '/app/i/settings/integrations');
    } else if (error) {
      toast.error(`Connection failed: ${message || error}`);
      window.history.replaceState({}, '', '/app/i/settings/integrations');
    }
  }, [searchParams]);

  const fetchIntegrations = async () => {
    try {
      const response = await fetch('/api/integrations');
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
      // Request OAuth URL
      const response = await fetch(`/api/integrations/${provider}/connect`);
      if (!response.ok) {
        throw new Error('Failed to initiate connection');
      }

      const data = await response.json();
      
      // Redirect to OAuth URL
      window.location.href = data.authUrl;
    } catch (error) {
      console.error(`Failed to connect ${provider}:`, error);
      toast.error(`Failed to connect ${provider}`);
      setConnecting(null);
    }
  };

  const handleDisconnect = async (provider: 'zoom' | 'google') => {
    if (!confirm(`Are you sure you want to disconnect ${provider === 'zoom' ? 'Zoom' : 'Google Calendar'}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/integrations/${provider}/disconnect`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect');
      }

      toast.success(`${provider === 'zoom' ? 'Zoom' : 'Google Calendar'} disconnected`);
      await fetchIntegrations();
    } catch (error) {
      console.error(`Failed to disconnect ${provider}:`, error);
      toast.error(`Failed to disconnect ${provider}`);
    }
  };

  const getIntegration = (provider: 'zoom' | 'google') => {
    return integrations.find((i) => i.provider === provider);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F6F1] flex items-center justify-center">
        <div className="text-[#6B6760]">Loading integrations...</div>
      </div>
    );
  }

  const zoomIntegration = getIntegration('zoom');
  const googleIntegration = getIntegration('google');

  return (
    <div className="min-h-screen bg-[#F7F6F1]">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-[#2D3330] mb-2">Integrations</h1>
          <p className="text-[#6B6760]">Connect video calling platforms for interview scheduling</p>
        </div>

        <div className="space-y-4">
          {/* Zoom Integration */}
          <Card className="border-[#E8E6DD]">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Video className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Zoom</CardTitle>
                    <CardDescription>Schedule video interviews via Zoom</CardDescription>
                  </div>
                </div>
                {zoomIntegration?.connected ? (
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
            <CardContent>
              {zoomIntegration?.connected ? (
                <div className="space-y-4">
                  <p className="text-sm text-[#6B6760]">
                    Connected since {new Date(zoomIntegration.connectedAt!).toLocaleDateString()}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => handleDisconnect('zoom')}
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    Disconnect Zoom
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-amber-900">
                        <p className="font-medium mb-1">Setup Required</p>
                        <p className="text-xs">
                          Before connecting, create a Zoom OAuth app at{' '}
                          <a
                            href="https://marketplace.zoom.us/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            marketplace.zoom.us
                          </a>
                          . See <code>OAUTH_SETUP_GUIDE.md</code> for instructions.
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleConnect('zoom')}
                    disabled={connecting === 'zoom'}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {connecting === 'zoom' ? 'Connecting...' : 'Connect Zoom'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Google Meet Integration */}
          <Card className="border-[#E8E6DD]">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Video className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Google Meet</CardTitle>
                    <CardDescription>Schedule video interviews via Google Calendar</CardDescription>
                  </div>
                </div>
                {googleIntegration?.connected ? (
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
            <CardContent>
              {googleIntegration?.connected ? (
                <div className="space-y-4">
                  <p className="text-sm text-[#6B6760]">
                    Connected since {new Date(googleIntegration.connectedAt!).toLocaleDateString()}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => handleDisconnect('google')}
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    Disconnect Google Calendar
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-amber-900">
                        <p className="font-medium mb-1">Setup Required</p>
                        <p className="text-xs">
                          Before connecting, create a Google Cloud project at{' '}
                          <a
                            href="https://console.cloud.google.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            console.cloud.google.com
                          </a>
                          . See <code>OAUTH_SETUP_GUIDE.md</code> for instructions.
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleConnect('google')}
                    disabled={connecting === 'google'}
                    className="bg-red-600 text-white hover:bg-red-700"
                  >
                    {connecting === 'google' ? 'Connecting...' : 'Connect Google Calendar'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

