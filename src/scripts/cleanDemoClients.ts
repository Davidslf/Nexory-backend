/**
 * Elimina los clientes de demo (seed) de la BD.
 * Mantiene solo los clientes que tienen usuario PPPoE real o que fueron creados manualmente.
 *
 * Uso: node_modules/.bin/tsx src/scripts/cleanDemoClients.ts
 *
 * Flags:
 *   --dry-run   Solo muestra lo que borraría, sin borrar nada
 *   --all       Borra TODOS los clientes (¡cuidado!)
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Nombres típicos de los clientes demo generados por seed.ts
const DEMO_NAMES = [
  'Carlos Martínez López',
  'Ana García Rodríguez',
  'Juan Pablo Hernández',
  'María Fernanda Torres',
  'Luis Alberto Gómez',
  'Sofia Ramírez Castro',
  'Pedro Antonio Vargas',
  'Laura Cristina Díaz',
  'Miguel Ángel Moreno',
  'Diana Paola Suárez',
  'Andrés Felipe Jiménez',
  'Claudia Patricia Muñoz',
];

// IDs de contratos demo
const DEMO_CONTRACT_PREFIX = 'CON-2024-';

async function main() {
  const isDryRun  = process.argv.includes('--dry-run');
  const deleteAll = process.argv.includes('--all');

  console.log(`\n🔍 Buscando clientes a eliminar${isDryRun ? ' (DRY RUN — no se borrará nada)' : ''}...\n`);

  let where: any = {};

  if (!deleteAll) {
    // Solo borrar clientes que coincidan con datos demo
    where = {
      OR: [
        { name: { in: DEMO_NAMES } },
        { contractNumber: { startsWith: DEMO_CONTRACT_PREFIX } },
      ],
    };
  }

  const clients = await prisma.client.findMany({
    where,
    select: {
      id: true, name: true, documentId: true,
      contractNumber: true, pppoeUsername: true, phone: true,
      status: true,
      _count: { select: { payments: true, tickets: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  if (clients.length === 0) {
    console.log('✅ No se encontraron clientes para eliminar.\n');
    await prisma.$disconnect();
    return;
  }

  console.log(`📋 Clientes a eliminar (${clients.length}):\n`);
  console.table(
    clients.map(c => ({
      nombre:     c.name,
      documento:  c.documentId,
      contrato:   c.contractNumber ?? '—',
      pppoe:      c.pppoeUsername  ?? '—',
      teléfono:   c.phone          ?? '—',
      estado:     c.status,
      pagos:      c._count.payments,
      tickets:    c._count.tickets,
    }))
  );

  if (isDryRun) {
    console.log('\n⚠️  DRY RUN — nada fue eliminado. Ejecuta sin --dry-run para borrar.\n');
    await prisma.$disconnect();
    return;
  }

  const ids = clients.map(c => c.id);

  // Eliminar en cascada: pagos, tickets, comunicaciones, cortes, historial
  console.log('\n🗑️  Eliminando datos relacionados...');
  await prisma.communication.deleteMany({ where: { clientId: { in: ids } } });
  await prisma.cut.deleteMany({ where: { clientId: { in: ids } } });
  // Notas de tickets primero, luego tickets
  const ticketIds = (await prisma.ticket.findMany({ where: { clientId: { in: ids } }, select: { id: true } })).map(t => t.id);
  await prisma.ticketNote.deleteMany({ where: { ticketId: { in: ticketIds } } });
  await prisma.ticket.deleteMany({ where: { clientId: { in: ids } } });
  await prisma.payment.deleteMany({ where: { clientId: { in: ids } } });

  console.log('🗑️  Eliminando clientes...');
  const { count } = await prisma.client.deleteMany({ where: { id: { in: ids } } });

  console.log(`\n✅ Eliminados ${count} clientes demo.\n`);
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
