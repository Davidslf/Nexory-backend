import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { sendBulkWhatsApp } from '../services/wahaService';
import { sendBulkEmails, communicationTemplate } from '../services/emailService';
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
      select: { id: true, name: true, phone: true, email: true },
    });

    if (clients.length === 0) {
      res.status(400).json({ error: 'No hay clientes destino' });
      return;
    }

    const useWhatsApp = !channels || channels.includes('whatsapp');
    const useEmail    = channels?.includes('email') ?? false;

    // Personalizar y enviar por WhatsApp
    const waTargets = useWhatsApp ? clients
      .filter(c => c.phone)
      .map(c => ({
        phone:    c.phone!,
        name:     c.name,
        clientId: c.id,
        message:  body.replace(/\{nombre\}/gi, c.name.split(' ')[0]),
      })) : [];

    // Personalizar y enviar por email
    const emailTargets = useEmail ? clients
      .filter(c => c.email)
      .map(c => ({
        email:    c.email!,
        name:     c.name,
        clientId: c.id,
        template: communicationTemplate(
          c.name,
          title,
          body.replace(/\{nombre\}/gi, c.name.split(' ')[0]),
        ),
      })) : [];

    const [waResults, emailResults] = await Promise.all([
      waTargets.length    ? sendBulkWhatsApp(waTargets)    : Promise.resolve([]),
      emailTargets.length ? sendBulkEmails(emailTargets)   : Promise.resolve([]),
    ]);

    // Combinar resultados (un cliente puede aparecer en ambos canales)
    const resultMap = new Map<string, 'sent' | 'failed'>();
    for (const r of [...waResults, ...emailResults]) {
      const cur = resultMap.get(r.clientId);
      // Si algún canal tuvo éxito → sent
      if (!cur || cur === 'failed') resultMap.set(r.clientId, r.status);
    }
    // Clientes que no tenían ni phone ni email → failed
    clients.forEach(c => { if (!resultMap.has(c.id)) resultMap.set(c.id, 'failed'); });

    const results = Array.from(resultMap.entries()).map(([clientId, status]) => ({ clientId, status }));

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
