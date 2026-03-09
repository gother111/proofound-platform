import { jsonError } from '@/lib/api/route-helpers';
import { db } from '@/db';
import { adminAuditLog } from '@/db/schema';
import { getAdminUser } from '@/lib/auth/admin';

const BREAK_GLASS_REASON_MIN_LENGTH = 12;

function getBreakGlassReason(request: Request) {
  const url = new URL(request.url);
  return (
    request.headers.get('x-break-glass-reason') ||
    request.headers.get('x-proofound-break-glass-reason') ||
    url.searchParams.get('reason') ||
    ''
  ).trim();
}

export async function requireBreakGlassPlatformAdminJson(
  request: Request,
  input: {
    action: string;
    targetType: string;
    targetId: string;
    metadata?: Record<string, unknown>;
  }
) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return jsonError('Unauthorized', 401);
  }

  if (adminUser.adminLevel !== 'platform_admin' && adminUser.adminLevel !== 'super_admin') {
    return jsonError('Forbidden', 403);
  }

  const reason = getBreakGlassReason(request);
  if (reason.length < BREAK_GLASS_REASON_MIN_LENGTH) {
    return jsonError(
      `Break-glass reason must be at least ${BREAK_GLASS_REASON_MIN_LENGTH} characters`,
      400
    );
  }

  const forwardedFor = request.headers.get('x-forwarded-for');
  const ipAddress = forwardedFor?.split(',')[0]?.trim() || null;
  const userAgent = request.headers.get('user-agent');

  await db.insert(adminAuditLog).values({
    adminId: adminUser.userId,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId as any,
    reason,
    ipAddress,
    userAgent,
    metadata: {
      breakGlass: true,
      ...input.metadata,
    },
  });

  return {
    adminUser,
    reason,
  };
}
