"use client";

import * as React from "react";
import { api } from "@/lib/api";
import { type SavedWord } from "@/components/features/WordSaveModal";
import { useToast } from "@/components/features/TrustDialogs";
import { useLocale, useTranslations } from "next-intl";

export const speakWord = (text: string, langCode: string = "en-US") => {
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

export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const LOCAL_STATUS_KEY = "stududu_vocab_word_statuses";

export function getStoredWordStatuses(): Record<number, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LOCAL_STATUS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveWordStatusToStorage(id: number, status: string) {
  if (typeof window === "undefined") return;
  try {
    const current = getStoredWordStatuses();
    current[id] = status;
    localStorage.setItem(LOCAL_STATUS_KEY, JSON.stringify(current));
  } catch (err) {
    console.error(err);
  }
}

export const FALLBACK_DISTRACTORS: Record<string, string[]> = {
  fr: [
    "Dynamisme et énergie positive au quotidien",
    "Inspiration créative abondante et constante",
    "Capacité d'adaptation rapide aux nouvelles situations",
    "Persévérance remarquable et effort continu",
    "Empathie profonde et compréhension mutuelle",
    "Réussite et accomplissement exceptionnel",
    "Concentration soutenue et précision absolue",
    "Impact positif et durable sur l'environnement",
    "Esprit d'équipe chaleureux et convivialité",
    "Vision stratégique à long terme et perspicacité",
    "Fondation solide et ancrage réconfortant",
    "Pragmatisme intelligent et sens du concret",
    "Créativité débordante et esprit d'innovation",
    "Calme intérieur et sérénité apaisante",
    "Raison d'être et motivation profonde",
    "Curiosité intellectuelle et désir d'apprendre",
    "Richesse d'expérience et maturité d'esprit",
    "Finesse d'esprit et intuition remarquable",
    "Harmonie subtile et équilibre parfait",
    "Engagement sincère et dévouement exemplaire",
    "Patience inébranlable et sérénité absolue",
    "Élan d'enthousiasme et passion communicative",
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

export function getLanguageDisplayName(wordItem: SavedWord): string {
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

export type MainTab = "quiz" | "notebook";
export type ReviewMode = "learning_only" | "all";
export type ListFilterType = "all" | "new" | "learning" | "mastered";

export function useVocabulary() {
  const t = useTranslations("vocabulary");
  const locale = useLocale();
  const { show: showToast, toast } = useToast();
  const [words, setWords] = React.useState<SavedWord[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [translatedDefsMap, setTranslatedDefsMap] = React.useState<Record<number, string>>({});
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

  const [activeTab, setActiveTab] = React.useState<MainTab>("quiz");
  const [reviewMode, setReviewMode] = React.useState<ReviewMode>("learning_only");
  const [deck, setDeck] = React.useState<SavedWord[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const deckInitializedRef = React.useRef(false);

  const [quizOptions, setQuizOptions] = React.useState<string[]>([]);
  const [selectedOption, setSelectedOption] = React.useState<string | null>(null);
  const [isAnswered, setIsAnswered] = React.useState<boolean>(false);
  const [score, setScore] = React.useState<number>(0);
  const [quizCompleted, setQuizCompleted] = React.useState<boolean>(false);
  const [streak, setStreak] = React.useState<number>(0);
  const [incorrectWords, setIncorrectWords] = React.useState<SavedWord[]>([]);
  const [undoItem, setUndoItem] = React.useState<{ word: SavedWord; index: number } | null>(null);
  const deleteTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const [listFilter, setListFilter] = React.useState<ListFilterType>("all");
  const [search, setSearch] = React.useState("");
  const [selectedWordId, setSelectedWordId] = React.useState<number | null>(null);

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

  const loadWords = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<SavedWord[]>("/vocabulary/my-words");
      const localStatuses = getStoredWordStatuses();

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
      setIncorrectWords([]);
    },
    [],
  );

  React.useEffect(() => {
    if (words.length > 0 && !deckInitializedRef.current) {
      initReviewDeck(reviewMode, words);
      deckInitializedRef.current = true;
    } else if (words.length === 0) {
      setDeck([]);
      setCurrentIndex(0);
    }
  }, [words, reviewMode, initReviewDeck]);

  const generateOptionsForWord = React.useCallback(
    (targetWord: SavedWord, allWords: SavedWord[]): string[] => {
      const correctDef = getDefinitionForTargetLang(targetWord);
      const isViLocale = locale?.startsWith("vi");
      const isFrLocale = locale?.startsWith("fr");

      const isMatchingLanguage = (text: string): boolean => {
        if (!text || text.trim() === "") return false;
        if (isViLocale) {
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

  const activeQuizWord = deck[currentIndex] || null;
  const activeQuizWordId = activeQuizWord?.id;

  React.useEffect(() => {
    if (activeQuizWord && words.length > 0 && !isAnswered) {
      const opts = generateOptionsForWord(activeQuizWord, words);
      setQuizOptions(opts);
    }
  }, [activeQuizWordId, words, generateOptionsForWord, translatedDefsMap, isAnswered]);

  const handleNextQuestion = React.useCallback(() => {
    if (currentIndex + 1 < deck.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setQuizCompleted(true);
    }
  }, [currentIndex, deck.length]);

  const handleModeChange = (newMode: ReviewMode) => {
    setReviewMode(newMode);
    initReviewDeck(newMode, words);
  };

  const totalCount = words.length;
  const masteredCount = words.filter((w) => w.status === "mastered").length;
  const learningCount = totalCount - masteredCount;

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

      saveWordStatusToStorage(targetId, "mastered");

      setWords((prev) =>
        prev.map((w) => (w.id === targetId ? { ...w, status: "mastered" } : w)),
      );

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
      setIncorrectWords((prev) => {
        if (prev.some((w) => w.id === activeQuizWord.id)) return prev;
        return [...prev, activeQuizWord];
      });
    }
  };

  const handleRestartQuiz = () => {
    initReviewDeck(reviewMode, words);
  };

  const handleRetryMissed = () => {
    if (incorrectWords.length === 0) return;
    const shuffled = shuffleArray(incorrectWords);
    setDeck(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setQuizCompleted(false);
    setSelectedOption(null);
    setIsAnswered(false);
    setStreak(0);
    setIncorrectWords([]);
  };

  const handleDeleteWord = (id: number, term: string) => {
    const targetIdx = words.findIndex((w) => w.id === id);
    const targetWord = words[targetIdx];
    if (!targetWord) return;

    if (deleteTimerRef.current) {
      clearTimeout(deleteTimerRef.current);
    }

    setUndoItem({ word: targetWord, index: targetIdx });
    setWords((prev) => prev.filter((w) => w.id !== id));

    deleteTimerRef.current = setTimeout(async () => {
      try {
        await api(`/vocabulary/my-words/${id}`, { method: "DELETE" });
        if (typeof window !== "undefined") {
          const current = getStoredWordStatuses();
          delete current[id];
          localStorage.setItem(LOCAL_STATUS_KEY, JSON.stringify(current));
        }
      } catch (err) {
        console.error("Delete failed:", err);
      }
      setUndoItem(null);
      deleteTimerRef.current = null;
    }, 5000);
  };

  const handleUndoDelete = () => {
    if (deleteTimerRef.current) {
      clearTimeout(deleteTimerRef.current);
      deleteTimerRef.current = null;
    }
    if (undoItem) {
      setWords((prev) => {
        const next = [...prev];
        next.splice(undoItem.index, 0, undoItem.word);
        return next;
      });
      showToast(t("undone_toast_message", { term: undoItem.word.word.term }));
      setUndoItem(null);
    }
  };

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

  const totalQuestions = deck.length;
  const earnedPoints = score * 10;
  const maxPossiblePoints = totalQuestions * 10;
  const accuracyPercent = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  const getRankBadge = (acc: number) => {
    if (acc >= 90) return { title: t("rank_excellent"), color: "text-amber-800 bg-amber-50 border-amber-200" };
    if (acc >= 70) return { title: t("rank_good"), color: "text-emerald-800 bg-emerald-50 border-emerald-200" };
    if (acc >= 50) return { title: t("rank_fair"), color: "text-teal-800 bg-teal-50 border-teal-200" };
    return { title: t("rank_needs_work"), color: "text-rose-800 bg-rose-50 border-rose-200" };
  };

  const rankInfo = getRankBadge(accuracyPercent);

  return {
    t,
    locale,
    toast,
    words,
    loading,
    activeTab,
    setActiveTab,
    reviewMode,
    deck,
    currentIndex,
    quizOptions,
    selectedOption,
    isAnswered,
    score,
    quizCompleted,
    streak,
    incorrectWords,
    handleRetryMissed,
    undoItem,
    handleUndoDelete,
    listFilter,
    setListFilter,
    search,
    setSearch,
    selectedWordId,
    setSelectedWordId,
    getDefinitionForTargetLang,
    activeQuizWord,
    handleNextQuestion,
    handleModeChange,
    handleSelectOption,
    handleRestartQuiz,
    handleDeleteWord,
    totalCount,
    masteredCount,
    learningCount,
    filteredWords,
    totalQuestions,
    earnedPoints,
    maxPossiblePoints,
    accuracyPercent,
    rankInfo,
  };
}
