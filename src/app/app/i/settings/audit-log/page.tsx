'use client';

import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { AppSurface } from '@/components/ui/v2/AppSurface';

export default function AuditLogPage() {
  return (
    <AppSurface>
      <div className="container mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Account history</h1>
          <p className="text-muted-foreground">
            Individual MVP audit views focus on proof, privacy, verification, and account actions.
          </p>
        </div>

        <Card>
          <CardContent className="flex min-h-[300px] items-center justify-center">
            <div className="max-w-md space-y-2 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="font-medium text-foreground">Purpose edit history is archived</p>
              <p className="text-sm text-muted-foreground">
                Mission, vision, values, and causes are not active individual MVP fields. Legacy
                private data can remain in owner exports, but it is not exposed as an audit-log
                filter or active profile surface.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppSurface>
  );
}
