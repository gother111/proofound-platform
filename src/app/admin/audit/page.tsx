import { AuditLogTable } from '@/components/admin/audit/AuditLogTable';

export const dynamic = 'force-dynamic';

export default async function AdminAuditPage() {
  return (
    <div className="max-w-[1600px] mx-auto px-6 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Audit Logs</h1>
        <p className="text-muted-foreground mt-1">
          Review administrative actions for security and compliance.
        </p>
      </div>
      <AuditLogTable />
    </div>
  );
}
