import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { ClientStatus } from '@prisma/client';
import { logAudit, getIp } from '../services/auditService';

export const getClients = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search } = req.query;
    const clients = await prisma.client.findMany({
      where: {
        ...(status && status !== 'all' ? { status: status.toString().toUpperCase() as ClientStatus } : {}),
        ...(search ? {
          OR: [
            { name: { contains: search.toString(), mode: 'insensitive' } },
            { documentId: { contains: search.toString() } },
            { plan: { contains: search.toString(), mode: 'insensitive' } },
          ],
        } : {}),
      },
      include: { payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(clients);
  } catch (err) {
    console.error('[Clients] getClients:', err);
    res.status(500).json({ error: 'Error obteniendo clientes' });
  }
};

export const getClient = async (req: Request, res: Response): Promise<void> => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: {
        tickets: { orderBy: { createdAt: 'desc' }, take: 5 },
        payments: { orderBy: { createdAt: 'desc' }, take: 6 },
        communications: { orderBy: { sentAt: 'desc' }, take: 10 },
        cuts: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
    if (!client) { res.status(404).json({ error: 'Cliente no encontrado' }); return; }
    res.json(client);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo cliente' });
  }
};

export const createClient = async (req: Request, res: Response): Promise<void> => {
  try {
    const client = await prisma.client.create({ data: req.body });
    const actorId = (req as any).user?.id;
    if (actorId) {
      logAudit(actorId, 'CREAR_CLIENTE', 'Client', client.id, client.name, getIp(req));
    }
    res.status(201).json(client);
  } catch (err: any) {
    if (err.code === 'P2002') {
      res.status(409).json({ error: 'Error de duplicado en un campo único' });
      return;
    }
    res.status(500).json({ error: 'Error creando cliente' });
  }
};

export const updateClient = async (req: Request, res: Response): Promise<void> => {
  try {
    const client = await prisma.client.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(client);
  } catch (err: any) {
    if (err.code === 'P2025') { res.status(404).json({ error: 'Cliente no encontrado' }); return; }
    res.status(500).json({ error: 'Error actualizando cliente' });
  }
};

export const toggleClientStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const client = await prisma.client.findUnique({ where: { id: req.params.id } });
    if (!client) { res.status(404).json({ error: 'Cliente no encontrado' }); return; }

    const newStatus: ClientStatus = client.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const updated = await prisma.client.update({
      where: { id: req.params.id },
      data: {
        status: newStatus,
        ...(newStatus === 'ACTIVE' ? { lastConnection: new Date() } : {}),
      },
    });
    const actorId = (req as any).user?.id;
    if (actorId) {
      const action = newStatus === 'SUSPENDED' ? 'SUSPENDER_CLIENTE' : 'REACTIVAR_CLIENTE';
      logAudit(actorId, action, 'Client', client.id, client.name, getIp(req));
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Error actualizando estado' });
  }
};

export const getClientHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const comms = await prisma.communication.findMany({
      where: { clientId: req.params.id },
      orderBy: { sentAt: 'desc' },
    });
    res.json(comms);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo historial' });
  }
};
