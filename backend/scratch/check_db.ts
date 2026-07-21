import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    const tables: any[] = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    const names = tables.map(t => t.table_name);
    console.log('Tables in database:', names);

    for (const name of names) {
      if (name === '_prisma_migrations') continue;
      const count: any[] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::integer FROM "${name}"`);
      console.log(`Table ${name} row count:`, count[0].count);
    }
  } catch (error) {
    console.error('Error querying DB:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
