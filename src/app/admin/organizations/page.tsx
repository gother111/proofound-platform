import { requirePlatformAdmin } from '@/lib/auth/admin';
import { OrganizationsTable } from '@/components/admin/organizations/OrganizationsTable';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminOrgsPage() {
  await requirePlatformAdmin();

  return (
    <div className="min-h-screen bg-[#F7F6F1]">
      <div className="max-w-[1600px] mx-auto px-4 py-6">
        <div className="mb-6">
          <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground flex items-center mb-2">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-[#2D3330]">Organization Management</h1>
          <p className="text-[#6B6760] mt-1">
            View and manage organizations and their approval status.
          </p>
        </div>
        <OrganizationsTable />
      </div>
    </div>
  );
}

