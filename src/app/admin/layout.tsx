import { ReactNode } from 'react';
import { requirePlatformAdmin } from '@/lib/auth/admin';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Verify admin access and get admin user info
  const adminUser = await requirePlatformAdmin();

  return (
    <div className="min-h-screen bg-[#F7F6F1]">
      {/* Admin Sidebar */}
      <AdminSidebar adminEmail={adminUser.email} adminRole={adminUser.platformRole || undefined} />

      {/* Main Content */}
      <main className="pl-64 transition-all duration-300">
        <div className="min-h-screen">{children}</div>
      </main>
    </div>
  );
}
