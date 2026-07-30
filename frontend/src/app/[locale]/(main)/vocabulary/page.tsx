"use client";

import * as React from "react";
import {
  BookOpen,
  ChevronRight,
  RotateCw,
  Search,
  Trash2,
  Volume2,
  Sparkles,
  Check,
  X,
  Trophy,
  Award,
  HelpCircle,
  Brain,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { type SavedWord } from "@/components/features/WordSaveModal";
import { useToast } from "@/components/features/TrustDialogs";
import { cn } from "@/lib/utils";

// Web Speech API helper for TTS audio pronunciation
const speakWord = (text: string, langCode: string = "en-US") => {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const code = langCode.toLowerCase();
    utterance.lang = code.includes("vi")
      ? "vi-VN"
      : code.includes("fr")
      ? "fr-FR"
      : code.includes("ja")
      ? "ja-JP"
      : "en-US";
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  }
};

// Helper to shuffle array randomly
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// LocalStorage persistence helpers for vocabulary statuses
const LOCAL_STATUS_KEY = "stududu_vocab_word_statuses";

function getStoredWordStatuses(): Record<number, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LOCAL_STATUS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveWordStatusToStorage(id: number, status: string) {
  if (typeof window === "undefined") return;
  try {
    const current = getStoredWordStatuses();
    current[id] = status;
    localStorage.setItem(LOCAL_STATUS_KEY, JSON.stringify(current));
  } catch (err) {
    console.error(err);
  }
}

// Rich Vietnamese distractors pool for quiz (natural, meaningful vocabulary definitions)
const FALLBACK_DISTRACTORS = [
  "Sự kiên trì và nỗ lực bền bỉ",
  "Tình cờ phát hiện ra điều may mắn",
  "Khả năng thích ứng với hoàn cảnh mới",
  "Nguồn cảm hứng sáng tạo dồi dào",
  "Sự đồng cảm và thấu hiểu sâu sắc",
  "Thành tựu xuất sắc nổi bật",
  "Sự tập trung cao độ vào mục tiêu",
  "Sự bộc phát năng lượng tích cực",
  "Tạo ra ảnh hưởng sâu rộng và tích cực",
  "Phương pháp tư duy logic sáng tạo",
  "Sự chu đáo và tỉ mỉ trong từng chi tiết",
  "Tầm nhìn chiến lược dài hạn",
  "Cơ sở và nền móng vững chắc",
  "Sự mỉa mai và trớ trêu bất ngờ",
  "Hoàng hôn và cảnh vật chạng vạng",
  "Khả năng phục hồi tinh thần nhanh chóng",
  "Sự hòa đồng và thân thiện với mọi người",
  "Thực tế và có tính ứng dụng cao",
];

// Clean dynamic semantic fallback generator when API translation is pending or unavailable
function formatCleanFallbackDefinition(wordItem: SavedWord): string {
  const pos = (wordItem.word.partOfSpeech || "").toLowerCase();

  if (pos.includes("danh") || pos.includes("noun")) {
    return "Khái niệm và thuật ngữ đặc trưng";
  }
  if (pos.includes("tính") || pos.includes("adj")) {
    return "Có đặc điểm và tính chất nổi bật";
  }
  if (pos.includes("động") || pos.includes("verb")) {
    return "Hành động tác động và phát triển";
  }

  return "Định nghĩa và ý nghĩa cốt lõi";
}

type MainTab = "quiz" | "notebook";
type ReviewMode = "learning_only" | "all";
type ListFilterType = "all" | "new" | "learning" | "mastered";

