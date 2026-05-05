import { Request, Response } from 'express';
import { prisma } from '../config/database';

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const [totalClients, activeClients, suspendedClients, openTickets, pendingTasks, overduePayments] =
      await Promise.all([
        prisma.client.count(),
        prisma.client.count({ where: { status: 'ACTIVE' } }),
        prisma.client.count({ where: { status: 'SUSPENDED' } }),
        prisma.ticket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
        prisma.task.count({ where: { status: 'PENDING' } }),
        prisma.payment.count({ where: { status: 'OVERDUE' } }),
      ]);

    // Métricas de red desde clientes activos
    const activeWithMetrics = await prisma.client.findMany({
      where: { status: 'ACTIVE', latency: { not: null } },
      select: { latency: true, uptime: true },
    });

    const avgLatency = activeWithMetrics.length
      ? Math.round(activeWithMetrics.reduce((s, c) => s + (c.latency ?? 0), 0) / activeWithMetrics.length)
      : 0;

    const avgUptime = activeWithMetrics.length
      ? Math.round((activeWithMetrics.reduce((s, c) => s + (c.uptime ?? 0), 0) / activeWithMetrics.length) * 100) / 100
      : 0;

    res.json({
      totalClients,
      onlineClients: activeClients,
      suspendedClients,
      overdueClients: overduePayments,
      openTickets,
      pendingTasks,
      averageLatency: avgLatency,
      networkUptime: avgUptime,
      clientGrowth: 0,
    });
  } catch (err) {
    console.error('[Dashboard] getStats:', err);
    res.status(500).json({ error: 'Error obteniendo estadísticas' });
  }
};

const ACTION_LABELS: Record<string, { label: string; severity: string }> = {
  LOGIN:               { label: 'Inicio de sesión',      severity: 'info' },
  CREAR_CLIENTE:       { label: 'Cliente creado',         severity: 'success' },
  SUSPENDER_CLIENTE:   { label: 'Cliente suspendido',     severity: 'warning' },
  REACTIVAR_CLIENTE:   { label: 'Cliente reactivado',     severity: 'success' },
  CERRAR_TICKET:       { label: 'Ticket cerrado',         severity: 'success' },
  AGREGAR_NOTA_TICKET: { label: 'Nota en ticket',         severity: 'info' },
  ENVIAR_COMUNICACION: { label: 'Comunicación enviada',   severity: 'info' },
  COMPLETAR_TAREA:     { label: 'Tarea completada',       severity: 'success' },
};

export const getActivities = async (req: Request, res: Response): Promise<void> => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        user: { select: { name: true, username: true } },
      },
    });

    const activities = logs.map(log => {
      const meta = ACTION_LABELS[log.action] ?? { label: log.action, severity: 'info' };
      return {
        id: log.id,
        type: log.action,
        description: meta.label,
        userName: log.user.name || log.user.username,
        clientName: log.entity === 'Client' ? log.details : undefined,
        details: log.details,
        entity: log.entity,
        severity: meta.severity,
        timestamp: log.createdAt,
        ip: log.ip,
      };
    });

    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo actividades' });
  }
};
