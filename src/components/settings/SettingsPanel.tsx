import type { ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SettingsPanelProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SettingsPanel({
  title,
  description,
  actions,
  children,
  className,
}: SettingsPanelProps) {
  return (
    <Card className={cn("border-proofound-stone/70 bg-white/90 shadow-sm dark:border-border dark:bg-background/90", className)}>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="font-['Crimson_Pro'] text-2xl text-proofound-charcoal dark:text-foreground">
            {title}
          </CardTitle>
          {description ? (
            <CardDescription className="max-w-2xl text-proofound-charcoal/70 dark:text-muted-foreground">
              {description}
            </CardDescription>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </CardHeader>
      <CardContent className="space-y-6 text-proofound-charcoal dark:text-foreground">
        {children}
      </CardContent>
    </Card>
  );
}


