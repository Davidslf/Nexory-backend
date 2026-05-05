/**
 * Seed script — run once to populate initial data:
 *   npx tsx src/scripts/seed.ts
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { encrypt } from '../services/cryptoService';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nexory';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('🍃 Conectado a MongoDB');

  // Lazy imports after connection
  const User         = (await import('../models/User')).default;
  const Client       = (await import('../models/Client')).default;
  const RouterModel  = (await import('../models/Router')).default;
  const Notification = (await import('../models/Notification')).default;

  // ─── Clear existing data ────────────────────────────────────────
  await Promise.all([
    User.deleteMany({}),
    Client.deleteMany({}),
    RouterModel.deleteMany({}),
    Notification.deleteMany({}),
  ]);
  console.log('🗑  Colecciones limpiadas');

  // ─── Users ──────────────────────────────────────────────────────
  await User.create([
    { name: 'Administrador', email: 'admin@nexory.com',    password: 'admin123',    role: 'admin'    },
    { name: 'Operador',      email: 'operator@nexory.com', password: 'operator123', role: 'operator' },
  ]);
  console.log('👤 Usuarios creados');

  // ─── Routers ────────────────────────────────────────────────────
  await RouterModel.create([
    { name: 'Router Principal', ip: '192.168.1.1',  location: 'Sede Central',   routerModel: 'MikroTik RB4011', firmware: '6.49.8', status: 'online',  cpuUsage: 45, memoryUsage: 62, bandwidthIn: 850, bandwidthOut: 320, uptime: 99.8, connectedClients: 48, lastSeen: new Date() },
    { name: 'Router Norte',     ip: '192.168.2.1',  location: 'Zona Norte',     routerModel: 'MikroTik hEX',   firmware: '7.1.5',  status: 'online',  cpuUsage: 38, memoryUsage: 55, bandwidthIn: 620, bandwidthOut: 210, uptime: 99.2, connectedClients: 35, lastSeen: new Date() },
    { name: 'Router Sur',       ip: '192.168.3.1',  location: 'Zona Sur',       routerModel: 'MikroTik RB750', firmware: '6.48.6', status: 'offline', cpuUsage: 0,  memoryUsage: 0,  bandwidthIn: 0,   bandwidthOut: 0,   uptime: 0,    connectedClients: 0,  lastSeen: new Date(Date.now() - 3600000) },
    { name: 'Router Centro',    ip: '192.168.4.1',  location: 'Centro',         routerModel: 'MikroTik CCR',   firmware: '7.2.3',  status: 'online',  cpuUsage: 71, memoryUsage: 78, bandwidthIn: 1200,bandwidthOut: 450, uptime: 98.5, connectedClients: 82, lastSeen: new Date() },
    { name: 'Router Oriente',   ip: '192.168.5.1',  location: 'Zona Oriente',   routerModel: 'MikroTik RB3011',firmware: '6.49.7', status: 'maintenance', cpuUsage: 5, memoryUsage: 30, bandwidthIn: 0, bandwidthOut: 0, uptime: 95, connectedClients: 0, lastSeen: new Date(Date.now() - 1800000) },
  ]);
  console.log('🔌 Routers creados');

  // ─── Clients ────────────────────────────────────────────────────
  const now = new Date();
  const clients = [
    { billingId: 'CLT-001', name: 'Juan Pérez',       email: 'juan@email.com',   phone: '+573001234567', plan: 'Fibra 200MB',  monthlyAmount: 45000, status: 'suspended', paymentStatus: 'overdue', cutDate: new Date(now.getFullYear(), now.getMonth(), 17), tags: ['VIP', 'RESIDENCIAL'] },
    { billingId: 'CLT-002', name: 'María González',   email: 'maria@email.com',  phone: '+573002345678', plan: 'Fibra 500MB',  monthlyAmount: 75000, status: 'suspended', paymentStatus: 'overdue', cutDate: new Date(now.getFullYear(), now.getMonth(), 11), tags: ['EMPRESARIAL', 'PRIORITARIO'] },
    { billingId: 'CLT-003', name: 'Carlos Rodríguez', email: 'carlos@email.com', phone: '+573003456789', plan: 'Fibra 100MB',  monthlyAmount: 35000, status: 'active',    paymentStatus: 'overdue', cutDate: new Date(now.getFullYear(), now.getMonth(), 4),  tags: ['RESIDENCIAL'] },
    { billingId: 'CLT-004', name: 'Ana Martínez',     email: 'ana@email.com',    phone: '+573004567890', plan: 'Fibra 200MB',  monthlyAmount: 45000, status: 'active',    paymentStatus: 'overdue', cutDate: new Date(now.getFullYear(), now.getMonth(), 21), tags: ['RESIDENCIAL'] },
    { billingId: 'CLT-005', name: 'Luis Fernández',   email: 'luis@email.com',   phone: '+573005678901', plan: 'Fibra 1GB',    monthlyAmount: 95000, status: 'active',    paymentStatus: 'overdue', cutDate: new Date(now.getFullYear(), now.getMonth(), 10), tags: ['VIP', 'EMPRESARIAL', 'PRIORITARIO'] },
    { billingId: 'CLT-006', name: 'Sofia Torres',     email: 'sofia@email.com',  phone: '+573006789012', plan: 'Fibra 100MB',  monthlyAmount: 35000, status: 'active',    paymentStatus: 'paid',    cutDate: new Date(now.getFullYear(), now.getMonth() + 1, 28), lastPaymentAt: new Date(), tags: ['RESIDENCIAL'] },
    { billingId: 'CLT-007', name: 'Miguel López',     email: 'miguel@email.com', phone: '+573007890123', plan: 'Fibra 200MB',  monthlyAmount: 45000, status: 'active',    paymentStatus: 'paid',    cutDate: new Date(now.getFullYear(), now.getMonth() + 1, 15), lastPaymentAt: new Date(), tags: ['RESIDENCIAL'] },
    { billingId: 'CLT-008', name: 'Isabel Vargas',    email: 'isabel@email.com', phone: '+573008901234', plan: 'Fibra 500MB',  monthlyAmount: 75000, status: 'active',    paymentStatus: 'paid',    cutDate: new Date(now.getFullYear(), now.getMonth() + 1, 20), lastPaymentAt: new Date(), tags: ['EMPRESARIAL'] },
    { billingId: 'CLT-009', name: 'Diego Herrera',    email: 'diego@email.com',  phone: '+573009012345', plan: 'Fibra 100MB',  monthlyAmount: 35000, status: 'active',    paymentStatus: 'pending', cutDate: new Date(now.getFullYear(), now.getMonth(), 25), tags: ['RESIDENCIAL'] },
    { billingId: 'CLT-010', name: 'Valentina Cruz',   email: 'valentina@email.com', phone: '+573000123456', plan: 'Fibra 1GB', monthlyAmount: 95000, status: 'active',   paymentStatus: 'paid',    cutDate: new Date(now.getFullYear(), now.getMonth() + 1, 5), lastPaymentAt: new Date(), tags: ['VIP', 'EMPRESARIAL'] },
  ];

  await Client.create(clients);
  console.log('👥 Clientes creados');

  // ─── Initial notifications ───────────────────────────────────────
  await Notification.create([
    { title: 'Sistema iniciado', message: 'Nexory está operativo y conectado a MongoDB.', type: 'system_alert', severity: 'success' },
    { title: 'Clientes morosos', message: '5 clientes tienen pagos vencidos este mes.', type: 'payment_due', severity: 'warning', link: '/clients' },
    { title: 'Router Sur offline', message: 'El Router Sur no responde desde hace 1 hora.', type: 'router_offline', severity: 'error', link: '/routers' },
  ]);
  console.log('🔔 Notificaciones creadas');

  await mongoose.disconnect();
  console.log('\n✅ Seed completado exitosamente');
  console.log('   Admin:    admin@nexory.com    / admin123');
  console.log('   Operator: operator@nexory.com / operator123');
}

seed().catch(err => { console.error('❌ Seed fallido:', err); process.exit(1); });
