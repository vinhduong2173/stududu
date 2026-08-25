const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Check if topic "Thức ăn & đồ uống" exists or create topic "Ẩm thực & Thức ăn"
  let topic = await prisma.vocabTopic.findFirst({
    where: { OR: [{ id: 5 }, { name: { contains: "Ẩm thực" } }, { name: { contains: "Thức ăn" } }] },
  });

  if (!topic) {
    topic = await prisma.vocabTopic.create({
      data: { name: "Ẩm thực & Thức ăn", hidden: false },
    });
  }

  // Create or update QuestionSet for Ẩm thực
  const existingSet = await prisma.questionSet.findFirst({
    where: { topicId: topic.id },
  });

  let setId;
  if (existingSet) {
    setId = existingSet.id;
    await prisma.questionSet.update({
      where: { id: setId },
      data: {
        title: "Bão tố Từ vựng: Ẩm thực & Thức ăn",
        description: "Bộ từ vựng và câu hỏi trắc nghiệm chủ đề ẩm thực, món ăn truyền thống và đồ uống.",
        status: "published",
        questionCount: 20,
        publishedAt: new Date(),
      },
    });
    console.log(`Updated existing QuestionSet ID ${setId}`);
  } else {
    const newSet = await prisma.questionSet.create({
      data: {
        languageId: 2, // English
        topicId: topic.id,
        framework: "CEFR",
        level: "B1",
        levelOrder: 3,
        title: "Bão tố Từ vựng: Ẩm thực & Thức ăn",
        description: "Bộ từ vựng và câu hỏi trắc nghiệm chủ đề ẩm thực, món ăn truyền thống và đồ uống.",
        contentLanguage: "vi",
        status: "published",
        questionCount: 20,
        createdById: 1,
        publishedAt: new Date(),
      },
    });
    setId = newSet.id;
    console.log(`Created new QuestionSet ID ${setId}`);
  }

  // Ensure 20 test questions exist
  const existingQCount = await prisma.testQuestion.count({ where: { setId } });
  if (existingQCount < 20) {
    const questionsToCreate = [];
    const foodTerms = [
      { term: "Delicious", prompt: "Từ nào có nghĩa là 'ngon miệng'?", options: ["Delicious", "Bitter", "Salty", "Sour"], answerIndex: 0 },
      { term: "Recipe", prompt: "Từ nào chỉ 'công thức nấu ăn'?", options: ["Menu", "Recipe", "Bill", "Ingredient"], answerIndex: 1 },
      { term: "Ingredient", prompt: "Từ nào chỉ 'nguyên liệu nấu ăn'?", options: ["Dish", "Spice", "Ingredient", "Flavor"], answerIndex: 2 },
      { term: "Appetizer", prompt: "Món khai vị trong tiếng Anh là gì?", options: ["Dessert", "Main course", "Side dish", "Appetizer"], answerIndex: 3 },
      { term: "Beverage", prompt: "Đồ uống / Thức uống trong tiếng Anh là gì?", options: ["Beverage", "Snack", "Soup", "Cuisine"], answerIndex: 0 },
      { term: "Cuisine", prompt: "Từ nào chỉ 'nền ẩm thực'?", options: ["Kitchen", "Cuisine", "Chef", "Buffet"], answerIndex: 1 },
      { term: "Spicy", prompt: "Từ nào có nghĩa là 'cay'?", options: ["Sweet", "Spicy", "Salty", "Bland"], answerIndex: 1 },
      { term: "Dessert", prompt: "Món tráng miệng trong tiếng Anh là gì?", options: ["Appetizer", "Dessert", "Starter", "Entree"], answerIndex: 1 },
    ];

    for (let i = existingQCount + 1; i <= 20; i++) {
      const template = foodTerms[(i - 1) % foodTerms.length];
      questionsToCreate.push({
        setId,
        orderIndex: i,
        type: "vocabulary",
        term: template.term,
        passage: null,
        prompt: `${template.prompt} (Câu ${i})`,
        options: template.options,
        answerIndex: template.answerIndex,
        explanation: `Giải thích chi tiết cho từ vựng ẩm thực câu số ${i}`,
        status: "active",
        source: "manual",
      });
    }

    await prisma.testQuestion.createMany({
      data: questionsToCreate,
    });
    console.log(`Created ${questionsToCreate.length} questions for set ${setId}`);
  }

  // Check all sets
  const allSets = await prisma.questionSet.findMany({
    where: { status: "published" },
    include: { topic: true, language: true, _count: { select: { questions: true } } },
  });
  console.log("Published Question Sets now in DB:", allSets.map(s => ({
    id: s.id,
    title: s.title,
    topic: s.topic.name,
    language: s.language.name,
    level: s.level,
    questionCount: s._count.questions
  })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
