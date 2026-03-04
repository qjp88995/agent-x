import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client';

import 'dotenv/config';

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error('Usage: pnpm db:promote-admin <email>');
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const adapter = new PrismaPg(databaseUrl);
  const prisma = new PrismaClient({ adapter });

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      console.error(`User with email "${email}" not found`);
      process.exit(1);
    }

    if (user.role === 'ADMIN') {
      console.log(`User "${email}" is already an ADMIN`);
      return;
    }

    await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' },
    });

    console.log(`Successfully promoted "${email}" to ADMIN`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
