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
import { useLocale, useTranslations } from "next-intl";

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
      : code.includes("zh")
      ? "zh-CN"
      : code.includes("es")
      ? "es-ES"
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

// Multi-language distractors pool matching user UI/native language (expanded to prevent repetition)
const FALLBACK_DISTRACTORS: Record<string, string[]> = {
  fr: [
    "Dynamisme et énergie positive au quotidien",
    "Inspiration créative abondante et constante",
    "Capacité d'adaptation rapide aux nouvelles situations",
    "Persévérance remarquable et effort continu",
    "Empathie profonde et compréhension mutuelle",
    "Réussite et accomplissement exceptionnel",
    "Concentration soutenue et précision absolue",
    "Impact positif và durable sur l'environnement",
    "Esprit d'équipe chaleureux et convivialité",
    "Vision stratégique à long terme et perspicacité",
    "Fondation solide et ancrage réconfortant",
    "Pragmatisme intelligent et sens du concret",
    "Créativité débordante et esprit d'innovation",
    "Calme intérieur et sérénité apaisante",
    "Raison d'être et motivation profonde",
    "Curiosité intellectuelle et désir d'apprendre",
    "Richesse d’expérience et maturité d’esprit",
    "Finesse d'esprit et intuition remarquable",
    "Harmonie subtile et équilibre parfait",
    "Engagement sincère et dévouement exemplaire",
    "Patience inébranlable et sérénité absolue",
    "Élan d’enthousiasme et passion communicative",
  ],
  en: [
    "Perseverance and continuous effort through challenges",
    "Abundant creative inspiration and innovative thinking",
    "Adaptability to new and complex environments",
    "Deep empathy and genuine mutual understanding",
    "Outstanding achievement and personal success",
    "High focus, clarity, and mental concentration",
    "Positive energy, enthusiasm, and warmth",
    "Strong, lasting, and meaningful impact",
    "Friendly, open, and sociable personality",
    "Long-term strategic vision and foresight",
    "Solid foundation, grounding, and stability",
    "Practicality, logic, and real-world application",
    "Quiet contentment, peace of mind, and calm",
    "Inner strength and resilience under pressure",
    "Spontaneous joy and delightful unexpected findings",
    "Thoughtful care and attention to subtle details",
    "Unwavering dedication to personal growth",
    "Authentic expression and clear communication",
    "Refined appreciation for beauty and quality",
    "Generous spirit and willingness to support others",
  ],
  vi: [
    "Sự kiên trì và nỗ lực bền bỉ vượt qua thử thách",
    "Nguồn cảm hứng sáng tạo dồi dào và độc đáo",
    "Khả năng thích ứng nhanh chóng với hoàn cảnh mới",
    "Sự đồng cảm, tinh tế và thấu hiểu sâu sắc",
    "Thành tựu xuất sắc nổi bật và đáng tự hào",
    "Sự tập trung cao độ và minh mẫn trong công việc",
    "Sự bộc phát năng lượng tích cực và nhiệt huyết",
    "Tạo ra ảnh hưởng sâu rộng, tích cực và lâu dài",
    "Sự hòa đồng, chân thành và thân thiện với mọi người",
    "Tầm nhìn chiến lược dài hạn và nhạy bén",
    "Cơ sở và nền móng vững chắc, đáng tin cậy",
    "Thực tế, logic và có tính ứng dụng cao",
    "Thái độ sống an nhiên, tự tại và bình yên",
    "Nghị lực sống phi thường và sự bền bỉ",
    "Niềm vui bất ngờ và sự may mắn tình cờ",
    "Sự chỉn chu, cẩn thận và tỉ mỉ trong từng chi tiết",
    "Khát vọng vươn lên và học hỏi không ngừng",
    "Sự gắn kết chân thành và tình cảm ấm áp",
    "Sự nhạy bén, thông minh và đọc vị tình huống tốt",
    "Nội lực mạnh mẽ và sự vững vàng tâm lý",
  ],
};

