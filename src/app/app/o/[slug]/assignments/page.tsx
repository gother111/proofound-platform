import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function OrganizationAssignmentsPage({ params }: { params: { slug: string } }) {
  const { slug } = params;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Assignments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Assignments help you connect with talent for specific roles or collaborations. Build
            assignments to unlock matching across Proofound.
          </p>
          <Button asChild>
            <Link href={`/app/o/${slug}/matching`}>Open assignment builder</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
