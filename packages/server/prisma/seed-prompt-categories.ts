import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client';

import 'dotenv/config';

const SYSTEM_CATEGORIES = [
  'Role Playing',
  'Code Assistant',
  'Writing',
  'Translation',
  'Analysis',
  'Education',
  'Creative',
  'Business',
  'Other',
];

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter });

  try {
    const existing = await prisma.promptCategory.findMany({
      where: { type: 'SYSTEM', createdBy: null },
      select: { name: true },
    });
    const existingNames = new Set(existing.map(c => c.name));
    const toCreate = SYSTEM_CATEGORIES.filter(name => !existingNames.has(name));

    if (toCreate.length === 0) {
      console.log('All prompt categories already exist, nothing to seed');
      return;
    }

    const result = await prisma.promptCategory.createMany({
      data: toCreate.map(name => ({
        name,
        type: 'SYSTEM' as const,
        createdBy: null,
      })),
    });

    console.log(`Seeded ${result.count} prompt categories`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
