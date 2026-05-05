import { Request, Response } from 'express';
import { cutLogs, clients, newId } from '../mock/store';

export const getLogs = async (req: Request, res: Response): Promise<void> => {
  const { year, month } = req.query as Record<string, string>;
  let result = [...cutLogs];
  if (year)  result = result.filter(l => l.year  === Number(year));
  if (month) result = result.filter(l => l.month === Number(month));
  // Enrich with client/router names
  const enriched = result.map(l => ({
    ...l,
    clientId: { _id: l.clientId, name: l.clientName },
    routerId: { _id: l.routerId, name: l.routerName },
  }));
  res.json({ success: true, data: enriched, meta: { total: enriched.length } });
};

export const getMonthlySummary = async (req: Request, res: Response): Promise<void> => {
  const { year, month } = req.params as Record<string, string>;
  const logs = cutLogs.filter(l => l.year === Number(year) && l.month === Number(month));
  res.json({
    success: true,
    data: {
      year: Number(year), month: Number(month),
      suspended:   logs.filter(l => l.action === 'suspended').length,
      reconnected: logs.filter(l => l.action === 'reconnected').length,
      attempted:   logs.filter(l => l.action === 'attempted').length,
      failed:      logs.filter(l => l.action === 'attempted' && l.error).length,
    },
  });
};

export const triggerManualJob = async (_req: Request, res: Response): Promise<void> => {
  const overdue = clients.filter(c => c.status === 'active' && c.paymentStatus === 'overdue');
  const now = new Date();
  for (const client of overdue) {
    client.status = 'suspended';
    cutLogs.push({
      _id: newId(), clientId: client._id, clientName: client.name,
      routerId: 'router01', routerName: 'Router Principal',
      action: 'suspended', reason: 'Corte manual ejecutado por operador',
      year: now.getFullYear(), month: now.getMonth() + 1,
      createdAt: now.toISOString(),
    });
  }
  res.json({ success: true, message: `Corte ejecutado: ${overdue.length} cliente(s) suspendido(s)` });
};
