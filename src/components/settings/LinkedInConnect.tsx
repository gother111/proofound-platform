'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Linkedin, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface LinkedInConnectProps {
  onConnectionChange?: (connected: boolean) => void;
}

export function LinkedInConnect({ onConnectionChange }: LinkedInConnectProps) {
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const checkConnection = useCallback(async () => {
    try {
      const response = await fetch('/api/expertise/linkedin-status');
      if (response.ok) {
        const data = await response.json();
        setConnected(data.connected);
        onConnectionChange?.(data.connected);
      }
    } catch (error) {
      console.error('Failed to check LinkedIn connection:', error);
    } finally {
      setLoading(false);
    }
  }, [onConnectionChange]);

  useEffect(() => {
    checkConnection();

    // Listen for URL changes (after OAuth callback)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'linkedin_connected') {
      setConnected(true);
      toast.success('LinkedIn connected successfully!');
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (urlParams.get('error') && urlParams.toString().includes('linkedin')) {
      toast.error(`Failed to connect LinkedIn: ${urlParams.get('error')}`);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [checkConnection]);

  const handleConnect = () => {
    // Redirect to LinkedIn OAuth initiation endpoint
    window.location.href = '/api/auth/linkedin';
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const response = await fetch('/api/expertise/linkedin-disconnect', {
        method: 'POST',
      });

      if (response.ok) {
        setConnected(false);
        onConnectionChange?.(false);
        toast.success('LinkedIn disconnected successfully');
      } else {
        throw new Error('Failed to disconnect');
      }
    } catch (error) {
      console.error('Failed to disconnect LinkedIn:', error);
      toast.error('Failed to disconnect LinkedIn. Please try again.');
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-proofound-charcoal/70">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Checking connection...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#0A66C2] rounded-lg">
            <Linkedin className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-proofound-charcoal dark:text-foreground">LinkedIn</p>
            <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground">
              {connected ? 'Connected' : 'Not connected'}
            </p>
          </div>
        </div>

        {connected ? (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
            <Check className="h-3 w-3 mr-1" />
            Connected
          </Badge>
        ) : (
          <Badge variant="outline" className="text-proofound-charcoal/70">
            Disconnected
          </Badge>
        )}
      </div>

      <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground">
        {connected
          ? 'Your LinkedIn account is connected. You can import skills from your LinkedIn profile to your Expertise Atlas.'
          : 'Connect your LinkedIn account to import your professional skills automatically.'}
      </p>

      <div>
        {connected ? (
          <Button
            variant="outline"
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            {disconnecting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Disconnecting...
              </>
            ) : (
              'Disconnect LinkedIn'
            )}
          </Button>
        ) : (
          <Button
            onClick={handleConnect}
            className="bg-[#0A66C2] hover:bg-[#004182] text-white"
          >
            <Linkedin className="h-4 w-4 mr-2" />
            Connect LinkedIn
          </Button>
        )}
      </div>
    </div>
  );
}

