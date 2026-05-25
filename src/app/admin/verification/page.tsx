import { AdminVerificationDashboard } from '@/components/admin/AdminVerificationDashboard';

export const dynamic = 'force-dynamic';

export default async function AdminVerificationPage() {
  return (
    <div className="mx-auto w-full max-w-[1600px]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Operations Queues</h1>
        <p className="text-muted-foreground mt-1">
          Review the narrow launch-critical queues for verification, privacy disputes, risky
          uploads, and pilot follow-through.
        </p>
      </div>

      <AdminVerificationDashboard />
    </div>
  );
}
