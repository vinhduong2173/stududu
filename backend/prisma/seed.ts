import { PrismaClient, UserRole, MatchStatus, InteractionAction, MessageType } from '@prisma/client';
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

const MEMBERS_DATA = [
  // 1. Bé Khót (Main Account)
  {
    email: 'bekhot123@gmail.com',
    displayName: 'Bé Khót',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    bio: 'Người học Tiếng Anh đam mê văn hóa và giao lưu ngôn ngữ Tandem.',
    intent: 'Giao tiếp hằng ngày',
    city: 'TP. Hồ Chí Minh',
    country: 'Vietnam',
    isPro: true,
    nativeCode: 'vi',
    learnCode: 'en',
    learnLevel: '3',
    topics: ['Travel', 'Music', 'Food & Culinary'],
  },
  // 2. Sarah Jenkins
  {
    email: 'sarah.jenkins@example.com',
    displayName: 'Sarah Jenkins',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    bio: 'Hi! I am from London. I love Vietnamese street food and culture! Looking for a Tandem partner to practice conversational Vietnamese.',
    intent: 'Giao tiếp hằng ngày',
    city: 'London',
    country: 'UK',
    isPro: true,
    nativeCode: 'en',
    learnCode: 'vi',
    learnLevel: '3',
    topics: ['Travel', 'Food & Culinary', 'Culture'],
  },
  // 3. Kenji Sato
  {
    email: 'kenji.sato@example.com',
    displayName: 'Kenji Sato (佐藤健司)',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    bio: 'Konnichiwa! Software engineer living in Tokyo. Interested in tech, anime, and learning languages.',
    intent: 'Học tập & Công việc',
    city: 'Tokyo',
    country: 'Japan',
    isPro: false,
    nativeCode: 'ja',
    learnCode: 'en',
    learnLevel: '4',
    topics: ['Technology', 'Gaming', 'Music'],
  },
  // 4. Li Wei
  {
    email: 'liwei@example.com',
    displayName: 'Li Wei (李伟)',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    bio: 'Hello! Business manager learning Vietnamese for trade. Happy to teach Mandarin!',
    intent: 'Học tập & Công việc',
    city: 'Beijing',
    country: 'China',
    isPro: true,
    nativeCode: 'zh',
    learnCode: 'vi',
    learnLevel: '3',
    topics: ['Books', 'Culture', 'Exams (IELTS/TOEIC…)'],
  },
  // 5. Min-jun Park
  {
    email: 'minjun.park@example.com',
    displayName: 'Min-jun Park (박민준)',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
    bio: 'K-pop & music enthusiast from Seoul. Let us exchange Korean and English/Vietnamese!',
    intent: 'Kết bạn & Trải nghiệm',
    city: 'Seoul',
    country: 'Korea',
    isPro: false,
    nativeCode: 'ko',
    learnCode: 'en',
    learnLevel: '3',
    topics: ['Music', 'Movies', 'Travel'],
  },
  // 6. Emma Dupont
  {
    email: 'emma.dupont@example.com',
    displayName: 'Emma Dupont',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    bio: 'Bonjour! Architect from Paris. Passionate about art, literature, and Southeast Asian culture.',
    intent: 'Kết bạn & Trải nghiệm',
    city: 'Paris',
    country: 'France',
    isPro: true,
    nativeCode: 'fr',
    learnCode: 'vi',
    learnLevel: '2',
    topics: ['Books', 'Culture', 'Food & Culinary'],
  },
  // 7. Alex Miller
  {
    email: 'alex.miller@example.com',
    displayName: 'Alex Miller',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
    bio: 'English teacher living in Da Nang. Want to practice advanced Vietnamese and share English tips!',
    intent: 'Luyện thi chứng chỉ',
    city: 'Đà Nẵng',
    country: 'Vietnam',
    isPro: false,
    nativeCode: 'en',
    learnCode: 'vi',
    learnLevel: '4',
    topics: ['Exams (IELTS/TOEIC…)', 'Sports', 'Travel'],
  },
  // 8. Member 1
  {
    email: 'member1@stududu.com',
    displayName: 'Thành Viên 1 (Member 1)',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    bio: 'Chào mọi người! Rất vui được tham gia cộng đồng Tandem Stududu.',
    intent: 'Giao tiếp hằng ngày',
    city: 'Hà Nội',
    country: 'Vietnam',
    isPro: false,
    nativeCode: 'vi',
    learnCode: 'en',
    learnLevel: '2',
    topics: ['Music', 'Movies'],
  },
  // 9. Member 2
  {
    email: 'member2@stududu.com',
    displayName: 'Thành Viên 2 (Member 2)',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
    bio: 'Thích học tiếng Nhật và giao lưu với bạn bè quốc tế.',
    intent: 'Kết bạn & Trải nghiệm',
    city: 'Đà Nẵng',
    country: 'Vietnam',
    isPro: true,
    nativeCode: 'vi',
    learnCode: 'ja',
    learnLevel: '3',
    topics: ['Gaming', 'Technology'],
  },
  // 10. User 1
  {
    email: 'user1@gmail.com',
    displayName: 'User 1 (Nguyễn Văn A)',
    avatarUrl: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?w=150',
    bio: 'Sinh viên ngành ngôn ngữ Anh. Muốn tìm bạn bản xứ trao đổi.',
    intent: 'Học tập & Công việc',
    city: 'TP. Hồ Chí Minh',
    country: 'Vietnam',
    isPro: false,
    nativeCode: 'vi',
    learnCode: 'en',
    learnLevel: '4',
    topics: ['Exams (IELTS/TOEIC…)', 'Technology'],
  },
  // 11. User 2
  {
    email: 'user2@gmail.com',
    displayName: 'User 2 (Trần Thị B)',
    avatarUrl: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=150',
    bio: 'Đam mê văn hóa Trung Quốc, muốn nâng cao kỹ năng nghe nói HSK5.',
    intent: 'Luyện thi chứng chỉ',
    city: 'Hà Nội',
    country: 'Vietnam',
    isPro: true,
    nativeCode: 'vi',
    learnCode: 'zh',
    learnLevel: '4',
    topics: ['Culture', 'Books'],
  },
  // 12. User 3
  {
    email: 'user3@gmail.com',
    displayName: 'User 3 (Lê Hoàng C)',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
    bio: 'Thích du lịch, ẩm thực và nói tiếng Tây Ban Nha.',
    intent: 'Kết bạn & Trải nghiệm',
    city: 'Cần Thơ',
    country: 'Vietnam',
    isPro: false,
    nativeCode: 'vi',
    learnCode: 'es',
    learnLevel: '2',
    topics: ['Travel', 'Food & Culinary'],
  },
  // 13. John Smith
  {
    email: 'john.smith@example.com',
    displayName: 'John Smith',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    bio: 'Hello! Expat living in Saigon. Happy to help you with English!',
    intent: 'Giao tiếp hằng ngày',
    city: 'TP. Hồ Chí Minh',
    country: 'Vietnam',
    isPro: true,
    nativeCode: 'en',
    learnCode: 'vi',
    learnLevel: '2',
    topics: ['Sports', 'Food & Culinary'],
  },
  // 14. Jessica Taylor
  {
    email: 'jessica.taylor@example.com',
    displayName: 'Jessica Taylor',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    bio: 'Digital nomad travelling across Vietnam. Love learning basic Vietnamese phrases!',
    intent: 'Kết bạn & Trải nghiệm',
    city: 'Hội An',
    country: 'Vietnam',
    isPro: false,
    nativeCode: 'en',
    learnCode: 'vi',
    learnLevel: '1',
    topics: ['Travel', 'Culture'],
  },
];

