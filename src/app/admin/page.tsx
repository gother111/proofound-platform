import { requirePlatformAdmin } from '@/lib/auth/admin';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { resolveGcpCvOcrSafeStatus } from '@/lib/expertise/gcp-cv-ocr-status';
import { ArrowRight, BadgeCheck, FileText, ScanText } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  await requirePlatformAdmin();
  const cvOcrStatus = await resolveGcpCvOcrSafeStatus({ probeProvider: true });

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Launch Operations</h1>
        <p className="text-muted-foreground mt-1">
          Restricted launch tools for verification review and dispute-support audit trails.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BadgeCheck className="h-5 w-5 text-proofound-forest" />
              Operations queues
            </CardTitle>
            <CardDescription>
              Review the four narrow operations queues that support verification, privacy,
              corrections, and pilot follow-through inside the launch corridor.
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
              CV OCR sandbox
            </CardTitle>
            <CardDescription>
              Internal-only status for the temporary synthetic OCR smoke path.
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
