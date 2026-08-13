const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const userId = 2; // normal user ID
  const sets = await prisma.questionSet.findMany({
    where: {
      status: 'published',
      topic: { hidden: false },
    },
    include: {
      language: { select: { id: true, code: true, name: true } },
      topic: { select: { id: true, name: true } },
      attempts: {
        where: { userId, finishedAt: { not: null } },
        orderBy: { finishedAt: 'desc' },
        take: 1,
        select: { correctCount: true, totalCount: true, finishedAt: true },
      },
    },
    orderBy: [{ levelOrder: 'asc' }, { title: 'asc' }],
  });

  const res = sets.map(({ attempts, ...set }) => ({
    ...set,
    lastAttempt: attempts[0] ?? null,
  }));

  console.log("Returned sets for user:", JSON.stringify(res, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
