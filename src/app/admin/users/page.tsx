import { UsersTable } from '@/components/admin/users/UsersTable';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  return (
    <div className="max-w-[1600px] mx-auto px-6 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">User Management</h1>
        <p className="text-muted-foreground mt-1">
          View and manage all registered users on the platform.
        </p>
      </div>
      <UsersTable />
    </div>
  );
}
