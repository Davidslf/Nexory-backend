import cron from 'node-cron';
import { prisma } from '../config/database';
import { disableClient } from '../services/mikrotikService';
import { sendSuspensionNotice } from '../services/notificationService';

// ─── Core logic (exported for manual triggering + testing) ────────────────────
export const runMonthlyCutJob = async (): Promise<void> => {
  const now   = new Date();
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();

  console.log(`[CutJob] ▶ Iniciando cortes — ${now.toISOString()}`);

  // Find active clients with overdue payments AND pppoeUsername configured
  const overdue = await prisma.client.findMany({
    where: {
      status:       'ACTIVE',
      pppoeUsername: { not: null },
      payments: { some: { status: 'OVERDUE' } },
    },
    select: {
      id:           true,
      name:         true,
      phone:        true,
      email:        true,
      pppoeUsername: true,
    },
  });

  if (!overdue.length) {
    console.log('[CutJob] ✓ Sin clientes morosos con PPPoE configurado. Finalizando.');
    return;
  }

  console.log(`[CutJob] ${overdue.length} clientes a procesar`);

  let suspended = 0;
  let failed    = 0;

  for (const client of overdue) {
    try {
      const result = await disableClient(client.pppoeUsername!);

      if (result.success) {
        await prisma.client.update({
          where: { id: client.id },
          data:  { status: 'SUSPENDED' },
        });

        // Register cut record
        await prisma.cut.create({
          data: {
            clientId:    client.id,
            reason:      `Corte automático por mora — ${month}/${year}`,
            scheduledAt: now,
            executedAt:  now,
            status:      'EXECUTED',
          },
        });

        suspended++;
      } else {
        console.error(`[CutJob] MikroTik falló para ${client.pppoeUsername}: ${result.error}`);
        failed++;
      }

      // Log communication
      await prisma.communication.create({
        data: {
          clientId: client.id,
          type:     'SUSPENSION_NOTICE',
          title:    'Servicio suspendido por mora',
          body:     result.success
            ? `Servicio PPPoE suspendido automáticamente por falta de pago — ${month}/${year}`
            : `Intento de suspensión fallido: ${result.error}`,
          status: result.success ? 'SENT' : 'FAILED',
        },
      });

      if (result.success) {
        await sendSuspensionNotice(client as any).catch((e: unknown) =>
          console.error('[CutJob] Error enviando aviso WhatsApp:', e),
        );
      }
    } catch (err) {
      console.error(`[CutJob] Error con cliente ${client.id}:`, err);
      failed++;
    }
  }

  console.log(`[CutJob] ✓ Completado — Suspendidos: ${suspended} | Fallidos: ${failed}`);
};

// ─── Schedule: every 15th of the month at 06:00 ──────────────────────────────
export const scheduleMonthlyCutJob = (): void => {
  const timezone = process.env.TZ || 'America/Bogota';

  cron.schedule('0 6 15 * *', async () => {
    try {
      await runMonthlyCutJob();
    } catch (err) {
      console.error('[CutJob] Error no manejado:', err);
    }
  }, { timezone });

  console.log(`[CutJob] Programado — día 15 a las 06:00 (${timezone})`);
};
