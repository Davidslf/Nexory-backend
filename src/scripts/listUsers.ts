import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, email: true, role: true, phone: true }
  });
  console.table(users);
  await prisma.$disconnect();
}
run();
