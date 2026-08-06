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

/**
 * Chỉ CEFR. Khung trình độ riêng theo ngôn ngữ (HSK/JLPT/TOPIK) nằm trong danh sách
 * "việc KHÔNG làm" của AGENTS.md mục 7 — cột `framework` để mở sẵn cho sau này,
 * nhưng cho chọn bây giờ chỉ tạo ra dữ liệu vô nghĩa kiểu "JLPT A1" vì thang trình
 * độ và `levelOrder` ở backend đều đang theo CEFR.
 */
export const FRAMEWORKS = ["CEFR"] as const;

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
