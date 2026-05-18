import { AppSurface } from '@/components/ui/v2/AppSurface';

export function PrivacySettingsLoadingShell({
  status = 'Preparing privacy controls...',
}: {
  status?: string;
}) {
  return (
    <AppSurface>
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-proofound-forest">
            Privacy
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-proofound-charcoal">
            Privacy settings
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Preparing visibility, data, activity, and account controls.
          </p>
          <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
            {status}
          </p>
        </div>
        <div className="space-y-2" aria-hidden="true">
          <div className="h-9 w-64 rounded bg-muted/60" />
          <div className="h-5 w-96 max-w-full rounded bg-muted/60" />
        </div>
        <div className="h-36 rounded-2xl bg-muted/60" aria-hidden="true" />
        <div className="h-48 rounded-2xl bg-muted/60" aria-hidden="true" />
        <div className="h-48 rounded-2xl bg-muted/60" aria-hidden="true" />
      </div>
    </AppSurface>
  );
}
