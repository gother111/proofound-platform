'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DraggableDashboard } from './DraggableDashboard';

interface CustomizableDashboardProps {
  userId: string;
  persona: 'individual' | 'org_member';
}

export function CustomizableDashboard({ userId: _userId, persona }: CustomizableDashboardProps) {
  if (persona !== 'individual') {
    return (
      <Card className="border-proofound-stone dark:border-border rounded-2xl">
        <CardHeader>
          <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground">
            Dashboard
          </CardTitle>
          <CardDescription className="text-proofound-charcoal/70 dark:text-muted-foreground">
            Dashboard customization is available from the organization home view.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground">
          Open your organization home page to manage organization dashboard widgets.
        </CardContent>
      </Card>
    );
  }

  return <DraggableDashboard />;
}
