import { ReactNode } from 'react';
import { AdminLayoutClient } from '@/components/admin/AdminLayoutClient';
import { requirePlatformAdmin } from '@/lib/auth/admin';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Verify admin access and get admin user info (Server Side)
  const adminUser = await requirePlatformAdmin();

  return (
    <AdminLayoutClient adminUser={adminUser}>
      {children}
    </AdminLayoutClient>
  );
}
