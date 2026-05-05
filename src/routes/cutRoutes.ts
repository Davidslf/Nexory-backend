import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../config/database';
import { disableClient, enableClient } from '../services/mikrotikService';

const router = Router();
router.use(authenticate);

// ─── GET /api/cuts — Listar cortes ───────────────────────────────────────────
router.get('/', async (_req: Request, res: Response) => {
  const cuts = await prisma.cut.findMany({
    include: { client: { select: { id: true, name: true, plan: true, pppoeUsername: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(cuts);
});

// ─── POST /api/cuts — Crear corte programado ─────────────────────────────────
router.post('/', async (req: Request, res: Response) => {
  const cut = await prisma.cut.create({ data: req.body });
  res.status(201).json(cut);
});

// ─── PATCH /api/cuts/:id/execute — Ejecutar corte (real en MikroTik) ─────────
router.patch('/:id/execute', async (req: Request, res: Response) => {
  const cut = await prisma.cut.findUnique({
    where: { id: req.params.id },
    include: { client: true },
  });

  if (!cut) {
    res.status(404).json({ error: 'Corte no encontrado' });
    return;
  }

  let mikrotikResult: { success: boolean; error?: string } = { success: true };

  if (cut.client.pppoeUsername) {
    mikrotikResult = await disableClient(cut.client.pppoeUsername);
    if (!mikrotikResult.success) {
      res.status(422).json({
        error: `Error ejecutando corte en MikroTik: ${mikrotikResult.error}`,
      });
      return;
    }
  }

  // Update cut + client status atomically
  const [updatedCut] = await prisma.$transaction([
    prisma.cut.update({
      where: { id: cut.id },
      data:  { status: 'EXECUTED', executedAt: new Date() },
      include: { client: { select: { id: true, name: true, pppoeUsername: true } } },
    }),
    prisma.client.update({
      where: { id: cut.clientId },
      data:  { status: 'SUSPENDED' },
    }),
  ]);

  res.json({
    ...updatedCut,
    mikrotik: cut.client.pppoeUsername
      ? { executed: true }
      : { executed: false, reason: 'Cliente sin usuario PPPoE configurado' },
  });
});

// ─── PATCH /api/cuts/:id/restore — Restaurar servicio (real en MikroTik) ─────
router.patch('/:id/restore', async (req: Request, res: Response) => {
  const cut = await prisma.cut.findUnique({
    where: { id: req.params.id },
    include: { client: true },
  });

  if (!cut) {
    res.status(404).json({ error: 'Corte no encontrado' });
    return;
  }

  let mikrotikResult: { success: boolean; error?: string } = { success: true };

  if (cut.client.pppoeUsername) {
    mikrotikResult = await enableClient(cut.client.pppoeUsername);
    if (!mikrotikResult.success) {
      res.status(422).json({
        error: `Error restaurando servicio en MikroTik: ${mikrotikResult.error}`,
      });
      return;
    }
  }

  const [updatedCut] = await prisma.$transaction([
    prisma.cut.update({
      where: { id: cut.id },
      data:  { status: 'RESTORED', restoredAt: new Date() },
      include: { client: { select: { id: true, name: true, pppoeUsername: true } } },
    }),
    prisma.client.update({
      where: { id: cut.clientId },
      data:  { status: 'ACTIVE', lastConnection: new Date() },
    }),
  ]);

  res.json({
    ...updatedCut,
    mikrotik: cut.client.pppoeUsername
      ? { restored: true }
      : { restored: false, reason: 'Cliente sin usuario PPPoE configurado' },
  });
});

export default router;
