'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface VideoProviderSelectorProps {
  selectedProvider: 'google_meet' | null;
  onSelectProvider: (provider: 'google_meet') => void;
}

export function VideoProviderSelector({
  selectedProvider,
  onSelectProvider,
}: VideoProviderSelectorProps) {
  const [googleConnected, setGoogleConnected] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/integrations/video/status');
      if (!response.ok) return;

      const data = await response.json();
      setGoogleConnected(data.google?.connected || false);
    } catch (error) {
      console.error('Failed to check video provider status:', error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleConnect = async () => {
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const popup = window.open(
      '/api/integrations/google/connect',
      'oauth',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    if (!popup) {
      toast.error('Popup blocked. Allow popups to connect your video provider.');
      return;
    }

    const checkPopup = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkPopup);
        checkConnectionStatus();
      }
    }, 500);
  };

  if (isCheckingStatus) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">Checking video provider connections...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Card
        variant="bento"
        className={`p-4 cursor-pointer transition-all ${
          selectedProvider === 'google_meet'
            ? 'border-2 border-proofound-forest bg-proofound-success-tint'
            : 'border-2 border-proofound-stone hover:border-proofound-forest/30'
        }`}
        onClick={() => googleConnected && onSelectProvider('google_meet')}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div
              className={`flex-shrink-0 ${
                selectedProvider === 'google_meet'
                  ? 'text-proofound-forest'
                  : 'text-muted-foreground'
              }`}
            >
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15 10l5-3v10l-5-3v-4z" />
                <path d="M5 7h10v10H5z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-foreground">Google Meet</h4>
                {googleConnected ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Connect Google Meet to generate interview links automatically.
              </p>

              {!googleConnected ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleConnect();
                  }}
                  className="text-xs"
                >
                  <ExternalLink className="w-3 h-3 mr-1.5" />
                  Connect Google Meet
                </Button>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-green-700">
                  <CheckCircle className="w-3 h-3" />
                  <span>Connected</span>
                </div>
              )}
            </div>
          </div>

          {selectedProvider === 'google_meet' ? (
            <div className="flex-shrink-0 ml-3">
              <div className="w-6 h-6 rounded-full bg-proofound-forest flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            </div>
          ) : null}
        </div>
      </Card>

      {!googleConnected ? (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> Connect Google Meet to auto-generate links, or schedule with a
            manual meeting link.
          </p>
        </div>
      ) : null}
    </div>
  );
}
