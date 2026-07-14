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
  'Du lịch',
  'Âm nhạc',
  'Phim ảnh',
  'Ẩm thực',
  'Thể thao',
  'Công nghệ',
  'Sách',
  'Game',
  'Văn hóa',
  'Thi cử (IELTS/TOEIC…)',
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

  console.log(`Seeded ${LANGUAGES.length} languages, ${TOPICS.length} topics.`);
  console.log(`Seeded admin account: ${adminEmail}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

