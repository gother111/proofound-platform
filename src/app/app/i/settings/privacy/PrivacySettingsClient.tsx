'use client';

import { useState, useEffect } from 'react';
import { IndividualFieldVisibilityControls } from '@/components/profile/IndividualFieldVisibilityControls';
import { PrivacyOverview } from '@/components/settings/PrivacyOverview';
import { DataBreakdown } from '@/components/privacy/DataBreakdown';
import { AuditLogTable } from '@/components/privacy/AuditLogTable';
import { DeleteAccountSection } from '@/components/privacy/DeleteAccountSection';
import { toast } from 'sonner';
import { AppSurface } from '@/components/ui/v2/AppSurface';

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
      <AppSurface>
        <div className="flex items-center justify-center">
          <div className="text-[#6B6760]">Loading privacy settings...</div>
        </div>
      </AppSurface>
    );
  }

  return (
    <AppSurface>
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-[#2D3330] mb-2">Privacy Settings</h1>
          <p className="text-[#6B6760]">Control who can see your profile information</p>
        </div>

        <div className="space-y-6">
          {/* Privacy Overview */}
          <PrivacyOverview userId="current" />

          {/* Data Breakdown */}
          <DataBreakdown />

          {/* Field Visibility Controls */}
          <IndividualFieldVisibilityControls
            userId="current"
            initialVisibility={initialVisibility || {}}
            onSave={handleSave}
          />

          {/* Audit Log */}
          <AuditLogTable />

          {/* Delete Account */}
          <DeleteAccountSection />
        </div>
      </div>
    </AppSurface>
  );
}
