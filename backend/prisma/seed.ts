import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const LANGUAGES = [
  { code: 'vi', name: 'Tiếng Việt', framework: 'CEFR' },
  { code: 'en', name: 'English', framework: 'CEFR' },
  { code: 'zh', name: '中文', framework: 'CEFR' },
  { code: 'ja', name: '日本語', framework: 'CEFR' },
  { code: 'ko', name: '한국어', framework: 'CEFR' },
  { code: 'fr', name: 'Français', framework: 'CEFR' },
  { code: 'es', name: 'Español', framework: 'CEFR' },
  { code: 'de', name: 'Deutsch', framework: 'CEFR' },
];

const TOPICS = [
  'Travel',
  'Music',
  'Movies',
  'Food & Culinary',
  'Sports',
  'Technology',
  'Books',
  'Gaming',
  'Culture',
  'Exams (IELTS/TOEIC…)',
];

// Chủ đề TỪ VỰNG cho bộ đề — cố tình khác TOPICS ở trên (TOPICS = sở thích để
// ghép người nói chuyện, xem question-set-design.md mục 2)
const VOCAB_TOPICS = [
  'Động vật',
  'Thức ăn & đồ uống',
  'Gia đình',
  'Nghề nghiệp',
  'Cơ thể & sức khoẻ',
  'Nhà cửa & đồ dùng',
  'Thời tiết & thiên nhiên',
  'Giao thông & đi lại',
  'Mua sắm & tiền bạc',
  'Học tập & trường lớp',
  'Cảm xúc & tính cách',
  'Công nghệ & Internet',
];

async function main() {
  for (const lang of LANGUAGES) {
    await prisma.language.upsert({
      where: { code: lang.code },
      update: {},
      create: lang,
    });
  }

  for (const name of TOPICS) {
    await prisma.topic.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  for (const name of VOCAB_TOPICS) {
    await prisma.vocabTopic.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // Seed admin account (OJT Project requirement)
  const adminEmail = 'admin@stududu.com';
  const adminPassword = 'AdminPassword123';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: hashedPassword,
      displayName: 'System Admin',
      role: UserRole.admin,
    },
    create: {
      email: adminEmail,
      passwordHash: hashedPassword,
      displayName: 'System Admin',
      role: UserRole.admin,
    },
  });

  console.log(
    `Seeded ${LANGUAGES.length} languages, ${TOPICS.length} topics, ${VOCAB_TOPICS.length} vocab topics.`,
  );
  console.log(`Seeded admin account: ${adminEmail}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

