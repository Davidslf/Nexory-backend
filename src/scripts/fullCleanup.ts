/**
 * Limpieza completa: borra TODOS los clientes de la BD y sus secrets PPPoE de MikroTik.
 * Uso: node_modules/.bin/tsx src/scripts/fullCleanup.ts
 * Flags:
 *   --dry-run   Solo muestra lo que haría, sin borrar nada
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { listPppoeClients } from '../services/mikrotikService';

const prisma = new PrismaClient();

async function deleteMikrotikSecret(name: string): Promise<boolean> {
  try {
    const mod = await import('node-routeros');
    const conn = new mod.RouterOSAPI({
      host:     process.env.MIKROTIK_HOST!,
      user:     process.env.MIKROTIK_USER!,
      password: process.env.MIKROTIK_PASS!,
      port:     Number(process.env.MIKROTIK_PORT || 8728),
      timeout:  10,
    });
    await conn.connect();

    // Buscar el secret
    const secrets = await conn.write('/ppp/secret/print', [`?name=${name}`]).catch(() => []);
    if (!secrets.length) { await conn.close(); return false; }

    // Terminar sesión activa si existe
    const sessions = await conn.write('/ppp/active/print', [`?name=${name}`]).catch(() => []) as any[];
    for (const s of sessions) {
      await conn.write('/ppp/active/remove', [`=.id=${s['.id']}`]).catch(() => {});
    }

    // Eliminar el secret
    const s = secrets[0] as any;
    await conn.write('/ppp/secret/remove', [`=.id=${s['.id']}`]);
    await conn.close();
    return true;
  } catch (e: any) {
    // Si RouterOS 7 devuelve UNKNOWNREPLY al eliminar, igual lo eliminó
    if (e?.errno === 'UNKNOWNREPLY' || String(e?.message).includes('UNKNOWNREPLY')) return true;
    console.warn(`  ⚠ MikroTik error al borrar ${name}:`, e?.message);
    return false;
  }
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  console.log(`\n🔍 Analizando BD y MikroTik${isDryRun ? ' (DRY RUN)' : ''}...\n`);

  // ── 1. Clientes en la BD ──────────────────────────────────────────
  const clients = await prisma.client.findMany({
    select: { id: true, name: true, documentId: true, pppoeUsername: true, _count: { select: { payments: true, tickets: true } } },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`📋 Clientes en BD (${clients.length}):\n`);
  console.table(clients.map(c => ({
    nombre:    c.name,
    documento: c.documentId,
    pppoe:     c.pppoeUsername ?? '—',
    pagos:     c._count.payments,
    tickets:   c._count.tickets,
  })));

  const pppoeInDb = clients.map(c => c.pppoeUsername).filter(Boolean) as string[];

  // ── 2. Secrets en MikroTik ────────────────────────────────────────
  let mikrotikSecrets: string[] = [];
  const mtResult = await listPppoeClients().catch(() => null);
  if (mtResult?.success && mtResult.data?.length) {
    mikrotikSecrets = mtResult.data.map(s => s.name);
    console.log(`\n🔧 PPPoE secrets en MikroTik (${mikrotikSecrets.length}): ${mikrotikSecrets.join(', ')}`);
  } else {
    console.log('\n⚠ No se pudo conectar a MikroTik o no hay secrets.');
  }

  // Secrets a borrar de MikroTik: los que están en BD + cualquier extra en MikroTik
  const allToDeleteFromMt = Array.from(new Set([...pppoeInDb, ...mikrotikSecrets]));

  if (isDryRun) {
    console.log(`\n📊 Resumen de lo que se borraría:`);
    console.log(`   • ${clients.length} clientes de la BD`);
    if (allToDeleteFromMt.length) {
      console.log(`   • ${allToDeleteFromMt.length} secrets PPPoE de MikroTik: ${allToDeleteFromMt.join(', ')}`);
    }
    console.log('\n⚠️  DRY RUN — nada fue eliminado.\n');
    await prisma.$disconnect();
    return;
  }

  // ── 3. Borrar secrets de MikroTik ─────────────────────────────────
  if (allToDeleteFromMt.length) {
    console.log(`\n🗑️  Eliminando ${allToDeleteFromMt.length} secret(s) de MikroTik...`);
    for (const name of allToDeleteFromMt) {
      const ok = await deleteMikrotikSecret(name);
      console.log(`   ${ok ? '✓' : '✗'} ${name}`);
    }
  }

  // ── 4. Borrar clientes de BD en cascada ───────────────────────────
  if (clients.length) {
    const ids = clients.map(c => c.id);
    console.log(`\n🗑️  Eliminando ${ids.length} cliente(s) de la BD...`);
    await prisma.communication.deleteMany({ where: { clientId: { in: ids } } });
    await prisma.cut.deleteMany({ where: { clientId: { in: ids } } });
    const ticketIds = (await prisma.ticket.findMany({ where: { clientId: { in: ids } }, select: { id: true } })).map(t => t.id);
    if (ticketIds.length) await prisma.ticketNote.deleteMany({ where: { ticketId: { in: ticketIds } } });
    await prisma.ticket.deleteMany({ where: { clientId: { in: ids } } });
    await prisma.task.deleteMany({ where: { clientId: { in: ids } } });
    await prisma.payment.deleteMany({ where: { clientId: { in: ids } } });
    const { count } = await prisma.client.deleteMany({ where: { id: { in: ids } } });
    console.log(`   ✓ ${count} clientes eliminados de BD`);
  }

  console.log('\n✅ Limpieza completa. BD y MikroTik sincronizados — cero clientes.\n');
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
