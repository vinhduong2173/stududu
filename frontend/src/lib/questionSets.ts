// Kiểu dữ liệu chung cho bộ đề trắc nghiệm & thử thách community.
// Khớp response của backend/src/modules/question-sets.

export type QuestionTypeValue = "vocabulary" | "grammar" | "cloze" | "reading";

export const QUESTION_TYPES: { value: QuestionTypeValue; label: string }[] = [
  { value: "vocabulary", label: "Từ vựng" },
  { value: "grammar", label: "Ngữ pháp" },
  { value: "cloze", label: "Điền từ" },
  { value: "reading", label: "Đọc hiểu" },
];

export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export const JLPT_LEVELS = ["N5", "N4", "N3", "N2", "N1"] as const;
export const HSK_LEVELS = ["HSK 1", "HSK 2", "HSK 3", "HSK 4", "HSK 5", "HSK 6"] as const;
export const TOPIK_LEVELS = ["TOPIK 1", "TOPIK 2", "TOPIK 3", "TOPIK 4", "TOPIK 5", "TOPIK 6"] as const;

export const FRAMEWORKS = ["CEFR", "JLPT", "HSK", "TOPIK"] as const;

export type FrameworkType = (typeof FRAMEWORKS)[number];

export function getLevelsForFramework(framework: string): string[] {
  switch (framework.toUpperCase()) {
    case "JLPT":
      return [...JLPT_LEVELS];
    case "HSK":
      return [...HSK_LEVELS];
    case "TOPIK":
      return [...TOPIK_LEVELS];
    case "CEFR":
    default:
      return [...CEFR_LEVELS];
  }
}

export function getDefaultFrameworkForLanguage(langCodeOrName?: string | null): {
  framework: FrameworkType;
  defaultLevel: string;
  levels: string[];
} {
  if (!langCodeOrName) {
    return { framework: "CEFR", defaultLevel: "A1", levels: [...CEFR_LEVELS] };
  }
  const norm = langCodeOrName.toLowerCase().trim();
  if (norm === "ja" || norm.includes("nhật") || norm.includes("japanese") || norm.includes("日本語")) {
    return { framework: "JLPT", defaultLevel: "N5", levels: [...JLPT_LEVELS] };
  }
  if (norm === "zh" || norm.includes("trung") || norm.includes("chinese") || norm.includes("中文")) {
    return { framework: "HSK", defaultLevel: "HSK 1", levels: [...HSK_LEVELS] };
  }
  if (norm === "ko" || norm.includes("hàn") || norm.includes("korean") || norm.includes("한국어")) {
    return { framework: "TOPIK", defaultLevel: "TOPIK 1", levels: [...TOPIK_LEVELS] };
  }
  return { framework: "CEFR", defaultLevel: "A1", levels: [...CEFR_LEVELS] };
}

/** Số câu bắt buộc để publish — khớp REQUIRED_QUESTION_COUNT ở backend */
export const REQUIRED_QUESTION_COUNT = 20;

export type VocabTopic = { id: number; name: string; hidden: boolean };

export type LanguageRef = { id: number; code: string; name: string };

export type TestQuestion = {
  id: number;
  setId: number;
  orderIndex: number;
  type: QuestionTypeValue;
  term: string | null;
  passage: string | null;
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string | null;
  status: "active" | "retired";
  source: "manual" | "ai_generated";
  sourceMeta: Record<string, unknown> | null;
};

export type QuestionSetSummary = {
  id: number;
  title: string;
  description: string | null;
  framework: string;
  level: string;
  levelOrder: number;
  status: "draft" | "published" | "archived";
  questionCount: number;
  timePerQuestionSec?: number;
  maxAttempts?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  publishedAt: string | null;
  language: LanguageRef;
  topic: { id: number; name: string };
  _count?: { questions: number };
};

export type QuestionSetDetail = QuestionSetSummary & {
  questions: TestQuestion[];
};

export type PublishGate = {
  requiredCount: number;
  activeCount: number;
  hasEnoughQuestions: boolean;
  hasAdminTrial: boolean;
  /** Có làm thử rồi nhưng bộ đề đã đổi câu sau đó → lượt cũ hết hiệu lực */
  trialOutdated: boolean;
  adminTrial: { id: number; correctCount: number; totalCount: number; finishedAt: string } | null;
  canPublish: boolean;
};

