import 'dotenv/config';

async function run() {
  const mod = await import('node-routeros');
  const conn = new mod.RouterOSAPI({
    host:     process.env.MIKROTIK_HOST!,
    user:     process.env.MIKROTIK_USER!,
    password: process.env.MIKROTIK_PASS!,
    port:     Number(process.env.MIKROTIK_PORT || 8728),
    timeout:  10,
  });
  await conn.connect();
  const profiles = await conn.write('/ppp/profile/print');
  console.log('PPPoE Profiles:');
  (profiles as any[]).forEach((p: any) => console.log(' -', p.name));
  await conn.close();
}

run().catch(e => console.error('Error:', e.message));
