import { PrismaClient, ClientStatus, Priority, TaskStatus, TicketStatus, CommType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // ── Limpiar base de datos ──
  await prisma.auditLog.deleteMany();
  await prisma.otpCode.deleteMany();
  await prisma.ticketNote.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.cut.deleteMany();
  await prisma.communication.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  // ── Usuarios ──
  const adminHash = await bcrypt.hash('admin123', 10);
  const operatorHash = await bcrypt.hash('operator123', 10);

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@nexory.com',
      name: 'Administrador',
      passwordHash: adminHash,
      role: 'ADMIN',
      phone: '573001234567',
      isActive: true,
    },
  });

  await prisma.user.create({
    data: {
      username: 'operador',
      email: 'operator@nexory.com',
      name: 'Operador',
      passwordHash: operatorHash,
      role: 'OPERATOR',
      phone: '573007654321',
      isActive: true,
    },
  });

  // ── Clientes reales ──
  const angie = await prisma.client.create({
    data: {
      name: 'Angie Vanesa Sanchez Cañaveral',
      documentId: '1000641109',
      phone: '573003198321',
      plan: 'Plan 50 Mbps',
      planSpeed: 50,
      monthlyFee: 95000,
      status: 'ACTIVE',
      paymentDueDay: 5,
      city: 'Cartago',
      address: 'Calle 5 #12-34',
      location: 'Sector Norte',
      tags: ['Residencial'],
      installationDate: new Date('2024-03-01'),
      contractNumber: 'CT-2024-001',
      latency: 14,
      uptime: 99.5,
      bandwidthUsage: 38.2,
      lastConnection: new Date(),
      notes: 'Cliente activo con pago al día.',
    },
  });

  const david = await prisma.client.create({
    data: {
      name: 'David Stiven Lujan Foronda',
      documentId: '1001250342',
      phone: '573126226684',
      plan: 'Plan 100 Mbps',
      planSpeed: 100,
      monthlyFee: 150000,
      status: 'ACTIVE',
      paymentDueDay: 1,
      city: 'Cartago',
      address: 'Carrera 8 #45-67',
      location: 'Sector Centro',
      tags: ['Residencial'],
      installationDate: new Date('2024-01-15'),
      contractNumber: 'CT-2024-002',
      latency: 9,
      uptime: 98.8,
      bandwidthUsage: 82.7,
      lastConnection: new Date(Date.now() - 3600000 * 5),
      notes: 'Pago vencido. Contactar para gestión de cobro.',
    },
  });

  // ── Pagos ──
  const currentMonth = new Date().toISOString().slice(0, 7);
  await prisma.payment.createMany({
    data: [
      { clientId: angie.id, amount: 95000, month: currentMonth, status: 'PAID', paidAt: new Date(), method: 'nequi' },
      { clientId: david.id, amount: 150000, month: currentMonth, status: 'OVERDUE' },
    ],
  });

  // ── Ticket ──
  const ticket = await prisma.ticket.create({
    data: {
      clientId: david.id,
      title: 'Intermitencia en la conexión',
      description: 'El cliente reporta cortes frecuentes en horas nocturnas.',
      status: 'OPEN',
      priority: 'HIGH',
      type: 'technical',
    },
  });

  await prisma.ticketNote.create({
    data: {
      ticketId: ticket.id,
      content: 'Se revisó el router, señal estable. Monitorear 24h.',
      author: 'admin',
    },
  });

  // ── Tareas ──
  await prisma.task.createMany({
    data: [
      {
        title: 'Cobro de cartera — David Lujan',
        description: 'Gestionar pago vencido del mes actual.',
        clientId: david.id,
        priority: 'URGENT',
        type: 'collection',
        status: 'PENDING',
        dueDate: new Date(Date.now() + 86400000 * 2),
      },
      {
        title: 'Revisión técnica antena Sector Norte',
        priority: 'MEDIUM',
        type: 'maintenance',
        status: 'PENDING',
        dueDate: new Date(Date.now() + 86400000 * 5),
      },
      {
        title: 'Instalación nuevo cliente — Sector Sur',
        priority: 'HIGH',
        type: 'installation',
        status: 'PENDING',
        dueDate: new Date(Date.now() + 86400000),
      },
    ],
  });

  // ── Comunicaciones ──
  await prisma.communication.createMany({
    data: [
      {
        clientId: david.id,
        type: 'PAYMENT_REMINDER',
        title: 'Recordatorio de pago',
        body: 'Hola David, te recordamos que tienes un pago pendiente de $150.000 correspondiente al mes de abril. Por favor realiza tu pago para evitar la suspensión del servicio. ¡Gracias!',
        status: 'DELIVERED',
      },
      {
        clientId: angie.id,
        type: 'GENERAL',
        title: 'Bienvenida',
        body: 'Hola Angie, bienvenida a NEXORY. Tu servicio de 50 Mbps está activo. ¡Que lo disfrutes!',
        status: 'DELIVERED',
      },
    ],
  });

  console.log('✅ Seed completado:');
  console.log('   👤 2 usuarios (admin, operador)');
  console.log('   📱 2 clientes (Angie, David)');
  console.log('   🎫 1 ticket');
  console.log('   ✅ 3 tareas');
  console.log('   💬 2 comunicaciones');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
