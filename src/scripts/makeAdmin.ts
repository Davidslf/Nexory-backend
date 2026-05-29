import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const r = await prisma.user.update({
    where: { username: 'asanchez' },
    data:  { role: 'ADMIN' },
  });
  console.log('✅', r.username, '→ rol:', r.role);
  await prisma.$disconnect();
}
run().catch(e => { console.error('Error:', e.message); process.exit(1); });
