const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const languages = await prisma.language.findMany();
  console.log('LANGUAGES:', languages);

  const cremeWords = await prisma.wordLibrary.findMany({
    where: { term: { contains: 'crème', mode: 'insensitive' } },
    include: { language: true },
  });
  console.log('CREME WORDS:', cremeWords);

  const savedWords = await prisma.userSavedWord.findMany({
    include: { word: { include: { language: true } } },
    orderBy: { id: 'desc' },
    take: 5,
  });
  console.log('RECENT SAVED WORDS:', savedWords);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