/** Một dòng trong bảng xem trước — dùng chung cho câu AI sinh và câu nhập tay */
export type DryRunRow = {
  index: number;
  valid: boolean;
  errors: string[];
  question: {
    type: QuestionTypeValue;
    term: string | null;
    passage: string | null;
    prompt: string;
    options: string[];
    answerIndex: number;
    explanation: string | null;
  } | null;
  raw: Record<string, unknown>;
};

export type DryRunResponse = {
  total: number;
  validCount: number;
  errorCount: number;
  rows: DryRunRow[];
  sourceMeta: Record<string, unknown>;
  truncated: boolean;
};

// ----- Phía người học -----

export type LearnerSet = QuestionSetSummary & {
  lastAttempt: { correctCount: number; totalCount: number; finishedAt: string } | null;
};

export type DailyQuota = {
  limit: number;
  used: number;
  remaining: number;
  resetsAt: string;
  exempt: boolean;
};

export type AttemptStart = {
  attemptId: number;
  startedAt: string;
  set: {
    id: number;
    title: string;
    framework: string;
    level: string;
    timePerQuestionSec?: number;
    language: LanguageRef;
    topic: { id: number; name: string };
  };
  questions: {
    id: number;
    position: number;
    type: QuestionTypeValue;
    term: string | null;
    passage: string | null;
    prompt: string;
    options: string[];
    answerIndex?: number;
  }[];
};

export type AttemptResult = {
  attemptId: number;
  correctCount: number;
  totalCount: number;
  durationSec: number;
  levelHint: "up" | "down" | "stay";
  review: {
    questionId: number;
    chosenIndex: number | null;
    answerIndex: number;
    isCorrect: boolean;
    explanation: string | null;
    term: string | null;
    options: string[];
  }[];
};

export type AttemptHistoryItem = {
  id: number;
  correctCount: number;
  totalCount: number;
  startedAt: string;
  finishedAt: string;
  set: {
    id: number;
    title: string;
    level: string;
    framework: string;
    topic: { id: number; name: string };
  };
  challenge: { id: number; title: string } | null;
};

// ----- Thử thách community -----

export type Challenge = {
  id: number;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  setId: number;
  phase: "upcoming" | "running" | "ended";
  participantCount: number;
  set: {
    id: number;
    title: string;
    level: string;
    framework: string;
    questionCount: number;
    language: LanguageRef;
    topic: { id: number; name: string };
  };
  myAttempt: {
    id: number;
    correctCount: number;
    totalCount: number;
    startedAt: string;
    finishedAt: string | null;
    durationSec: number | null;
  } | null;
};

export type LeaderboardEntry = {
  rank: number;
  userId: number;
  displayName: string;
  avatarUrl: string | null;
  correctCount: number;
  totalCount: number;
  durationSec: number;
  finishedAt: string;
};

export type Leaderboard = {
  challenge: {
    id: number;
    title: string;
    description: string | null;
    startsAt: string;
    endsAt: string;
    set: { id: number; title: string; level: string; framework: string };
  };
  entries: LeaderboardEntry[];
  myRank: LeaderboardEntry | null;
};

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatDateInput(dateStr?: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return isNaN(d.getTime())
    ? ""
    : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function parseIsoDate(dateStr?: string | null, isEnd = false): string | null {
  if (!dateStr?.trim()) return null;
  const parts = dateStr.trim().split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  const [y, m, d] = parts;
  return new Date(y, m - 1, d, isEnd ? 23 : 0, isEnd ? 59 : 0, isEnd ? 59 : 0).toISOString();
}

/**
 * Kết quả chấm trả `answerIndex` theo thứ tự GỐC của câu hỏi, còn màn làm bài đang
 * render theo thứ tự ĐÃ ĐẢO — nên phải dò lại vị trí theo nội dung đáp án.
 * Dò theo nội dung là an toàn: validator đã cấm hai đáp án trùng nhau trong một câu.
 */
export function displayIndexOfCorrect(
  displayedOptions: string[],
  review?: { options: string[]; answerIndex: number } | null,
): number | null {
  if (!review) return null;
  const correctText = review.options[review.answerIndex];
  if (correctText === undefined) return null;
  const index = displayedOptions.indexOf(correctText);
  return index >= 0 ? index : null;
}

