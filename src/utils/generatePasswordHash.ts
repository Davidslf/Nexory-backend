import bcrypt from 'bcryptjs';

// Script para generar password hashes
// Ejecutar con: npx tsx src/utils/generatePasswordHash.ts

const generateHashes = async () => {
  const passwords = {
    admin: 'admin123',
    operator: 'operator123',
  };

  console.log('Generating password hashes...\n');

  for (const [role, password] of Object.entries(passwords)) {
    const hash = await bcrypt.hash(password, 10);
    console.log(`${role}:`);
    console.log(`  Password: ${password}`);
    console.log(`  Hash: ${hash}\n`);
  }
};

generateHashes().catch(console.error);
