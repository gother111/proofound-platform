'use client';

import { useState, useEffect } from 'react';
import { IndividualFieldVisibilityControls } from '@/components/profile/IndividualFieldVisibilityControls';
import { PrivacyOverview } from '@/components/settings/PrivacyOverview';
import { toast } from 'sonner';

export function PrivacySettingsClient() {
  const [initialVisibility, setInitialVisibility] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch existing visibility settings
    async function fetchVisibility() {
      try {
        const response = await fetch('/api/profile/visibility');
        if (response.ok) {
          const data = await response.json();
          setInitialVisibility(data);
        }
      } catch (error) {
        console.error('Failed to fetch visibility settings:', error);
        toast.error('Failed to load privacy settings');
      } finally {
        setLoading(false);
      }
    }

    fetchVisibility();
  }, []);

  const handleSave = async (visibility: any) => {
    try {
      const response = await fetch('/api/profile/visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(visibility),
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      return Promise.resolve();
    } catch (error) {
      console.error('Failed to save visibility settings:', error);
      return Promise.reject(error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F6F1] flex items-center justify-center">
        <div className="text-[#6B6760]">Loading privacy settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F6F1]">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-[#2D3330] mb-2">
            Privacy Settings
          </h1>
          <p className="text-[#6B6760]">
            Control who can see your profile information
          </p>
        </div>

        <div className="space-y-6">
          {/* Privacy Overview */}
          <PrivacyOverview />

          {/* Field Visibility Controls */}
          <IndividualFieldVisibilityControls
            userId="current"
            initialVisibility={initialVisibility || {}}
            onSave={handleSave}
          />
        </div>
      </div>
    </div>
  );
}

