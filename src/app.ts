import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/database';

// Routes
import authRoutes          from './routes/authRoutes';
import clientRoutes        from './routes/clientRoutes';
import dashboardRoutes     from './routes/dashboardRoutes';
import supportRoutes       from './routes/supportRoutes';
import cutRoutes           from './routes/cutRoutes';
import communicationRoutes from './routes/communicationRoutes';
import taskRoutes          from './routes/taskRoutes';
import mikrotikRoutes      from './routes/mikrotikRoutes';
import { scheduleMonthlyCutJob, runMonthlyCutJob } from './jobs/monthlyCutJob';
import { authenticate } from './middleware/auth';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5001', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', db: 'postgresql', timestamp: new Date().toISOString() });
});

app.use('/api/auth',           authRoutes);
app.use('/api/clients',        clientRoutes);
app.use('/api/dashboard',      dashboardRoutes);
app.use('/api/support',        supportRoutes);
app.use('/api/cuts',           cutRoutes);
app.use('/api/communications', communicationRoutes);
app.use('/api/tasks',          taskRoutes);
app.use('/api/mikrotik',       mikrotikRoutes);

// ── Dev/Admin endpoints ───────────────────────────────────────────────────────
import { prisma } from './config/database';

// Disparar corte mensual manualmente
app.post('/api/admin/run-cut-job', authenticate, async (_req, res) => {
  try {
    await runMonthlyCutJob();
    res.json({ ok: true, message: 'CutJob ejecutado manualmente' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Crear pago OVERDUE en un cliente (para probar cortes automáticos)
app.post('/api/admin/simulate-overdue/:clientId', authenticate, async (req, res) => {
  try {
    const client = await prisma.client.findUnique({ where: { id: req.params.clientId } });
    if (!client) { res.status(404).json({ error: 'Cliente no encontrado' }); return; }

    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const payment = await prisma.payment.create({
      data: {
        clientId: client.id,
        amount:   client.monthlyFee,
        month,
        status:   'OVERDUE',
      },
    });
    res.json({ ok: true, payment, message: `Pago OVERDUE creado para ${client.name}` });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

const start = async () => {
  await connectDB();
  scheduleMonthlyCutJob();
  app.listen(PORT, () => {
    console.log(`✅ NEXORY API  →  http://localhost:${PORT}`);
    console.log(`🗄️  Base de datos  →  PostgreSQL (Prisma)`);
    console.log(`🌍 Entorno        →  ${process.env.NODE_ENV || 'development'}`);
    console.log(`📡 MikroTik API  →  ${process.env.MIKROTIK_HOST || 'no configurado'}:${process.env.MIKROTIK_PORT || 8728}`);
  });
};

start();
export default app;
