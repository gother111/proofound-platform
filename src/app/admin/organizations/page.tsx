import { OrganizationsTable } from '@/components/admin/organizations/OrganizationsTable';

export const dynamic = 'force-dynamic';

export default async function AdminOrgsPage() {
  return (
    <div className="max-w-[1600px] mx-auto px-6 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Organization Management</h1>
        <p className="text-muted-foreground mt-1">
          View and manage organizations and their approval status.
        </p>
      </div>
      <OrganizationsTable />
    </div>
  );
}
