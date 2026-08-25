const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.questionSet.updateMany({
    where: { title: { contains: 'Ẩm thực' } },
    data: { status: 'published', publishedAt: new Date(), questionCount: 15 },
  });
  console.log("Updated sets:", result);
}

main().catch(console.error).finally(() => prisma.$disconnect());
