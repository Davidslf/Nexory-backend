import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const updated = await prisma.user.update({
    where: { username: 'asanchez' },
    data:  { email: 'angievanesasanchez10i3@gmail.com' },
  });
  console.log('✅ Email actualizado:', updated.username, '→', updated.email);

  await prisma.$disconnect();
}
run().catch(e => { console.error(e); process.exit(1); });
