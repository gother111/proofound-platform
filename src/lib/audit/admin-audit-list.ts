type AdminAuditListLog = {
  id: number;
  adminId: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  reason: string | null;
  createdAt: Date | string;
};

type AdminAuditListAdmin = {
  id: string;
  displayName: string | null;
  handle: string | null;
} | null;

export type AdminAuditListEntry = AdminAuditListLog & {
  admin: AdminAuditListAdmin;
};

export function toAdminAuditListEntry({
  log,
  admin,
}: {
  log: AdminAuditListLog;
  admin: AdminAuditListAdmin;
}): AdminAuditListEntry {
  return {
    id: log.id,
    adminId: log.adminId,
    action: log.action,
    targetType: log.targetType,
    targetId: log.targetId,
    reason: log.reason,
    createdAt: log.createdAt,
    admin,
  };
}
