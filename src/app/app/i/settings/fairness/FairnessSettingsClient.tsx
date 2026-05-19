'use client';

import { useState } from 'react';
import { DemographicOptIn } from '@/components/settings/DemographicOptIn';
import { AppSurface } from '@/components/ui/v2/AppSurface';

export function FairnessSettingsClient() {
  const [initialData] = useState<any>({});

  const handleSave = async (data: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug('Demographic opt-in preference captured locally', data);
    }
    return Promise.resolve();
  };

  return (
    <AppSurface>
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-foreground mb-2">Fairness & Diversity</h1>
          <p className="text-muted-foreground">
            Help promote fair hiring practices by opting into demographic analytics
          </p>
        </div>

        <DemographicOptIn userId="current" initialData={initialData || {}} onSave={handleSave} />
      </div>
    </AppSurface>
  );
}
