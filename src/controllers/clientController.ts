import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { ClientStatus } from '@prisma/client';
import { logAudit, getIp } from '../services/auditService';
import { createPppoeClient, disableClient, enableClient, encryptPassword, fullDiagnoseClient, restartPppoeSession } from '../services/mikrotikService';
import { sendWhatsAppMessage } from '../services/wahaService';
import { sendEmail, suspensionTemplate, reactivationTemplate } from '../services/emailService';

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

// ── Helper: genera contraseña aleatoria legible (sin chars confusos) ──────────
function genPassword(len = 10): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ── Helper: PPPoE username desde cédula ───────────────────────────────────────
function toPppoeUsername(documentId: string): string {
  return `cli-${documentId.replace(/\D/g, '').slice(0, 15)}`;
}

export const createClient = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      createMikrotik = false,      // true = registrar en MikroTik automáticamente
      pppoeUsername:  rawUser,
      pppoePassword:  rawPass,
      routerProfile,
      ...rest
    } = req.body;

    let finalUser:      string | undefined;
    let finalPass:      string | undefined;     // plaintext usado en MikroTik
    let generatedPass:  string | undefined;     // devuelto una sola vez al admin
    let encryptedPass:  string | undefined;     // guardado en BD
    let mikrotikStatus: 'created' | 'warning' | 'skipped' = 'skipped';
    let mikrotikWarning: string | undefined;

    const wantMikrotik = createMikrotik || (rawUser && rawPass);

    if (wantMikrotik) {
      // Auto-generar username desde documentId si no vino explícito
      finalUser = (rawUser as string | undefined)?.trim() || toPppoeUsername(rest.documentId ?? '');
      // Auto-generar password si no vino
      if (rawPass) {
        finalPass = rawPass as string;
      } else {
        finalPass    = genPassword();
        generatedPass = finalPass;   // lo devolvemos al admin
      }

      const mtResult = await createPppoeClient({
        name:     finalUser,
        password: finalPass,
        profile:  (routerProfile as string | undefined) ?? process.env.MIKROTIK_DEFAULT_PROFILE ?? 'default',
      });

      if (mtResult.success) {
        encryptedPass  = mtResult.encryptedPassword;
        mikrotikStatus = 'created';
        console.log(`[MikroTik] ✓ PPPoE creado: ${finalUser}`);
      } else {
        mikrotikStatus  = 'warning';
        mikrotikWarning = mtResult.error ?? 'Error desconocido en MikroTik';
        console.warn(`[MikroTik] ⚠ ${mikrotikWarning}`);
      }
    }

    // ── Guardar en BD ─────────────────────────────────────────────────
    const client = await prisma.client.create({
      data: {
        ...rest,
        ...(finalUser     ? { pppoeUsername: finalUser }       : {}),
        ...(encryptedPass ? { pppoePassword: encryptedPass }   : {}),
        ...(routerProfile && finalUser ? { routerProfile: routerProfile as string } : {}),
      },
    });

    const actorId = (req as any).user?.id;
    if (actorId) logAudit(actorId, 'CREAR_CLIENTE', 'Client', client.id, client.name, getIp(req));

    res.status(201).json({
      ...client,
      mikrotikStatus,
      ...(mikrotikWarning ? { mikrotikWarning } : {}),
      // Credenciales generadas — mostrar UNA SOLA VEZ al admin
      ...(generatedPass ? { generatedPassword: generatedPass } : {}),
      ...(finalUser     ? { pppoeUsernameAssigned: finalUser } : {}),
    });
  } catch (err: any) {
    if (err.code === 'P2002') {
      res.status(409).json({ error: 'Ya existe un cliente con ese dato (cédula o contrato duplicado)' });
      return;
    }
    console.error('[createClient]', err);
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

    // ── Sincronizar con MikroTik si tiene usuario PPPoE ───────────────
    if (client.pppoeUsername) {
      if (newStatus === 'SUSPENDED') {
        const r = await disableClient(client.pppoeUsername);
        console.log(`[MikroTik] ${r.success ? '✓ Desactivado' : '⚠ Error desactivando'}: ${client.pppoeUsername}`);
      } else {
        const r = await enableClient(client.pppoeUsername);
        console.log(`[MikroTik] ${r.success ? '✓ Activado' : '⚠ Error activando'}: ${client.pppoeUsername}`);
      }
    }

    // ── Notificaciones al cliente (WhatsApp + Email) ──────────────────
    const firstName = client.name.split(' ')[0];
    if (newStatus === 'SUSPENDED') {
      const msgWA = `⚠️ Hola ${firstName}, tu servicio de internet *${client.plan}* ha sido *suspendido temporalmente* por falta de pago.\n\nPonte al día con tu pago para reactivarlo de inmediato. ¡Gracias!\n\n— *Nexory ISP*`;
      if (client.phone) sendWhatsAppMessage(client.phone, msgWA).catch(() => {});
      if (client.email) sendEmail(client.email, suspensionTemplate(client.name, client.plan, client.paymentDueDay)).catch(() => {});
      console.log(`[Notif] Aviso de suspensión enviado a ${client.name}`);
    } else {
      const msgWA = `✅ ¡Hola ${firstName}! Tu servicio de internet *${client.plan}* ha sido *reactivado exitosamente*.\n\nYa puedes navegar con normalidad. Si no conectas, reinicia tu router y espera 2 minutos.\n\n— *Nexory ISP*`;
      if (client.phone) sendWhatsAppMessage(client.phone, msgWA).catch(() => {});
      if (client.email) sendEmail(client.email, reactivationTemplate(client.name, client.plan)).catch(() => {});
      console.log(`[Notif] Aviso de reactivación enviado a ${client.name}`);
    }

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

export const diagnoseClientFull = async (req: Request, res: Response): Promise<void> => {
  try {
    const client = await prisma.client.findUnique({ where: { id: req.params.id } });
    if (!client) { res.status(404).json({ error: 'Cliente no encontrado' }); return; }

    if (!client.pppoeUsername) {
      res.json({
        success: true,
        hasPppoe: false,
        message:  'Este cliente no tiene usuario PPPoE configurado',
        data: null,
      });
      return;
    }

    const result = await fullDiagnoseClient(client.pppoeUsername);
    res.json({ ...result, hasPppoe: true, pppoeUsername: client.pppoeUsername });
  } catch (err) {
    console.error('[Diagnose]', err);
    res.status(500).json({ error: 'Error ejecutando diagnóstico' });
  }
};

export const restartClientSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const client = await prisma.client.findUnique({ where: { id: req.params.id } });
    if (!client) { res.status(404).json({ error: 'Cliente no encontrado' }); return; }

    if (!client.pppoeUsername) {
      res.status(400).json({ error: 'El cliente no tiene usuario PPPoE' });
      return;
    }

    const result = await restartPppoeSession(client.pppoeUsername);

    const actorId = (req as any).user?.id;
    if (actorId) logAudit(actorId, 'REINICIAR_SESION', 'Client', client.id, client.name, getIp(req));

    res.json({
      success:   result.success,
      wasOnline: result.wasOnline,
      message:   result.success
        ? result.wasOnline ? 'Sesión terminada — el equipo del cliente reconectará automáticamente' : 'El cliente ya estaba desconectado'
        : result.error ?? 'Error al reiniciar sesión',
    });
  } catch (err) {
    res.status(500).json({ error: 'Error reiniciando sesión' });
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
