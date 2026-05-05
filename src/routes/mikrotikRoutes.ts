import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../config/database';
import {
  testConnection,
  createPppoeClient,
  disableClient,
  enableClient,
  listPppoeClients,
  listActiveSessions,
  getRouterMetrics,
  diagnoseClient,
  encryptPassword,
} from '../services/mikrotikService';

const router = Router();
router.use(authenticate);

// ─── GET /api/mikrotik/status — Probar conexión al router ─────────────────────
router.get('/status', async (_req: Request, res: Response) => {
  const result = await testConnection();
  if (!result.success) {
    res.status(503).json({ success: false, error: result.error });
    return;
  }
  res.json({ success: true, version: result.version });
});

// ─── GET /api/mikrotik/metrics — Métricas del router ─────────────────────────
router.get('/metrics', async (_req: Request, res: Response) => {
  const result = await getRouterMetrics();
  if (!result.success) {
    res.status(503).json({ success: false, error: result.error });
    return;
  }
  res.json({ success: true, data: result.data });
});

// ─── GET /api/mikrotik/clientes — Listar PPPoE secrets ───────────────────────
router.get('/clientes', async (_req: Request, res: Response) => {
  const result = await listPppoeClients();
  if (!result.success) {
    res.status(503).json({ success: false, error: result.error });
    return;
  }
  res.json({ success: true, data: result.data });
});

// ─── GET /api/mikrotik/clientes/activos — Sesiones activas ───────────────────
router.get('/clientes/activos', async (_req: Request, res: Response) => {
  const result = await listActiveSessions();
  if (!result.success) {
    res.status(503).json({ success: false, error: result.error });
    return;
  }
  res.json({ success: true, data: result.data });
});

// ─── GET /api/mikrotik/clientes/:username/diagnostico ─────────────────────────
router.get('/clientes/:username/diagnostico', async (req: Request, res: Response) => {
  const { username } = req.params;
  const diag = await diagnoseClient(username);
  res.json({ success: true, data: diag });
});

// ─── POST /api/mikrotik/clientes — Crear cliente PPPoE ───────────────────────
// Body: { name, password, profile?, clientId? }
// Si se pasa clientId, actualiza el cliente en Prisma con las credenciales encriptadas
router.post('/clientes', async (req: Request, res: Response) => {
  const { name, password, profile, clientId } = req.body as {
    name:      string;
    password:  string;
    profile?:  string;
    clientId?: string;
  };

  if (!name || !password) {
    res.status(400).json({ success: false, error: 'name y password son requeridos' });
    return;
  }

  const result = await createPppoeClient({ name, password, profile });
  if (!result.success) {
    res.status(422).json({ success: false, error: result.error });
    return;
  }

  // Persist encrypted password to DB client if clientId provided
  if (clientId && result.encryptedPassword) {
    await prisma.client.update({
      where: { id: clientId },
      data: {
        pppoeUsername: name,
        pppoePassword: result.encryptedPassword,
        routerProfile: profile ?? process.env.MIKROTIK_DEFAULT_PROFILE ?? 'perfil-clientes',
        routerIp:      process.env.MIKROTIK_HOST,
      },
    }).catch(() => {
      // Non-fatal: client was created in MikroTik, just couldn't update DB
      console.warn(`[MikroTik] No se pudo actualizar cliente DB id=${clientId}`);
    });
  }

  res.status(201).json({ success: true, message: `Cliente PPPoE '${name}' creado exitosamente` });
});

// ─── POST /api/mikrotik/clientes/:username/desactivar ─────────────────────────
router.post('/clientes/:username/desactivar', async (req: Request, res: Response) => {
  const { username } = req.params;

  const result = await disableClient(username);
  if (!result.success) {
    res.status(422).json({ success: false, error: result.error });
    return;
  }

  // Sync status in DB if client exists
  await prisma.client.updateMany({
    where: { pppoeUsername: username },
    data:  { status: 'SUSPENDED' },
  });

  res.json({ success: true, message: `Cliente '${username}' desactivado en MikroTik` });
});

// ─── POST /api/mikrotik/clientes/:username/activar ────────────────────────────
router.post('/clientes/:username/activar', async (req: Request, res: Response) => {
  const { username } = req.params;

  const result = await enableClient(username);
  if (!result.success) {
    res.status(422).json({ success: false, error: result.error });
    return;
  }

  // Sync status in DB if client exists
  await prisma.client.updateMany({
    where: { pppoeUsername: username },
    data:  { status: 'ACTIVE', lastConnection: new Date() },
  });

  res.json({ success: true, message: `Cliente '${username}' activado en MikroTik` });
});

// ─── POST /api/mikrotik/sync — Importar clientes de MikroTik a la BD ──────────
// Lee todos los PPPoE secrets del router y crea en Prisma los que no existen
router.post('/sync', async (_req: Request, res: Response) => {
  const result = await listPppoeClients();
  if (!result.success) {
    res.status(503).json({ success: false, error: result.error });
    return;
  }

  const secrets = result.data ?? [];
  const sessions = (await listActiveSessions()).data ?? [];

  // Mapa de sesiones activas por nombre para enriquecer datos
  const activeMap = new Map(sessions.map(s => [s.name, s]));

  let created = 0;
  let skipped = 0;

  for (const secret of secrets) {
    // Verificar si ya existe en DB por pppoeUsername
    const existing = await prisma.client.findFirst({
      where: { pppoeUsername: secret.name },
    });

    if (existing) { skipped++; continue; }

    const session = activeMap.get(secret.name);

    await prisma.client.create({
      data: {
        name:          secret.name,
        documentId:    `MK-${secret.name}`,   // placeholder único
        phone:         '0000000000',           // requerido en schema
        plan:          secret.profile ?? 'perfil-clientes',
        planSpeed:     10,
        monthlyFee:    0,
        status:        secret.disabled ? 'SUSPENDED' : 'ACTIVE',
        pppoeUsername: secret.name,
        routerIp:      process.env.MIKROTIK_HOST,
        routerProfile: secret.profile ?? 'perfil-clientes',
        ...(session ? { lastConnection: new Date() } : {}),
      },
    });
    created++;
  }

  res.json({
    success: true,
    message: `Sincronización completa: ${created} importados, ${skipped} ya existían`,
    created,
    skipped,
    total: secrets.length,
  });
});

export default router;