async function main() {
  console.log('Seeding languages...');
  for (const lang of LANGUAGES) {
    await prisma.language.upsert({
      where: { code: lang.code },
      update: {},
      create: lang,
    });
  }

  console.log('Seeding topics...');
  for (const name of TOPICS) {
    await prisma.topic.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const defaultPassword = await bcrypt.hash('12345678', 10);

  // Seed Admin Account
  const adminEmail = 'admin@stududu.com';
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: defaultPassword,
      displayName: 'System Admin',
      role: UserRole.admin,
    },
    create: {
      email: adminEmail,
      passwordHash: defaultPassword,
      displayName: 'System Admin',
      role: UserRole.admin,
    },
  });

  const createdUsers: Record<string, any> = {};

  console.log('Seeding member accounts...');
  for (const m of MEMBERS_DATA) {
    const user = await prisma.user.upsert({
      where: { email: m.email },
      update: {
        passwordHash: defaultPassword,
        displayName: m.displayName,
        avatarUrl: m.avatarUrl,
        bio: m.bio,
        intent: m.intent,
        city: m.city,
        country: m.country,
        isPro: m.isPro,
        role: UserRole.member,
      },
      create: {
        email: m.email,
        passwordHash: defaultPassword,
        displayName: m.displayName,
        avatarUrl: m.avatarUrl,
        bio: m.bio,
        intent: m.intent,
        city: m.city,
        country: m.country,
        isPro: m.isPro,
        role: UserRole.member,
      },
    });

    createdUsers[m.email] = user;

    const nativeL = await prisma.language.findUnique({ where: { code: m.nativeCode } });
    const learnL = await prisma.language.findUnique({ where: { code: m.learnCode } });

    if (nativeL && learnL) {
      await prisma.userLanguage.deleteMany({ where: { userId: user.id } });
      await prisma.userLanguage.createMany({
        data: [
          { userId: user.id, languageId: nativeL.id, role: 'native' },
          { userId: user.id, languageId: learnL.id, role: 'learning', level: m.learnLevel },
        ],
      });
    }

    // Seed Interests
    await prisma.userInterest.deleteMany({ where: { userId: user.id } });
    for (const tName of m.topics) {
      const topicObj = await prisma.topic.findUnique({ where: { name: tName } });
      if (topicObj) {
        await prisma.userInterest.create({
          data: { userId: user.id, topicId: topicObj.id },
        });
      }
    }

    // Seed Posts
    const postCount = await prisma.activityPost.count({ where: { userId: user.id } });
    if (postCount === 0) {
      await prisma.activityPost.create({
        data: {
          userId: user.id,
          type: 'user_post',
          content: `Xin chào mọi người! Mình là ${m.displayName}. Rất vui được gặp và học cùng các bạn trên Stududu!`,
        },
      });
    }
  }

  // Seed Matches & Conversations between Bé Khót (bekhot123@gmail.com) and other members
  console.log('Seeding matches, conversations, and chat messages...');
  const mainUser = createdUsers['bekhot123@gmail.com'];
  const chatPartners = [
    { email: 'sarah.jenkins@example.com', msgs: ['Hi Bé Khót! How are you today?', 'Nice to meet you! Are you free for language practice?'] },
    { email: 'alex.miller@example.com', msgs: ['Chào bạn! Mình có thể giúp bạn luyện Tiếng Anh giao tiếp nhé.', 'Bạn rảnh khi nào?'] },
    { email: 'liwei@example.com', msgs: ['你好! Hello from Beijing!', 'Let us exchange Vietnamese and Mandarin.'] },
    { email: 'kenji.sato@example.com', msgs: ['Konnichiwa! Glad to connect with you.', 'I am learning English too!'] },
    { email: 'emma.dupont@example.com', msgs: ['Bonjour Bé Khót! How is your day going?'] },
  ];

  for (const partnerData of chatPartners) {
    const partner = createdUsers[partnerData.email];
    if (!partner || !mainUser) continue;

    // Create mutual match
    let match = await prisma.match.findFirst({
      where: {
        OR: [
          { memberId: mainUser.id, candidateId: partner.id },
          { memberId: partner.id, candidateId: mainUser.id },
        ],
      },
    });

    if (!match) {
      match = await prisma.match.create({
        data: {
          memberId: mainUser.id,
          candidateId: partner.id,
          status: MatchStatus.mutual,
        },
      });
    } else {
      await prisma.match.update({
        where: { id: match.id },
        data: { status: MatchStatus.mutual },
      });
    }

    // Create Conversation
    let conversation = await prisma.conversation.findUnique({
      where: { matchId: match.id },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { matchId: match.id },
      });
    }

    // Create Messages
    for (const msgContent of partnerData.msgs) {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: partner.id,
          content: msgContent,
          type: MessageType.text,
        },
      });
    }
  }

  console.log('✅ Complete DB seed finished successfully!');
  console.log(`- Total ${Object.keys(createdUsers).length} active member accounts created.`);
  console.log('- Matches, Conversations & Chat Messages populated.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