export default function VocabularyPage() {
  const { show: showToast, toast } = useToast();
  const [words, setWords] = React.useState<SavedWord[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Dynamic async translation cache (wordId -> Vietnamese definition)
  const [translatedDefsMap, setTranslatedDefsMap] = React.useState<Record<number, string>>({});

  // Main Navigation Tabs: "quiz" (Làm Quiz Ôn Tập) or "notebook" (Sổ Từ Vựng)
  const [activeTab, setActiveTab] = React.useState<MainTab>("quiz");

  // Review Deck State
  const [reviewMode, setReviewMode] = React.useState<ReviewMode>("learning_only");
  const [deck, setDeck] = React.useState<SavedWord[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const deckInitializedRef = React.useRef(false);

  // Quiz State
  const [quizOptions, setQuizOptions] = React.useState<string[]>([]);
  const [selectedOption, setSelectedOption] = React.useState<string | null>(null);
  const [isAnswered, setIsAnswered] = React.useState<boolean>(false);
  const [score, setScore] = React.useState<number>(0);
  const [quizCompleted, setQuizCompleted] = React.useState<boolean>(false);
  const [streak, setStreak] = React.useState<number>(0);

  // Saved Words List Filters (Notebook Tab)
  const [listFilter, setListFilter] = React.useState<ListFilterType>("all");
  const [search, setSearch] = React.useState("");
  const [selectedWordId, setSelectedWordId] = React.useState<number | null>(null);

  // Resolve clean Vietnamese definition for any given SavedWord dynamically
  const getVietnameseDefinition = React.useCallback(
    (wordItem: SavedWord): string => {
      if (translatedDefsMap[wordItem.id]) {
        return translatedDefsMap[wordItem.id];
      }

      if (
        wordItem.personalNote &&
        /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(
          wordItem.personalNote,
        )
      ) {
        return wordItem.personalNote.trim();
      }

      const def = wordItem.word.definition || "";
      if (
        def &&
        /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(def)
      ) {
        return def.trim();
      }

      return formatCleanFallbackDefinition(wordItem);
    },
    [translatedDefsMap],
  );

  // Dynamic Translation Pipeline: Pre-fetches translations for ANY new English terms via API
  const ensureVietnameseTranslations = React.useCallback(async (wordList: SavedWord[]) => {
    const newMap: Record<number, string> = {};
    const unmappedWords: SavedWord[] = [];

    for (const item of wordList) {
      const personalNote = item.personalNote?.trim() || "";
      const rawDef = item.word.definition?.trim() || "";

      if (
        personalNote &&
        /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(
          personalNote,
        )
      ) {
        newMap[item.id] = personalNote;
      } else if (
        rawDef &&
        /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(
          rawDef,
        )
      ) {
        newMap[item.id] = rawDef;
      } else {
        unmappedWords.push(item);
      }
    }

    setTranslatedDefsMap(newMap);

    if (unmappedWords.length > 0) {
      const results = await Promise.allSettled(
        unmappedWords.map(async (item) => {
          try {
            const res = await api<{ translation: string }>("/translate", {
              method: "POST",
              body: { text: item.word.term, source: "auto", target: "vi" },
            });
            if (res?.translation) {
              return { id: item.id, translation: res.translation };
            }
          } catch {
            // Silently fall back
          }
          return null;
        }),
      );

      setTranslatedDefsMap((prev) => {
        const updated = { ...prev };
        for (const res of results) {
          if (res.status === "fulfilled" && res.value) {
            updated[res.value.id] = res.value.translation;
          }
        }
        return updated;
      });
    }
  }, []);

  // Fetch saved words from API & merge persistent localStorage statuses
  const loadWords = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<SavedWord[]>("/vocabulary/my-words");
      const localStatuses = getStoredWordStatuses();

      // Merge client-side persisted statuses with backend data
      const mergedWords = data.map((w) => {
        const storedStatus = localStatuses[w.id];
        return storedStatus ? { ...w, status: storedStatus } : w;
      });

      setWords(mergedWords);
      void ensureVietnameseTranslations(mergedWords);
    } catch (err) {
      console.error("Failed to load words:", err);
    } finally {
      setLoading(false);
    }
  }, [ensureVietnameseTranslations]);

  React.useEffect(() => {
    void loadWords();
  }, [loadWords]);

  // Build review deck whenever mode changes or on initial load
  const initReviewDeck = React.useCallback(
    (mode: ReviewMode, currentWords: SavedWord[]) => {
      let target = currentWords;
      if (mode === "learning_only") {
        target = currentWords.filter((w) => w.status !== "mastered");
      }
      const shuffled = shuffleArray(target);
      setDeck(shuffled);
      setCurrentIndex(0);
      setScore(0);
      setQuizCompleted(false);
      setSelectedOption(null);
      setIsAnswered(false);
      setStreak(0);
    },
    [],
  );

  // Initialize deck ONCE when words load
  React.useEffect(() => {
    if (words.length > 0 && !deckInitializedRef.current) {
      initReviewDeck(reviewMode, words);
      deckInitializedRef.current = true;
    } else if (words.length === 0) {
      setDeck([]);
      setCurrentIndex(0);
    }
  }, [words, reviewMode, initReviewDeck]);

  // Generate 4 Quiz options in Vietnamese (1 correct answer + 3 distractors)
  const generateOptionsForWord = React.useCallback(
    (targetWord: SavedWord, allWords: SavedWord[]): string[] => {
      const correctDef = getVietnameseDefinition(targetWord);

      const candidateDefs = allWords
        .filter((w) => w.id !== targetWord.id)
        .map((w) => getVietnameseDefinition(w))
        .filter(
          (def) =>
            def.trim() !== "" &&
            def !== correctDef &&
            !def.startsWith("Khái niệm và") &&
            !def.startsWith("Định nghĩa và"),
        );

      const uniqueCandidates = Array.from(new Set(candidateDefs));

      const needed = 3;
      const distractors: string[] = [];

      const shuffledCandidates = shuffleArray(uniqueCandidates);
      for (const cand of shuffledCandidates) {
        if (distractors.length < needed && !distractors.includes(cand)) {
          distractors.push(cand);
        }
      }

      if (distractors.length < needed) {
        const shuffledFallbacks = shuffleArray(FALLBACK_DISTRACTORS);
        for (const fallback of shuffledFallbacks) {
          if (
            distractors.length < needed &&
            fallback !== correctDef &&
            !distractors.includes(fallback)
          ) {
            distractors.push(fallback);
          }
        }
      }

      return shuffleArray([correctDef, ...distractors]);
    },
    [getVietnameseDefinition],
  );

  // Active word in current quiz
  const activeQuizWord = deck[currentIndex] || null;
  const activeQuizWordId = activeQuizWord?.id;

  // Prepare Quiz options dynamically whenever active word OR translations load (ONLY if question not answered yet)
  React.useEffect(() => {
    if (activeQuizWord && words.length > 0 && !isAnswered) {
      const opts = generateOptionsForWord(activeQuizWord, words);
      setQuizOptions(opts);
    }
  }, [activeQuizWordId, words, generateOptionsForWord, translatedDefsMap, isAnswered]);

  // Move to next question or complete quiz
  const handleNextQuestion = React.useCallback(() => {
    if (currentIndex + 1 < deck.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setQuizCompleted(true);
    }
  }, [currentIndex, deck.length]);

  // Handle deck mode toggle with shuffle
  const handleModeChange = (newMode: ReviewMode) => {
    setReviewMode(newMode);
    initReviewDeck(newMode, words);
  };

  // Stats calculation
  const totalCount = words.length;
  const masteredCount = words.filter((w) => w.status === "mastered").length;
  const learningCount = totalCount - masteredCount;

  // Option selection handler: Saves status to localStorage & backend
  const handleSelectOption = async (option: string) => {
    if (isAnswered || !activeQuizWord) return;

    setSelectedOption(option);
    setIsAnswered(true);

    const correctDef = getVietnameseDefinition(activeQuizWord);
    const isCorrect =
      option.trim().toLowerCase() === correctDef.trim().toLowerCase();

    if (isCorrect) {
      setScore((prev) => prev + 1);
      setStreak((prev) => prev + 1);
      const targetId = activeQuizWord.id;

      // 1. Save to LocalStorage for persistence across tab navigation
      saveWordStatusToStorage(targetId, "mastered");

      // 2. Optimistic UI update for word status
      setWords((prev) =>
        prev.map((w) => (w.id === targetId ? { ...w, status: "mastered" } : w)),
      );

      // 3. API update for backend
      try {
        await api(`/vocabulary/my-words/${targetId}/status`, {
          method: "PATCH",
          body: { status: "mastered" },
        });
      } catch {
        // Fallback gracefully
      }
    } else {
      setStreak(0);
    }
  };

  // Restart Quiz round
  const handleRestartQuiz = () => {
    initReviewDeck(reviewMode, words);
  };

  // Delete word handler
  const handleDeleteWord = async (id: number, term: string) => {
    setWords((prev) => prev.filter((w) => w.id !== id));

    if (typeof window !== "undefined") {
      try {
        const current = getStoredWordStatuses();
        delete current[id];
        localStorage.setItem(LOCAL_STATUS_KEY, JSON.stringify(current));
      } catch {}
    }

    try {
      await api(`/vocabulary/my-words/${id}`, { method: "DELETE" });
      showToast(`Đã xóa "${term}" khỏi sổ từ vựng.`);
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered words for Notebook tab list
  const filteredWords = words.filter((w) => {
    const matchesSearch =
      !search ||
      w.word.term.toLowerCase().includes(search.toLowerCase()) ||
      (w.word.definition ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (w.personalNote ?? "").toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (listFilter === "mastered") return w.status === "mastered";
    if (listFilter === "learning") return w.status === "learning" || w.status === "new" || !w.status;
    if (listFilter === "new") return w.source === "manual" || w.status === "new";
    return true;
  });

  // Calculate Quiz Final Score & Rank
  const totalQuestions = deck.length;
  const earnedPoints = score * 10;
  const maxPossiblePoints = totalQuestions * 10;
  const accuracyPercent = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  const getRankBadge = (acc: number) => {
    if (acc >= 90) return { title: "Xuất Sắc! 🌟", color: "text-amber-500 bg-amber-500/10 border-amber-500/30" };
    if (acc >= 70) return { title: "Giỏi! 👏", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30" };
    if (acc >= 50) return { title: "Khá! 👍", color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/30" };
    return { title: "Cần Cố Gắng! 💡", color: "text-rose-500 bg-rose-500/10 border-rose-500/30" };
  };

  const rankInfo = getRankBadge(accuracyPercent);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-8 pb-24 space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-6 rounded-3xl border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-1">
            <BookOpen className="w-4 h-4" /> HỌC TỪ VỰNG TRẮC NGHIỆM
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
            Sổ từ vựng & Quiz
          </h1>
          <p className="text-sm text-muted mt-1">
            Ôn tập trắc nghiệm nghĩa tiếng Việt và quản lý sổ từ vựng cá nhân của bạn.
          </p>
        </div>

        {/* TOP RIGHT STATS COUNTERS */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="bg-muted/10 border border-border rounded-2xl px-5 py-3 text-center min-w-[84px]">
            <div className="text-2xl font-black text-foreground">{totalCount}</div>
            <div className="text-[11px] font-semibold text-muted">Tổng từ</div>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-5 py-3 text-center min-w-[84px]">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {masteredCount}
            </div>
            <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              Đã thuộc
            </div>
          </div>
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl px-5 py-3 text-center min-w-[84px]">
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {learningCount}
            </div>
            <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
              Cần ôn
            </div>
          </div>
        </div>
      </div>

      {/* MAIN TABS SWITCHER: LÀM QUIZ ÔN TẬP VS SỔ TỪ VỰNG (2 TAB RIÊNG BIỆT) */}
      <div className="flex items-center bg-surface p-1.5 rounded-2xl border border-border shadow-sm">
        <button
          onClick={() => setActiveTab("quiz")}
          className={cn(
            "flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
            activeTab === "quiz"
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-muted hover:text-foreground hover:bg-muted/10",
          )}
        >
          <Brain className="w-4 h-4" /> 🎯 Ôn Tập Quiz
        </button>
        <button
          onClick={() => setActiveTab("notebook")}
          className={cn(
            "flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
            activeTab === "notebook"
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-muted hover:text-foreground hover:bg-muted/10",
          )}
        >
          <BookOpen className="w-4 h-4" /> 📚 Sổ Từ Vựng ({totalCount})
        </button>
      </div>

      {/* TAB 1: LÀM QUIZ ÔN TẬP (HOÀN TOÀN TÁCH BIỆT NỘI DUNG SỔ TỪ) */}
      {activeTab === "quiz" && (
        <div className="space-y-4">
          {/* REVIEW MODE TOGGLE TABS */}
          <div className="flex items-center justify-between bg-surface p-1.5 rounded-2xl border border-border shadow-sm">
            <div className="flex gap-1 w-full">
              <button
                onClick={() => handleModeChange("learning_only")}
                className={cn(
                  "flex-1 py-2 px-3 rounded-xl text-xs md:text-sm font-bold transition-all text-center flex items-center justify-center gap-1.5",
                  reviewMode === "learning_only"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-muted hover:text-foreground hover:bg-muted/10",
                )}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Ôn từ chưa thuộc ({learningCount})
              </button>
              <button
                onClick={() => handleModeChange("all")}
                className={cn(
                  "flex-1 py-2 px-3 rounded-xl text-xs md:text-sm font-bold transition-all text-center flex items-center justify-center gap-1.5",
                  reviewMode === "all"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-muted hover:text-foreground hover:bg-muted/10",
                )}
              >
                <RotateCw className="w-3.5 h-3.5" />
                Ôn toàn bộ ({totalCount})
              </button>
            </div>
          </div>

          {loading ? (
            <div className="h-96 rounded-3xl bg-muted/10 animate-pulse flex items-center justify-center text-muted text-sm">
              Đang tải dữ liệu Quiz...
            </div>
          ) : quizCompleted ? (
            /* QUIZ SCORE COMPLETION CARD (HIỂN THỊ ĐIỂM SỐ & XẾP LOẠI CHI TIẾT) */
            <div className="rounded-3xl bg-surface border-2 border-border shadow-xl p-6 md:p-10 text-center space-y-6 animate-in zoom-in-95 duration-300">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-amber-400 to-amber-200 flex items-center justify-center shadow-lg text-amber-950">
                <Trophy className="w-12 h-12 animate-bounce" />
              </div>

              <div className="space-y-1">
                <span className={cn("inline-block px-4 py-1.5 rounded-full text-xs font-black border uppercase tracking-wider mb-2", rankInfo.color)}>
                  {rankInfo.title}
                </span>
                <h2 className="text-3xl md:text-4xl font-black text-foreground">
                  Kết Quả Lượt Quiz
                </h2>
                <p className="text-sm text-muted">
                  Bạn đã hoàn thành lượt ôn tập với bộ {totalQuestions} câu hỏi.
                </p>
              </div>

              {/* DETAILED SCORE SUMMARY BOARD */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mx-auto pt-2">
                <div className="bg-gradient-to-br from-primary/10 to-indigo-500/10 border border-primary/20 p-5 rounded-2xl text-center shadow-sm">
                  <div className="flex items-center justify-center gap-1 text-primary text-xs font-bold uppercase mb-1">
                    <Zap className="w-3.5 h-3.5" /> Tổng Điểm
                  </div>
                  <div className="text-3xl font-black text-primary">
                    {earnedPoints} <span className="text-xs text-muted font-normal">/ {maxPossiblePoints}</span>
                  </div>
                  <div className="text-[11px] text-muted mt-1 font-semibold">+10 điểm / câu đúng</div>
                </div>

                <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl text-center shadow-sm">
                  <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Câu Đúng
                  </div>
                  <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                    {score} <span className="text-xs text-muted font-normal">/ {totalQuestions}</span>
                  </div>
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-1 font-semibold">
                    Đã chuyển Đã thuộc
                  </div>
                </div>

                <div className="bg-indigo-500/10 border border-indigo-500/20 p-5 rounded-2xl text-center shadow-sm">
                  <div className="flex items-center justify-center gap-1 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase mb-1">
                    <Award className="w-3.5 h-3.5" /> Tỷ Lệ Đúng
                  </div>
                  <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                    {accuracyPercent}%
                  </div>
                  <div className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-1 font-semibold">
                    Độ chính xác
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <Button
                  onClick={handleRestartQuiz}
                  className="rounded-2xl h-12 px-6 font-bold shadow-md bg-primary text-primary-foreground hover:opacity-90"
                >
                  <RotateCw className="w-4 h-4 mr-2" /> Bắt đầu lượt Quiz mới
                </Button>
                <Button
                  onClick={() => setActiveTab("notebook")}
                  variant="outline"
                  className="rounded-2xl h-12 px-6 font-bold border-border"
                >
                  <BookOpen className="w-4 h-4 mr-2" /> Xem Sổ Từ Vựng
                </Button>
              </div>
            </div>
          ) : deck.length > 0 && activeQuizWord ? (
            /* ACTIVE QUIZ QUESTION CARD */
            <div className="rounded-3xl bg-surface border-2 border-border shadow-lg p-6 md:p-8 space-y-6 relative overflow-hidden">
              {/* TOP QUIZ BAR: PROGRESS, SCORE & STREAK */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-muted flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-primary" /> Câu {currentIndex + 1} / {deck.length}
                  </span>

                  <div className="flex items-center gap-3">
                    <span className="text-primary font-black bg-primary/10 px-3 py-1 rounded-full text-xs">
                      ⚡ {score * 10} điểm
                    </span>

                    {streak > 1 && (
                      <span className="bg-amber-500/15 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-full flex items-center gap-1 text-[11px] font-extrabold animate-pulse">
                        🔥 Chuỗi {streak}!
                      </span>
                    )}

                    <span
                      className={cn(
                        "font-bold px-3 py-1 rounded-full text-[11px]",
                        activeQuizWord.status === "mastered"
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
                      )}
                    >
                      {activeQuizWord.status === "mastered" ? "Đã thuộc" : "Đang học"}
                    </span>
                  </div>
                </div>

                {/* PROGRESS BAR */}
                <div className="h-2 w-full bg-muted/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary via-indigo-500 to-emerald-500 transition-all duration-300 rounded-full"
                    style={{
                      width: `${((currentIndex + 1) / deck.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* TARGET WORD BOX */}
              <div className="text-center py-5 bg-muted/5 rounded-2xl border border-border/60 p-4 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-muted">
                  {activeQuizWord.word.language?.name || "ENGLISH"}
                </div>
                <div className="flex items-center justify-center gap-3">
                  <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
                    {activeQuizWord.word.term}
                  </h2>
                  <button
                    type="button"
                    onClick={() =>
                      speakWord(
                        activeQuizWord.word.term,
                        activeQuizWord.word.language?.code || "en",
                      )
                    }
                    className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors active:scale-95"
                    title="Nghe phát âm"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-sm font-semibold text-rose-500">
                  {activeQuizWord.word.phonetic || "/ˌser.ənˈdɪp.ə.ti/"}
                  {activeQuizWord.word.partOfSpeech && (
                    <span className="text-muted"> · {activeQuizWord.word.partOfSpeech}</span>
                  )}
                </p>

                <p className="text-xs text-muted font-medium pt-1">
                  👉 Chọn 1 đáp án nghĩa tiếng Việt đúng nhất ở bên dưới:
                </p>
              </div>

              {/* 4 MULTIPLE CHOICE OPTIONS GRID */}
              <div className="grid grid-cols-1 gap-3">
                {quizOptions.map((opt, idx) => {
                  const correctDef = getVietnameseDefinition(activeQuizWord);
                  const isThisCorrect =
                    opt.trim().toLowerCase() === correctDef.trim().toLowerCase();
                  const isThisSelected = selectedOption === opt;

                  let optionStyle =
                    "border-border bg-surface hover:border-primary/50 hover:bg-muted/10 text-foreground";
                  let optionIcon = null;

                  if (isAnswered) {
                    if (isThisSelected && isThisCorrect) {
                      optionStyle =
                        "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/30 font-bold";
                      optionIcon = <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />;
                    } else if (isThisSelected && !isThisCorrect) {
                      optionStyle =
                        "border-rose-500 bg-rose-500/15 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/30 font-bold";
                      optionIcon = <X className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />;
                    } else if (!isThisSelected && isThisCorrect) {
                      optionStyle =
                        "border-emerald-500/60 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold";
                      optionIcon = <Check className="w-5 h-5 text-emerald-500 shrink-0" />;
                    } else {
                      optionStyle = "border-border/40 bg-surface/50 text-muted opacity-50";
                    }
                  }

                  const labels = ["A", "B", "C", "D"];

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isAnswered}
                      onClick={() => void handleSelectOption(opt)}
                      className={cn(
                        "w-full p-4 rounded-2xl border-2 text-left text-sm transition-all duration-200 flex items-center justify-between gap-3 group active:scale-[0.99]",
                        optionStyle,
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-7 h-7 rounded-xl bg-muted/20 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                          {labels[idx]}
                        </span>
                        <span className="font-medium leading-snug">{opt}</span>
                      </div>
                      {optionIcon}
                    </button>
                  );
                })}
              </div>

              {/* FOOTER ACTION: NEXT QUESTION BUTTON */}
              {isAnswered && (
                <div className="pt-2 flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <Button
                    onClick={handleNextQuestion}
                    className="rounded-2xl h-12 px-6 font-bold shadow-md bg-gradient-to-r from-primary to-indigo-600 text-white hover:opacity-95"
                  >
                    {currentIndex + 1 < deck.length ? "Câu tiếp theo" : "Xem điểm số Quiz"}{" "}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          ) : (
            /* EMPTY DECK STATE */
            <div className="min-h-[320px] rounded-3xl bg-surface border border-border shadow-sm p-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="text-5xl">🎉</div>
              <h3 className="text-xl font-extrabold text-foreground">
                {reviewMode === "learning_only"
                  ? "Bạn đã thuộc hết các từ cần ôn!"
                  : "Chưa có từ vựng nào trong sổ!"}
              </h3>
              <p className="text-sm text-muted max-w-xs">
                {reviewMode === "learning_only"
                  ? "Tuyệt vời! Bạn có thể chuyển sang chế độ Ôn toàn bộ để củng cố lại kiến thức."
                  : "Hãy thêm từ mới vào sổ tay bằng cách bôi đen khi dịch hoặc chat nhé."}
              </p>
              {reviewMode === "learning_only" && (
                <Button onClick={() => handleModeChange("all")} variant="ghost">
                  Ôn toàn bộ từ vựng ({totalCount})
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SỔ TỪ VỰNG (TRANG ĐẬP TRUNG XEM & QUẢN LÝ DẠNG SỔ TAY) */}
      {activeTab === "notebook" && (
        <div className="bg-surface rounded-3xl border border-border shadow-sm p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <h2 className="font-extrabold text-xl text-foreground">Sổ Từ Vựng Cá Nhân</h2>
              <p className="text-xs text-muted mt-0.5">Danh sách toàn bộ các từ đã lưu, bôi đen dịch hoặc học trong chat.</p>
            </div>
            <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full self-start sm:self-auto">
              Tổng số: {filteredWords.length} từ
            </span>
          </div>

          {/* LIST FILTER TABS & SEARCH */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
              {(["all", "new", "learning", "mastered"] as const).map((filterKey) => (
                <button
                  key={filterKey}
                  onClick={() => setListFilter(filterKey)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all border",
                    listFilter === filterKey
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-surface text-muted border-border hover:border-primary/30",
                  )}
                >
                  {filterKey === "all" && "Tất cả"}
                  {filterKey === "new" && "Mới"}
                  {filterKey === "learning" && "Đang học"}
                  {filterKey === "mastered" && "Đã thuộc"}
                </button>
              ))}
            </div>

            {/* SEARCH INPUT */}
            <div className="relative min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm kiếm từ vựng..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 rounded-2xl border border-border bg-muted/5 pl-10 pr-4 text-xs focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* WORD ITEMS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
            {filteredWords.length > 0 ? (
              filteredWords.map((item) => {
                const viDef = getVietnameseDefinition(item);

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 group hover:border-primary/40 bg-surface border-border hover:bg-muted/5 shadow-sm",
                      selectedWordId === item.id && "ring-2 ring-primary/40",
                    )}
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-foreground text-base">
                          {item.word.term}
                        </span>
                        {item.word.partOfSpeech && (
                          <span className="text-xs italic text-muted">
                            {item.word.partOfSpeech}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            speakWord(
                              item.word.term,
                              item.word.language?.code || "en",
                            )
                          }
                          className="p-1 rounded-md text-muted hover:text-primary transition-colors"
                          title="Nghe phát âm"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                        <span
                          className={cn(
                            "text-[10px] font-bold rounded-full px-2.5 py-0.5 ml-auto",
                            item.status === "mastered"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20",
                          )}
                        >
                          {item.status === "mastered" ? "Đã thuộc" : "Đang học"}
                        </span>
                      </div>

                      <p className="text-sm font-semibold text-foreground/90">
                        {viDef}
                      </p>

                      {item.word.example && (
                        <p className="text-xs text-muted italic truncate">
                          &quot;{item.word.example}&quot;
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-[10px] text-muted pt-1">
                        <span className="bg-muted/20 px-2 py-0.5 rounded-md font-medium">
                          {item.word.language?.name || "GB English"}
                        </span>
                        <span>•</span>
                        <span>
                          Nguồn:{" "}
                          {item.source === "chat"
                            ? "Chat · Sarah"
                            : item.source === "manual"
                            ? "Sổ tay"
                            : "Cộng đồng"}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => void handleDeleteWord(item.id, item.word.term)}
                      className="opacity-0 group-hover:opacity-100 p-2 rounded-xl text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-all shrink-0"
                      title="Xóa từ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-16 text-center text-muted text-sm">
                Chưa tìm thấy từ vựng nào phù hợp trong sổ tay.
              </div>
            )}
          </div>
        </div>
      )}

      {toast}
    </div>
  );
}
