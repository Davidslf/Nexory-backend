import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { sendBulkWhatsApp } from '../services/wahaService';
import { CommType } from '@prisma/client';
import { logAudit, getIp } from '../services/auditService';

export const getCommunications = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clientId } = req.query;
    const comms = await prisma.communication.findMany({
      where: clientId ? { clientId: clientId.toString() } : {},
      include: { client: { select: { id: true, name: true } } },
      orderBy: { sentAt: 'desc' },
    });
    res.json(comms);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo comunicaciones' });
  }
};

export const sendCommunication = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, title, body, clientIds, channels } = req.body as {
      type: CommType;
      title: string;
      body: string;
      clientIds: string[] | 'all';
      channels?: string[];
    };

    // Obtener clientes destino
    const clients = await prisma.client.findMany({
      where: clientIds === 'all' ? { status: 'ACTIVE' } : { id: { in: clientIds } },
      select: { id: true, name: true, phone: true },
    });

    if (clients.length === 0) {
      res.status(400).json({ error: 'No hay clientes destino' });
      return;
    }

    // Personalizar y enviar
    const targets = clients.map(c => {
      const firstName = c.name.split(' ')[0];
      return {
        phone: c.phone,
        name: c.name,
        clientId: c.id,
        message: body.replace(/\{nombre\}/gi, firstName),
      };
    });

    const results = await sendBulkWhatsApp(targets);

    // Guardar historial por cliente
    const sent = results.filter(r => r.status === 'sent');
    const failed = results.filter(r => r.status === 'failed');

    const sentByName: string = (req as any).user?.name ?? 'Sistema';
    const sentChannels: string[] = channels?.length ? channels : ['whatsapp'];

    await prisma.communication.createMany({
      data: clients.map(c => ({
        clientId: c.id,
        type,
        title,
        body: body.replace(/\{nombre\}/gi, c.name.split(' ')[0]),
        status: results.find(r => r.clientId === c.id)?.status === 'sent' ? 'DELIVERED' : 'FAILED',
        sentByName,
        channels: sentChannels,
      })),
    });

    const actorId = (req as any).user?.id;
    if (actorId) {
      const dest = clientIds === 'all' ? 'todos los clientes activos' : `${clients.length} clientes`;
      logAudit(actorId, 'ENVIAR_COMUNICACION', 'Communication', undefined, `${title} → ${dest}`, getIp(req));
    }

    res.json({
      sent: sent.length,
      failed: failed.length,
      total: clients.length,
    });
  } catch (err) {
    console.error('[Comms] sendCommunication:', err);
    res.status(500).json({ error: 'Error enviando comunicación' });
  }
};
