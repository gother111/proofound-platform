import { AuditLogTable } from '@/components/admin/audit/AuditLogTable';

export const dynamic = 'force-dynamic';

export default async function AdminAuditPage() {
  return (
    <div className="mx-auto w-full max-w-[1600px]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Audit Logs</h1>
        <p className="text-muted-foreground mt-1">
          Review administrative actions for security and compliance.
        </p>
      </div>
      <AuditLogTable />
    </div>
  );
}
