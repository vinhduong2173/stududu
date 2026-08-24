const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Delete dummy questions matching "Từ vựng %" or "Chọn đáp án đúng cho từ vựng số %"
  const deleted = await prisma.testQuestion.deleteMany({
    where: {
      OR: [
        { term: { startsWith: 'Từ vựng ' } },
        { prompt: { startsWith: 'Chọn đáp án đúng cho từ vựng số ' } },
      ],
    },
  });

  console.log("Deleted dummy questions count:", deleted.count);

  // Recalculate questionCount for all sets
  const sets = await prisma.questionSet.findMany({ select: { id: true } });
  for (const s of sets) {
    const activeCount = await prisma.testQuestion.count({
      where: { setId: s.id, status: 'active' },
    });
    await prisma.questionSet.update({
      where: { id: s.id },
      data: { questionCount: activeCount },
    });
    console.log(`Set ${s.id} updated questionCount: ${activeCount}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
