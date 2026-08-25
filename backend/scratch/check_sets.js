const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const topics = await prisma.vocabTopic.findMany();
  console.log("Topics:", topics);
  const sets = await prisma.questionSet.findMany({ include: { topic: true, language: true } });
  console.log("Sets count:", sets.length);
  sets.forEach(s => console.log(`Set ${s.id}: ${s.title} | status: ${s.status} | topic: ${s.topic?.name} | questions: ${s.questionCount}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
