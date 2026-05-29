import 'dotenv/config';

async function tryPass(pass: string) {
  const mod = await import('node-routeros');
  const { RouterOSAPI } = mod;
  const conn = new RouterOSAPI({
    host: process.env.MIKROTIK_HOST!,
    user: 'admin',
    password: pass,
    port: Number(process.env.MIKROTIK_PORT) || 18613,
    timeout: 5,
  });
  try {
    await conn.connect();
    const r = await conn.write('/system/identity/print') as any[];
    console.log(`✅ Password="${pass}" FUNCIONA! Router: ${r[0]?.name}`);
    await conn.close();
    return true;
  } catch (e: any) {
    console.log(`❌ "${pass}": ${e.message || e.errno}`);
    return false;
  }
}

async function run() {
  for (const p of ['Nexory123', '', 'nexory123', 'NEXORY123', 'nexory', 'admin', '1234']) {
    if (await tryPass(p)) break;
  }
}
run();
