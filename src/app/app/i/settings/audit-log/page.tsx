'use client';

import { AuditLogTable } from '@/components/privacy/AuditLogTable';
import { AppSurface } from '@/components/ui/v2/AppSurface';

export default function AuditLogPage() {
  return (
    <AppSurface>
      <div className="mx-auto w-full min-w-0 max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Account history</h1>
          <p className="text-muted-foreground">
            Review recent proof, privacy, verification, and account activity in one place.
          </p>
        </div>

        <AuditLogTable title="Recent activity" />
      </div>
    </AppSurface>
  );
}
