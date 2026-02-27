'use client';

import { useState, useEffect } from 'react';
import { DemographicOptIn } from '@/components/settings/DemographicOptIn';
import { toast } from 'sonner';
import { AppSurface } from '@/components/ui/v2/AppSurface';

export function FairnessSettingsClient() {
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch existing demographic opt-in data
    async function fetchOptIn() {
      try {
        const response = await fetch('/api/analytics/demographic-opt-in');
        if (response.ok) {
          const data = await response.json();
          setInitialData(data);
        }
      } catch (error) {
        console.error('Failed to fetch demographic opt-in:', error);
        toast.error('Failed to load fairness settings');
      } finally {
        setLoading(false);
      }
    }

    fetchOptIn();
  }, []);

  const handleSave = async (data: any) => {
    try {
      const response = await fetch('/api/analytics/demographic-opt-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      return Promise.resolve();
    } catch (error) {
      console.error('Failed to save demographic opt-in:', error);
      return Promise.reject(error);
    }
  };

  if (loading) {
    return (
      <AppSurface>
        <div className="flex items-center justify-center">
          <div className="text-[#6B6760]">Loading fairness settings...</div>
        </div>
      </AppSurface>
    );
  }

  return (
    <AppSurface>
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-[#2D3330] mb-2">Fairness & Diversity</h1>
          <p className="text-[#6B6760]">
            Help promote fair hiring practices by opting into demographic analytics
          </p>
        </div>

        <DemographicOptIn userId="current" initialData={initialData || {}} onSave={handleSave} />
      </div>
    </AppSurface>
  );
}
