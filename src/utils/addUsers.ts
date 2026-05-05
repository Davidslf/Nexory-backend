/**
 * Script para agregar usuarios al sistema sin borrar datos existentes.
 * Uso: npx tsx src/utils/addUsers.ts
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash12345 = await bcrypt.hash('12345', 10);

  const users = [
    {
      username: 'daforonda',
      email: 'david@nexory.com',
      name: 'David Lujan',
      passwordHash: hash12345,
      role: 'ADMIN' as const,
      phone: '573126226684',
      isActive: true,
    },
    {
      username: 'asanchez',
      email: 'angie@nexory.com',
      name: 'Angie Sanchez',
      passwordHash: hash12345,
      role: 'OPERATOR' as const,
      phone: '573003198321',
      isActive: true,
    },
  ];

  for (const u of users) {
    const existing = await prisma.user.findUnique({ where: { username: u.username } });
    if (existing) {
      await prisma.user.update({ where: { username: u.username }, data: u });
      console.log(`✏️  Actualizado: ${u.username}`);
    } else {
      await prisma.user.create({ data: u });
      console.log(`✅ Creado: ${u.username} (${u.name})`);
    }
  }

  console.log('\n🎉 Listo. Usuarios disponibles:');
  console.log('   • daforonda / 12345  (Admin)');
  console.log('   • asanchez  / 12345  (Operator)');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
