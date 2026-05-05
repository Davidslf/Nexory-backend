import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { TicketStatus, Priority } from '@prisma/client';
import { logAudit, getIp } from '../services/auditService';

export const getTickets = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, priority, clientId } = req.query;
    const tickets = await prisma.ticket.findMany({
      where: {
        ...(status ? { status: status.toString().toUpperCase() as TicketStatus } : {}),
        ...(priority ? { priority: priority.toString().toUpperCase() as Priority } : {}),
        ...(clientId ? { clientId: clientId.toString() } : {}),
      },
      include: {
        client: { select: { id: true, name: true, phone: true, plan: true } },
        notes: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo tickets' });
  }
};

export const createTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const ticket = await prisma.ticket.create({
      data: req.body,
      include: { client: { select: { id: true, name: true } } },
    });
    res.status(201).json(ticket);
  } catch (err) {
    res.status(500).json({ error: 'Error creando ticket' });
  }
};

export const updateTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const ticket = await prisma.ticket.update({
      where: { id: req.params.id },
      data: req.body,
      include: { client: { select: { id: true, name: true } } },
    });
    res.json(ticket);
  } catch (err: any) {
    if (err.code === 'P2025') { res.status(404).json({ error: 'Ticket no encontrado' }); return; }
    res.status(500).json({ error: 'Error actualizando ticket' });
  }
};

export const closeTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const { resolution } = req.body;
    const ticket = await prisma.ticket.update({
      where: { id: req.params.id },
      data: { status: 'RESOLVED', resolvedAt: new Date(), resolution },
      include: { client: { select: { name: true } } },
    });
    const actorId = (req as any).user?.id;
    if (actorId) {
      logAudit(actorId, 'CERRAR_TICKET', 'Ticket', ticket.id, (ticket as any).client?.name, getIp(req));
    }
    res.json(ticket);
  } catch (err: any) {
    if (err.code === 'P2025') { res.status(404).json({ error: 'Ticket no encontrado' }); return; }
    res.status(500).json({ error: 'Error cerrando ticket' });
  }
};

export const addTicketNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const { content, author } = req.body;
    const note = await prisma.ticketNote.create({
      data: { ticketId: req.params.id, content, author },
    });
    const actorId = (req as any).user?.id;
    if (actorId) {
      logAudit(actorId, 'AGREGAR_NOTA_TICKET', 'Ticket', req.params.id, undefined, getIp(req));
    }
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ error: 'Error agregando nota' });
  }
};