function getLanguageDisplayName(wordItem: SavedWord): string {
  if (wordItem.word.language?.name) {
    return wordItem.word.language.name;
  }

  const term = (wordItem.word.term || "").trim();
  if (/[぀-ヿ]/.test(term)) return "日本語";
  if (/[가-힯]/.test(term)) return "한국어";
  if (/[一-鿿]/.test(term)) return "中文";
  if (/[đươăâĐƯƠĂÂ]/i.test(term) || /[ảãạẳẵặẩẫậẻẽẹểễệỉĩịỏõọổỗộởỡợủũụửữựỳỷỹỵ]/i.test(term)) {
    return "Tiếng Việt";
  }
  if (/[éèàùçœæêëîïôûüÿ]/i.test(term)) return "Français";
  if (/[ñ¿¡]/i.test(term)) return "Español";
  if (/[äöüß]/i.test(term)) return "Deutsch";

  return "English";
}

type MainTab = "quiz" | "notebook";
type ReviewMode = "learning_only" | "all";
type ListFilterType = "all" | "new" | "learning" | "mastered";

export default function VocabularyPage() {
  const t = useTranslations("vocabulary");
  const locale = useLocale();
  const { show: showToast, toast } = useToast();
  const [words, setWords] = React.useState<SavedWord[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Dynamic async translation cache (wordId -> Vietnamese definition)
  const [translatedDefsMap, setTranslatedDefsMap] = React.useState<Record<number, string>>({});

  // Dynamic Distractors from Free Dictionary API
  const [apiDistractors, setApiDistractors] = React.useState<string[]>([]);

  React.useEffect(() => {
    api<string[]>(`/vocabulary/distractors?native=${locale}&target=en`)
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setApiDistractors(data);
        }
      })
      .catch(console.error);
  }, [locale]);

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

  // Resolve clean definition for any given SavedWord in user's target locale
  const getDefinitionForTargetLang = React.useCallback(
    (wordItem: SavedWord): string => {
      if (translatedDefsMap[wordItem.id]) {
        return translatedDefsMap[wordItem.id];
      }

      if (wordItem.personalNote?.trim()) {
        return wordItem.personalNote.trim();
      }

      if (wordItem.word.definition?.trim()) {
        return wordItem.word.definition.trim();
      }

      return wordItem.word.term;
    },
    [translatedDefsMap],
  );

  // Dynamic Translation Pipeline: Pre-fetches translations into user target locale via API
  const ensureTargetTranslations = React.useCallback(async (wordList: SavedWord[]) => {
    const newMap: Record<number, string> = {};
    const unmappedWords: SavedWord[] = [];

    for (const item of wordList) {
      const personalNote = item.personalNote?.trim() || "";
      const rawDef = item.word.definition?.trim() || "";

      if (personalNote) {
        newMap[item.id] = personalNote;
      } else if (rawDef) {
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
              body: { text: item.word.term, source: "auto", target: locale || "en" },
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
  }, [locale]);

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
      void ensureTargetTranslations(mergedWords);
    } catch (err) {
      console.error("Failed to load words:", err);
    } finally {
      setLoading(false);
    }
  }, [ensureTargetTranslations]);

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

  // Generate 4 Quiz options in user target language (1 correct answer + 3 distractors)
  const generateOptionsForWord = React.useCallback(
    (targetWord: SavedWord, allWords: SavedWord[]): string[] => {
      const correctDef = getDefinitionForTargetLang(targetWord);
      const isViLocale = locale?.startsWith("vi");
      const isFrLocale = locale?.startsWith("fr");

      // Language consistency checker: Ensures distractors match the language of correctDef
      const isMatchingLanguage = (text: string): boolean => {
        if (!text || text.trim() === "") return false;
        if (isViLocale) {
          // Reject untranslated pure English strings when UI is in Vietnamese
          const isPureEnglish = /^[a-zA-Z0-9\s.,;:'"()\-«»]+$/.test(text.trim());
          if (isPureEnglish) return false;
        }
        return true;
      };

      const candidateDefs = allWords
        .filter((w) => w.id !== targetWord.id)
        .map((w) => getDefinitionForTargetLang(w))
        .filter(
          (def) =>
            def.trim() !== "" &&
            def !== correctDef &&
            isMatchingLanguage(def) &&
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

      // Priority 2: Use live dynamic distractor definitions from Free Dictionary API
      if (distractors.length < needed && apiDistractors.length > 0) {
        const shuffledApi = shuffleArray(apiDistractors);
        for (const cand of shuffledApi) {
          if (
            distractors.length < needed &&
            cand !== correctDef &&
            isMatchingLanguage(cand) &&
            !distractors.includes(cand)
          ) {
            distractors.push(cand);
          }
        }
      }

      // Priority 3: Use expanded fallback distractors pool matching user UI locale
      if (distractors.length < needed) {
        const langKey = isViLocale ? "vi" : isFrLocale ? "fr" : "en";
        const pool = FALLBACK_DISTRACTORS[langKey] || FALLBACK_DISTRACTORS["en"];
        const shuffledFallbacks = shuffleArray(pool);
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
    [getDefinitionForTargetLang, locale, apiDistractors],
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

    const correctDef = getDefinitionForTargetLang(activeQuizWord);
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
      showToast(t("deleted_toast_message", { term }));
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
    if (acc >= 90) return { title: t("rank_excellent"), color: "text-amber-500 bg-amber-500/10 border-amber-500/30" };
    if (acc >= 70) return { title: t("rank_good"), color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30" };
    if (acc >= 50) return { title: t("rank_fair"), color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/30" };
    return { title: t("rank_needs_work"), color: "text-rose-500 bg-rose-500/10 border-rose-500/30" };
  };

  const rankInfo = getRankBadge(accuracyPercent);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-8 pb-24 space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-6 rounded-3xl border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-1">
            <BookOpen className="w-4 h-4" /> {t("header_badge")}
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
            {t("page_title")}
          </h1>
          <p className="text-sm text-muted mt-1">
            {t("page_subtitle")}
          </p>
        </div>

        {/* TOP RIGHT STATS COUNTERS */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="bg-muted/10 border border-border rounded-2xl px-5 py-3 text-center min-w-[84px]">
            <div className="text-2xl font-black text-foreground">{totalCount}</div>
            <div className="text-[11px] font-semibold text-muted">{t("total_words")}</div>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-5 py-3 text-center min-w-[84px]">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {masteredCount}
            </div>
            <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              {t("mastered")}
            </div>
          </div>
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl px-5 py-3 text-center min-w-[84px]">
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {learningCount}
            </div>
            <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
              {t("need_review")}
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
          <Brain className="w-4 h-4" /> 🎯 {t("tab_quiz")}
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
          <BookOpen className="w-4 h-4" /> 📚 {t("tab_notebook", { count: totalCount })}
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
                {t("btn_review_learning", { count: learningCount })}
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
                {t("btn_review_all", { count: totalCount })}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="h-96 rounded-3xl bg-muted/10 animate-pulse flex items-center justify-center text-muted text-sm">
              {t("quiz_loading")}
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
                  {t("quiz_result_title")}
                </h2>
                <p className="text-sm text-muted">
                  {t("quiz_result_desc", { count: totalQuestions })}
                </p>
              </div>

              {/* DETAILED SCORE SUMMARY BOARD */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mx-auto pt-2">
                <div className="bg-gradient-to-br from-primary/10 to-indigo-500/10 border border-primary/20 p-5 rounded-2xl text-center shadow-sm">
                  <div className="flex items-center justify-center gap-1 text-primary text-xs font-bold uppercase mb-1">
                    <Zap className="w-3.5 h-3.5" /> {t("total_score")}
                  </div>
                  <div className="text-3xl font-black text-primary">
                    {earnedPoints} <span className="text-xs text-muted font-normal">/ {maxPossiblePoints}</span>
                  </div>
                  <div className="text-[11px] text-muted mt-1 font-semibold">{t("score_sub")}</div>
                </div>

                <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl text-center shadow-sm">
                  <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {t("correct_answers")}
                  </div>
                  <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                    {score} <span className="text-xs text-muted font-normal">/ {totalQuestions}</span>
                  </div>
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-1 font-semibold">
                    {t("correct_sub")}
                  </div>
                </div>

                <div className="bg-indigo-500/10 border border-indigo-500/20 p-5 rounded-2xl text-center shadow-sm">
                  <div className="flex items-center justify-center gap-1 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase mb-1">
                    <Award className="w-3.5 h-3.5" /> {t("accuracy_rate")}
                  </div>
                  <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                    {accuracyPercent}%
                  </div>
                  <div className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-1 font-semibold">
                    {t("accuracy")}
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <Button
                  onClick={handleRestartQuiz}
                  className="rounded-2xl h-12 px-6 font-bold shadow-md bg-primary text-primary-foreground hover:opacity-90"
                >
                  <RotateCw className="w-4 h-4 mr-2" /> {t("btn_new_quiz")}
                </Button>
                <Button
                  onClick={() => setActiveTab("notebook")}
                  variant="outline"
                  className="rounded-2xl h-12 px-6 font-bold border-border"
                >
                  <BookOpen className="w-4 h-4 mr-2" /> {t("btn_view_notebook")}
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
                    <HelpCircle className="w-4 h-4 text-primary" /> {t("question_progress", { current: currentIndex + 1, total: deck.length })}
                  </span>

                  <div className="flex items-center gap-3">
                    <span className="text-primary font-black bg-primary/10 px-3 py-1 rounded-full text-xs">
                      ⚡ {t("points", { points: score * 10 })}
                    </span>

                    {streak > 1 && (
                      <span className="bg-amber-500/15 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-full flex items-center gap-1 text-[11px] font-extrabold animate-pulse">
                        🔥 {t("streak", { streak })}
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
                      {activeQuizWord.status === "mastered" ? t("status_mastered_label") : t("status_learning_label")}
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
                  {getLanguageDisplayName(activeQuizWord)}
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
                    title={t("btn_audio_tooltip")}
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>

                {activeQuizWord.word.phonetic && (
                  <p className="text-sm font-semibold text-rose-500">
                    {activeQuizWord.word.phonetic}
                  </p>
                )}

                <p className="text-xs text-muted font-medium pt-1">
                  {t("select_correct_def_prompt")}
                </p>
              </div>

              {/* 4 MULTIPLE CHOICE OPTIONS GRID */}
              <div className="grid grid-cols-1 gap-3">
                {quizOptions.map((opt, idx) => {
                  const correctDef = getDefinitionForTargetLang(activeQuizWord);
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
                    {currentIndex + 1 < deck.length ? t("btn_next_question") : t("btn_view_score")}{" "}
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
                  ? t("empty_learning_title")
                  : t("empty_notebook_title")}
              </h3>
              <p className="text-sm text-muted max-w-xs">
                {reviewMode === "learning_only"
                  ? t("empty_learning_desc")
                  : t("empty_notebook_desc")}
              </p>
              {reviewMode === "learning_only" && (
                <Button onClick={() => handleModeChange("all")} variant="ghost">
                  {t("btn_review_all_full", { count: totalCount })}
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
              <h2 className="font-extrabold text-xl text-foreground">{t("notebook_heading")}</h2>
              <p className="text-xs text-muted mt-0.5">{t("notebook_subheading")}</p>
            </div>
            <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full self-start sm:self-auto">
              {t("total_count_label", { count: filteredWords.length })}
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
                  {filterKey === "all" && t("filter_all")}
                  {filterKey === "new" && t("filter_new")}
                  {filterKey === "learning" && t("filter_learning")}
                  {filterKey === "mastered" && t("filter_mastered")}
                </button>
              ))}
            </div>

            {/* SEARCH INPUT */}
            <div className="relative min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
              <input
                type="text"
                placeholder={t("search_placeholder_notebook")}
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
                const targetDef = getDefinitionForTargetLang(item);

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
                        <button
                          type="button"
                          onClick={() =>
                            speakWord(
                              item.word.term,
                              item.word.language?.code || "en",
                            )
                          }
                          className="p-1 rounded-md text-muted hover:text-primary transition-colors"
                          title={t("btn_audio_tooltip")}
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
                          {item.status === "mastered" ? t("status_mastered_label") : t("status_learning_label")}
                        </span>
                      </div>

                      <p className="text-sm font-semibold text-foreground/90">
                        {targetDef}
                      </p>

                      {item.word.example && (
                        <p className="text-xs text-muted italic truncate">
                          &quot;{item.word.example}&quot;
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-[10px] text-muted pt-1">
                        <span className="bg-muted/20 px-2 py-0.5 rounded-md font-medium">
                          {getLanguageDisplayName(item)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => void handleDeleteWord(item.id, item.word.term)}
                      className="opacity-0 group-hover:opacity-100 p-2 rounded-xl text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-all shrink-0"
                      title={t("btn_delete_tooltip")}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-16 text-center text-muted text-sm">
                {t("no_words_found")}
              </div>
            )}
          </div>
        </div>
      )}

      {toast}
    </div>
  );
}
