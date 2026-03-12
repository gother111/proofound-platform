import { requirePlatformAdmin } from '@/lib/auth/admin';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, BadgeCheck, FileText } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  await requirePlatformAdmin();

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Internal Ops</h1>
        <p className="text-muted-foreground mt-1">
          Internal-only launch operations for verification review and dispute-support audit trails.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BadgeCheck className="h-5 w-5 text-proofound-forest" />
              Verification queue
            </CardTitle>
            <CardDescription>
              Review pending LinkedIn identity checks and keep trust corrections inside the locked
              MVP corridor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full justify-between">
              <Link href="/admin/verification">
                Open verification queue
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
              Review internal admin actions when disputes or trust incidents require traceability.
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
      </div>
    </div>
  );
}
