/**
 * Crea los perfiles PPPoE en MikroTik con rate-limit según plan.
 * Uso: node_modules/.bin/tsx src/scripts/setupMikrotikProfiles.ts
 */
import 'dotenv/config';

const PROFILES = [
  { name: 'plan-10mb',  rateLimit: '10M/10M'  },
  { name: 'plan-30mb',  rateLimit: '30M/30M'  },
  { name: 'plan-50mb',  rateLimit: '50M/50M'  },
  { name: 'plan-100mb', rateLimit: '100M/100M' },
  { name: 'plan-200mb', rateLimit: '200M/200M' },
  { name: 'plan-500mb', rateLimit: '500M/500M' },
];

async function main() {
  const mod = await import('node-routeros');
  const conn = new mod.RouterOSAPI({
    host:     process.env.MIKROTIK_HOST!,
    user:     process.env.MIKROTIK_USER!,
    password: process.env.MIKROTIK_PASS!,
    port:     Number(process.env.MIKROTIK_PORT || 8728),
    timeout:  10,
  });

  await conn.connect();
  console.log('✅ Conectado a MikroTik\n');

  // Get existing profiles
  const existing = await conn.write('/ppp/profile/print') as any[];
  const existingNames = existing.map(p => p.name);
  console.log('Perfiles actuales:', existingNames.join(', '));

  for (const profile of PROFILES) {
    if (existingNames.includes(profile.name)) {
      // Update rate-limit if exists
      const p = existing.find(e => e.name === profile.name);
      await conn.write('/ppp/profile/set', [
        `=.id=${p['.id']}`,
        `=rate-limit=${profile.rateLimit}`,
        '=local-address=10.10.0.1',
      ]);
      console.log(`   ↻ Actualizado: ${profile.name}  →  ${profile.rateLimit}`);
    } else {
      // Create new profile
      await conn.write('/ppp/profile/add', [
        `=name=${profile.name}`,
        `=rate-limit=${profile.rateLimit}`,
        '=local-address=10.10.0.1',
        '=dns-server=8.8.8.8,8.8.4.4',
      ]);
      console.log(`   ✓ Creado:      ${profile.name}  →  ${profile.rateLimit}`);
    }
  }

  await conn.close();
  console.log('\n🎉 Perfiles MikroTik listos.');
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
