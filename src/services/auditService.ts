import { prisma } from '../config/database';

export async function logAudit(
  userId: string,
  action: string,
  entity: string,
  entityId?: string,
  details?: string,
  ip?: string,
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: { userId, action, entity, entityId, details, ip },
    });
  } catch (err) {
    console.error('[Audit] Failed to write audit log:', err);
  }
}

export function getIp(req: { headers: Record<string, string | string[] | undefined>; socket: { remoteAddress?: string } }): string {
  return (
    (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    'unknown'
  );
}
