import { AdminVerificationDashboard } from '@/components/admin/AdminVerificationDashboard';

export const dynamic = 'force-dynamic';

export default async function AdminVerificationPage() {
  return (
    <div className="max-w-[1600px] mx-auto px-6 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Internal Ops Queues</h1>
        <p className="text-muted-foreground mt-1">
          Review the narrow launch-critical queues for verification, privacy disputes, risky
          uploads, and pilot follow-through.
        </p>
      </div>

      <AdminVerificationDashboard />
    </div>
  );
}
