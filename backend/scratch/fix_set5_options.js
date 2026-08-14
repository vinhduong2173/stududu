const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const set5 = await prisma.questionSet.findFirst({
    where: { title: { contains: 'Ẩm thực' } },
    include: { questions: true },
  });

  if (!set5) {
    console.log("Set 5 not found!");
    return;
  }

  console.log(`Found set ID ${set5.id} with ${set5.questions.length} questions`);

  // Sample culinary words & meanings & distractors
  const culinaryItems = [
    { word: 'Breakfast', meaning: 'Bữa sáng', distractors: ['Bữa trưa', 'Bữa tối', 'Bữa ăn nhẹ'] },
    { word: 'Lunch', meaning: 'Bữa trưa', distractors: ['Bữa sáng', 'Bữa xế', 'Đồ uống'] },
    { word: 'Dinner', meaning: 'Bữa tối', distractors: ['Bữa sáng', 'Bữa trưa', 'Tráng miệng'] },
    { word: 'Appetizer', meaning: 'Món khai vị', distractors: ['Món chính', 'Tráng miệng', 'Đồ uống'] },
    { word: 'Main course', meaning: 'Món ăn chính', distractors: ['Món khai vị', 'Tráng miệng', 'Bánh ngọt'] },
    { word: 'Dessert', meaning: 'Món tráng miệng', distractors: ['Món chính', 'Khai vị', 'Súp'] },
    { word: 'Beverage', meaning: 'Thức uống', distractors: ['Món mặn', 'Nước sốt', 'Gia vị'] },
    { word: 'Ingredient', meaning: 'Nguyên liệu', distractors: ['Dụng cụ bếp', 'Thực đơn', 'Đầu bếp'] },
    { word: 'Recipe', meaning: 'Công thức nấu ăn', distractors: ['Thực đơn', 'Hóa đơn', 'Khăn bàn'] },
    { word: 'Delicious', meaning: 'Thơm ngon', distractors: ['Cay đắng', 'Chua chát', 'Nhạt nhẽo'] },
    { word: 'Spicy', meaning: 'Cay nồng', distractors: ['Ngot ngào', 'Mặn mòi', 'Béo ngậy'] },
    { word: 'Flavorful', meaning: 'Đậm đà hương vị', distractors: ['Tanh hôi', 'Đắng ngắt', 'Khô khốc'] },
    { word: 'Chef', meaning: 'Đầu bếp trưởng', distractors: ['Bồi bàn', 'Thu ngân', 'Khách hàng'] },
    { word: 'Menu', meaning: 'Thực đơn', distractors: ['Hóa đơn', 'Khăn ăn', 'Bàn ăn'] },
    { word: 'Seafood', meaning: 'Hải sản', distractors: ['Thịt gia cầm', 'Rau củ', 'Ngũ cốc'] },
  ];

  for (let i = 0; i < set5.questions.length; i++) {
    const q = set5.questions[i];
    const item = culinaryItems[i % culinaryItems.length];

    await prisma.testQuestion.update({
      where: { id: q.id },
      data: {
        type: 'vocabulary',
        term: item.word,
        prompt: `Từ '${item.word}' có nghĩa là gì?`,
        options: [item.meaning, ...item.distractors],
        answerIndex: 0,
        explanation: `Từ vựng "${item.word}" có nghĩa là: ${item.meaning}.`,
      },
    });

    console.log(`Updated Question ${q.id}: ${item.word} -> [${item.meaning}, ${item.distractors.join(', ')}]`);
  }

  console.log("Fix completed successfully!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
