import { LanguageRole } from '@prisma/client';
import { SUGGESTIONS_MIN } from '../matching.service';

export interface CandidateWithRelations {
  id: number;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  intent: string | null;
  lastActive: Date | null;
  dob: Date | null;
  city: string | null;
  languages: { role: LanguageRole; level: string | null; language: any }[];
  interests: { topicId: number; topic: { name: string } }[];
}

export function scoreAndRankCandidates(
  me: { intent: string | null; matchPreference: { levelDesired: string | null } | null; interests: { topicId: number }[] },
  candidates: CandidateWithRelations[],
  likedMap: Map<number, { conversationId: number | null }>,
) {
  const myTopicIds = new Set(me.interests.map((i) => i.topicId));

  // MATCH_SCORE = lang_complement (chính) + shared_topic_count (phụ) + intent_alignment (cộng)
  const scored = candidates.map((c) => {
    const sharedTopicCount = c.interests.filter((i) =>
      myTopicIds.has(i.topicId),
    ).length;
    const intentAlignment = Boolean(
      me.intent && c.intent && me.intent === c.intent,
    );
    const total = 10 + sharedTopicCount + (intentAlignment ? 1 : 0);
    const likedInfo = likedMap.get(c.id);
    return {
      user: c,
      score: {
        langComplement: true,
        sharedTopicCount,
        intentAlignment,
        total,
      },
      liked: Boolean(likedInfo),
      conversationId: likedInfo?.conversationId ?? null,
      whyMatched: {
        sharedTopics: c.interests
          .filter((i) => myTopicIds.has(i.topicId))
          .map((i) => i.topic.name),
      },
    };
  });

  type Scored = (typeof scored)[number];

  // Bậc nới lỏng — dừng ngay khi gom đủ SUGGESTIONS_MIN
  const levelDesired = me.matchPreference?.levelDesired ?? null;
  const matchesLevel = (c: Scored) =>
    !levelDesired ||
    c.user.languages.some(
      (l) => l.role === LanguageRole.learning && l.level === levelDesired,
    );

  const tiers: ((c: Scored) => boolean)[] = [
    (c) => c.score.sharedTopicCount > 0 && matchesLevel(c),
    (c) => matchesLevel(c),
    () => true,
  ];

  const picked: Scored[] = [];
  const pickedIds = new Set<number>();
  for (const tier of tiers) {
    for (const c of scored) {
      if (pickedIds.has(c.user.id) || !tier(c)) continue;
      picked.push(c);
      pickedIds.add(c.user.id);
    }
    if (picked.length >= SUGGESTIONS_MIN) break;
  }

  const dropLastActiveOrdering = picked.length < SUGGESTIONS_MIN;
  picked.sort((a, b) => {
    const byScore = b.score.total - a.score.total;
    if (byScore !== 0 || dropLastActiveOrdering) return byScore;
    return (
      (b.user.lastActive?.getTime() ?? 0) -
      (a.user.lastActive?.getTime() ?? 0)
    );
  });

  return picked;
}
