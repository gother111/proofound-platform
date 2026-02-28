/**
 * Video Provider Selector Component
 *
 * Allows selection between Zoom and Google Meet
 * Shows connection status for each platform
 * Provides link to connect account if not authenticated
 */

'use client';

import { useState, useEffect } from 'react';
import { Video, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface VideoProviderSelectorProps {
  selectedProvider: 'zoom' | 'google_meet' | null;
  onSelectProvider: (provider: 'zoom' | 'google_meet') => void;
}

export function VideoProviderSelector({
  selectedProvider,
  onSelectProvider,
}: VideoProviderSelectorProps) {
  const [zoomConnected, setZoomConnected] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/integrations/video/status');
      if (response.ok) {
        const data = await response.json();
        setZoomConnected(data.zoom?.connected || false);
        setGoogleConnected(data.google?.connected || false);
      }
    } catch (error) {
      console.error('Failed to check video provider status:', error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleConnect = async (provider: 'zoom' | 'google_meet') => {
    // Open OAuth flow in popup
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    const connectPath =
      provider === 'google_meet'
        ? '/api/integrations/google/connect'
        : '/api/integrations/zoom/connect';

    const popup = window.open(
      connectPath,
      'oauth',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    if (!popup) {
      toast.error('Popup blocked. Allow popups to connect your video provider.');
      return;
    }

    // Listen for OAuth completion
    const checkPopup = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkPopup);
        checkConnectionStatus();
      }
    }, 500);
  };

  const providers = [
    {
      id: 'zoom' as const,
      name: 'Zoom',
      description: 'Industry-standard video conferencing',
      connected: zoomConnected,
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 6h6v6H4zm10 0h6v6h-6zM4 16h6v6H4zm10 0h6v6h-6z" />
        </svg>
      ),
    },
    {
      id: 'google_meet' as const,
      name: 'Google Meet',
      description: "Google's video conferencing solution",
      connected: googleConnected,
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15 10l5-3v10l-5-3v-4z" />
          <path d="M5 7h10v10H5z" />
        </svg>
      ),
    },
  ];

  if (isCheckingStatus) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-[#6B6760]">Checking video provider connections...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {providers.map((provider) => (
        <Card
          variant="bento"
          key={provider.id}
          className={`p-4 cursor-pointer transition-all ${
            selectedProvider === provider.id
              ? 'border-2 border-[#1C4D3A] bg-[#E8F5E1]'
              : 'border-2 border-[#E8E6DD] hover:border-[#1C4D3A]/30'
          }`}
          onClick={() => provider.connected && onSelectProvider(provider.id)}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div
                className={`flex-shrink-0 ${
                  selectedProvider === provider.id ? 'text-[#1C4D3A]' : 'text-[#6B6760]'
                }`}
              >
                {provider.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-[#2D3330]">{provider.name}</h4>
                  {provider.connected ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                  )}
                </div>
                <p className="text-sm text-[#6B6760] mb-2">{provider.description}</p>

                {!provider.connected && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConnect(provider.id);
                    }}
                    className="text-xs"
                  >
                    <ExternalLink className="w-3 h-3 mr-1.5" />
                    Connect {provider.name}
                  </Button>
                )}

                {provider.connected && (
                  <div className="flex items-center gap-1.5 text-xs text-green-700">
                    <CheckCircle className="w-3 h-3" />
                    <span>Connected</span>
                  </div>
                )}
              </div>
            </div>

            {selectedProvider === provider.id && (
              <div className="flex-shrink-0 ml-3">
                <div className="w-6 h-6 rounded-full bg-[#1C4D3A] flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              </div>
            )}
          </div>
        </Card>
      ))}

      {!zoomConnected && !googleConnected && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> You need to connect at least one video platform to schedule
            interviews. Click "Connect" above to authenticate.
          </p>
        </div>
      )}
    </div>
  );
}
