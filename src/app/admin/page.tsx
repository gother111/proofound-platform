import { requirePlatformAdmin } from '@/lib/auth/admin';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { resolveGcpCvOcrSafeStatus } from '@/lib/expertise/gcp-cv-ocr-status';
import { getAdminLaunchHealthSummary } from '@/lib/launch/admin-health-summary';
import { ArrowRight, BadgeCheck, FileText, HeartPulse, ScanText } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  await requirePlatformAdmin();
  const [cvOcrStatus, launchHealth] = await Promise.all([
    resolveGcpCvOcrSafeStatus({ probeProvider: true }),
    getAdminLaunchHealthSummary(),
  ]);
  const launchHealthTone =
    launchHealth.status === 'ready'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
      : launchHealth.status === 'blocked'
        ? 'border-amber-200 bg-amber-50 text-amber-950'
        : 'border-slate-200 bg-slate-50 text-slate-700';

  return (
    <div className="mx-auto w-full max-w-[1600px]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Launch Operations</h1>
        <p className="text-muted-foreground mt-1">
          Restricted launch tools for verification review and dispute-support audit trails.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <HeartPulse className="h-5 w-5 text-proofound-forest" />
              Launch health
            </CardTitle>
            <CardDescription>
              Latest repo evidence for launch gates and unresolved external signoff.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Badge variant="outline" size="md" role="status" className={launchHealthTone}>
              {launchHealth.verdict}
            </Badge>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="rounded-md border border-proofound-stone/70 bg-japandi-bg p-2">
                <p className="font-semibold text-foreground">{launchHealth.counts.pass}</p>
                <p className="text-muted-foreground">Pass</p>
              </div>
              <div className="rounded-md border border-proofound-stone/70 bg-japandi-bg p-2">
                <p className="font-semibold text-foreground">{launchHealth.counts.fail}</p>
                <p className="text-muted-foreground">Fail</p>
              </div>
              <div className="rounded-md border border-proofound-stone/70 bg-japandi-bg p-2">
                <p className="font-semibold text-foreground">{launchHealth.counts.blocked}</p>
                <p className="text-muted-foreground">Blocked</p>
              </div>
              <div className="rounded-md border border-proofound-stone/70 bg-japandi-bg p-2">
                <p className="font-semibold text-foreground">{launchHealth.counts.unverified}</p>
                <p className="text-muted-foreground">Open</p>
              </div>
            </div>
            {launchHealth.externalPrerequisites.length > 0 ? (
              <p className="text-sm text-muted-foreground">
                Still needs {launchHealth.externalPrerequisites.length} external proof item
                {launchHealth.externalPrerequisites.length === 1 ? '' : 's'} before final signoff.
              </p>
            ) : launchHealth.status === 'unavailable' ? (
              <p className="text-sm text-muted-foreground">
                Launch evidence has not been generated in this environment.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No repo blockers are recorded in the latest checklist.
              </p>
            )}
            {launchHealth.generatedAt && (
              <p className="text-xs text-muted-foreground">
                Generated {new Date(launchHealth.generatedAt).toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BadgeCheck className="h-5 w-5 text-proofound-forest" />
              Operations queues
            </CardTitle>
            <CardDescription>
              Review the four narrow operations queues that support verification, privacy,
              corrections, and pilot follow-through inside the launch flow.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full justify-between">
              <Link href="/admin/verification">
                Open operations queues
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-proofound-forest" />
              Audit support
            </CardTitle>
            <CardDescription>
              Review restricted admin actions when disputes or trust incidents require traceability.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full justify-between">
              <Link href="/admin/audit">
                Open audit log
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ScanText className="h-5 w-5 text-proofound-forest" />
              CV OCR production
            </CardTitle>
            <CardDescription>
              Internal-only status for the production OCR provider path.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" size="md" role="status" className="capitalize">
              {cvOcrStatus.status}
            </Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
