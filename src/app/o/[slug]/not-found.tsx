import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Building2 } from 'lucide-react';

export default function OrgNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-100 px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center mb-4">
            <Building2 className="w-6 h-6 text-primary-500" />
          </div>
          <CardTitle>Organization not found</CardTitle>
          <CardDescription>
            This organization doesn&apos;t exist or you don&apos;t have access to it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/i/home">Go to your profile</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
