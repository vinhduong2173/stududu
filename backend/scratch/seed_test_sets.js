const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Ensure languages exist
  let langEn = await prisma.language.findFirst({ where: { code: 'en' } });
  let langJa = await prisma.language.findFirst({ where: { code: 'ja' } });

  if (!langEn) {
    langEn = await prisma.language.create({ data: { code: 'en', name: 'English', framework: 'CEFR' } });
  }
  if (!langJa) {
    langJa = await prisma.language.create({ data: { code: 'ja', name: '日本語', framework: 'CEFR' } });
  }

  // Ensure topics exist
  const topicWeather = await prisma.vocabTopic.upsert({
    where: { name: 'Thời tiết & thiên nhiên' },
    update: {},
    create: { name: 'Thời tiết & thiên nhiên', hidden: false },
  });

  const topicOffice = await prisma.vocabTopic.upsert({
    where: { name: 'Nghề nghiệp' },
    update: {},
    create: { name: 'Nghề nghiệp', hidden: false },
  });

  const topicSchool = await prisma.vocabTopic.upsert({
    where: { name: 'Học tập & trường lớp' },
    update: {},
    create: { name: 'Học tập & trường lớp', hidden: false },
  });

  const topicFood = await prisma.vocabTopic.upsert({
    where: { name: 'Thức ăn & đồ uống' },
    update: {},
    create: { name: 'Thức ăn & đồ uống', hidden: false },
  });

  const setsToCreate = [
    {
      id: 1,
      languageId: langEn.id,
      topicId: topicWeather.id,
      framework: 'CEFR',
      level: 'B1',
      levelOrder: 3,
      title: 'Bão tố Từ vựng: Thời tiết',
      description: 'Bộ từ vựng và trắc nghiệm chủ đề thời tiết, khí hậu.',
      status: 'published',
      questionCount: 20,
      createdById: 1,
      publishedAt: new Date(),
    },
    {
      id: 2,
      languageId: langEn.id,
      topicId: topicOffice.id,
      framework: 'CEFR',
      level: 'B2',
      levelOrder: 4,
      title: 'Từ điển Văn phòng',
      description: 'Bộ từ vựng giao tiếp và làm việc trong môi trường văn phòng.',
      status: 'published',
      questionCount: 20,
      createdById: 1,
      publishedAt: new Date(),
    },
    {
      id: 3,
      languageId: langJa.id,
      topicId: topicSchool.id,
      framework: 'CEFR',
      level: 'A1',
      levelOrder: 1,
      title: 'Hiragana Cơ bản',
      description: 'Kiểm tra bảng chữ cái Hiragana và từ vựng sơ cấp tiếng Nhật.',
      status: 'published',
      questionCount: 20,
      createdById: 1,
      publishedAt: new Date(),
    },
    {
      id: 4,
      languageId: langEn.id,
      topicId: topicFood.id,
      framework: 'CEFR',
      level: 'B1',
      levelOrder: 3,
      title: 'Bão tố Từ vựng: Ẩm thực & Thức ăn',
      description: 'Bộ từ vựng và trắc nghiệm chủ đề ẩm thực, món ăn và đồ uống.',
      status: 'published',
      questionCount: 20,
      createdById: 1,
      publishedAt: new Date(),
    },
  ];

  for (const s of setsToCreate) {
    const existing = await prisma.questionSet.findUnique({ where: { id: s.id } });
    if (!existing) {
      await prisma.questionSet.create({ data: s });
      console.log(`Created Set ID ${s.id}: ${s.title}`);
    } else {
      await prisma.questionSet.update({ where: { id: s.id }, data: { status: 'published', questionCount: 20 } });
      console.log(`Updated Set ID ${s.id}: ${s.title}`);
    }

    // Add 20 questions
    const qCount = await prisma.testQuestion.count({ where: { setId: s.id } });
    if (qCount < 20) {
      const qData = [];
      for (let i = qCount + 1; i <= 20; i++) {
        qData.push({
          setId: s.id,
          orderIndex: i,
          type: 'vocabulary',
          term: `Word ${i}`,
          passage: null,
          prompt: `Câu hỏi số ${i} cho bộ đề ${s.title}?`,
          options: [`Đáp án A (Đúng)`, `Đáp án B`, `Đáp án C`, `Đáp án D`],
          answerIndex: 0,
          explanation: `Giải thích chi tiết cho câu hỏi số ${i}`,
          status: 'active',
          source: 'manual',
        });
      }
      await prisma.testQuestion.createMany({ data: qData });
      console.log(`Created ${qData.length} questions for Set ID ${s.id}`);
    }
  }

  console.log("Seeding complete!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
