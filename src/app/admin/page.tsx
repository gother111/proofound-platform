import { requirePlatformAdmin } from '@/lib/auth/admin';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const adminUser = await requirePlatformAdmin();

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#2D3330]">Admin Dashboard</h1>
        <p className="text-[#6B6760] mt-1">Platform analytics and management overview</p>
      </div>

      <AdminDashboard adminUser={adminUser} />
    </div>
  );
}
