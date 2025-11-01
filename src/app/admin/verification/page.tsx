import { requirePlatformAdmin } from '@/lib/auth/admin';
import { AdminVerificationDashboard } from '@/components/admin/AdminVerificationDashboard';

export const dynamic = 'force-dynamic';

export default async function AdminVerificationPage() {
  const adminUser = await requirePlatformAdmin();

  return (
    <div className="min-h-screen bg-[#F7F6F1]">
      <div className="max-w-[1600px] mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#2D3330]">LinkedIn Verification Queue</h1>
          <p className="text-[#6B6760] mt-1">
            Review pending LinkedIn identity verifications · Logged in as{' '}
            <span className="font-medium">{adminUser.email}</span>
            <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
              {adminUser.platformRole === 'super_admin' ? 'Super Admin' : 'Platform Admin'}
            </span>
          </p>
        </div>

        <AdminVerificationDashboard />
      </div>
    </div>
  );
}

