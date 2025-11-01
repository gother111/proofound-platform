import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F6F1]">
      <div className="max-w-md w-full mx-auto px-4 text-center">
        <div className="mb-6 flex justify-center">
          <div className="p-4 bg-red-100 rounded-full">
            <ShieldAlert className="h-12 w-12 text-red-600" />
          </div>
        </div>

        <h1 className="text-4xl font-bold text-[#2D3330] mb-4">403</h1>
        <h2 className="text-2xl font-semibold text-[#2D3330] mb-4">Access Forbidden</h2>

        <p className="text-[#6B6760] mb-8">
          You don&apos;t have permission to access this page. This area is restricted to authorized
          personnel only.
        </p>

        <div className="space-y-3">
          <Link href="/app/i/home">
            <Button className="w-full">Go to Dashboard</Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full">
              Go to Home
            </Button>
          </Link>
        </div>

        <p className="mt-8 text-sm text-[#9B9891]">
          If you believe you should have access to this page, please contact your administrator.
        </p>
      </div>
    </div>
  );
}
