"use client";

import * as React from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Search,
  Trash2,
  Volume2,
  CheckCircle2,
  RefreshCw,
  Sparkles,
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

// Helper to shuffle deck array randomly
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

type ReviewMode = "learning_only" | "all";
type ListFilter = "all" | "new" | "learning" | "mastered";

export default function VocabularyPage() {
  const { show: showToast, toast } = useToast();
  const [words, setWords] = React.useState<SavedWord[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Review Deck State
  const [reviewMode, setReviewMode] = React.useState<ReviewMode>("learning_only");
  const [deck, setDeck] = React.useState<SavedWord[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isFlipped, setIsFlipped] = React.useState(false);

  // Saved Words List Filters
  const [listFilter, setListFilter] = React.useState<ListFilter>("all");
  const [search, setSearch] = React.useState("");
  const [selectedWordId, setSelectedWordId] = React.useState<number | null>(null);

  // Fetch saved words from API
  const loadWords = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<SavedWord[]>("/vocabulary/my-words");
      setWords(data);
    } catch (err) {
      console.error("Failed to load words:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadWords();
  }, [loadWords]);

  // Build review deck whenever words or reviewMode changes
  const initReviewDeck = React.useCallback(
    (mode: ReviewMode, currentWords: SavedWord[]) => {
      let target = currentWords;
      if (mode === "learning_only") {
        target = currentWords.filter((w) => w.status !== "mastered");
      }
      const shuffled = shuffleArray(target);
      setDeck(shuffled);
      setCurrentIndex(0);
      setIsFlipped(false);
    },
    [],
  );

  React.useEffect(() => {
    if (words.length > 0) {
      initReviewDeck(reviewMode, words);
    } else {
      setDeck([]);
      setCurrentIndex(0);
    }
  }, [words, reviewMode, initReviewDeck]);

  // Handle deck mode toggle with shuffle
  const handleModeChange = (newMode: ReviewMode) => {
    setReviewMode(newMode);
    initReviewDeck(newMode, words);
  };

  // Stats calculation
  const totalCount = words.length;
  const masteredCount = words.filter((w) => w.status === "mastered").length;
  const learningCount = totalCount - masteredCount;

  // Active word in flashcard
  const activeCardWord = deck[currentIndex] || null;

  // Next / Prev card navigation
  const handleNextCard = () => {
    if (deck.length === 0) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % deck.length);
    }, 150);
  };

  const handlePrevCard = () => {
    if (deck.length === 0) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + deck.length) % deck.length);
    }, 150);
  };

  // Update status action (Cần ôn / Đã thuộc)
  const handleUpdateStatus = async (newStatus: "learning" | "mastered") => {
    if (!activeCardWord) return;

    const targetId = activeCardWord.id;

    // 1. Optimistic UI update
    setWords((prev) =>
      prev.map((w) => (w.id === targetId ? { ...w, status: newStatus } : w)),
    );

    // 2. Call Backend PATCH endpoint (gracefully fallback if API not ready)
    try {
      await api(`/vocabulary/my-words/${targetId}/status`, {
        method: "PATCH",
        body: { status: newStatus },
      });
    } catch {
      // Backend status endpoint API might be pending implementation by backend team
    }

    if (newStatus === "mastered") {
      showToast(`Đã đánh dấu "${activeCardWord.word.term}" là ĐÃ THUỘC! 🎉`);
    } else {
      showToast(`Giữ từ "${activeCardWord.word.term}" trong danh sách CẦN ÔN.`);
    }

    // Move to next card in deck
    handleNextCard();
  };

  // Delete word handler
  const handleDeleteWord = async (id: number, term: string) => {
    setWords((prev) => prev.filter((w) => w.id !== id));
    try {
      await api(`/vocabulary/my-words/${id}`, { method: "DELETE" });
      showToast(`Đã xóa "${term}" khỏi sổ từ vựng.`);
    } catch (err) {
      console.error(err);
    }
  };

  // Select word from right list to display in Flashcard
  const handleSelectWordFromList = (wordItem: SavedWord) => {
    setSelectedWordId(wordItem.id);
    const existingIndex = deck.findIndex((w) => w.id === wordItem.id);
    if (existingIndex !== -1) {
      setCurrentIndex(existingIndex);
    } else {
      setDeck([wordItem, ...deck]);
      setCurrentIndex(0);
    }
    setIsFlipped(false);
  };

  // Filtered words for right-hand list
  const filteredWords = words.filter((w) => {
    const matchesSearch =
      !search ||
      w.word.term.toLowerCase().includes(search.toLowerCase()) ||
      (w.word.definition ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (w.personalNote ?? "").toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (listFilter === "mastered") return w.status === "mastered";
    if (listFilter === "learning") return w.status === "learning" || w.status === "new" || !w.status;
    if (listFilter === "new") return w.status === "new" || w.source === "manual";
    return true; // all
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-8 pb-24 space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-6 rounded-3xl border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-1">
            <BookOpen className="w-4 h-4" /> HỌC NHANH
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
            Sổ từ vựng
          </h1>
          <p className="text-sm text-muted mt-1">
            Ôn tập bằng flashcard mỗi ngày — từ hội thoại, cộng đồng và ghi chú của bạn.
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

      {/* MAIN 2-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: INTERACTIVE FLASHCARD STUDY PANEL (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* REVIEW MODE TOGGLE TABS */}
          <div className="flex items-center justify-between bg-surface p-1.5 rounded-2xl border border-border shadow-sm">
            <div className="flex gap-1 w-full">
              <button
                onClick={() => handleModeChange("learning_only")}
                className={cn(
                  "flex-1 py-2 px-3 rounded-xl text-xs md:text-sm font-bold transition-all text-center flex items-center justify-center gap-1.5",
                  reviewMode === "learning_only"
                    ? "bg-primary text-primary-foreground shadow-md"
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
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted hover:text-foreground hover:bg-muted/10",
                )}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Ôn toàn bộ ({totalCount})
              </button>
            </div>
          </div>

          {/* FLASHCARD DISPLAY BOX */}
          {loading ? (
            <div className="h-80 rounded-3xl bg-muted/10 animate-pulse flex items-center justify-center text-muted text-sm">
              Đang tải từ vựng...
            </div>
          ) : deck.length > 0 && activeCardWord ? (
            <div className="space-y-4">
              {/* 3D FLIP CARD CONTAINER */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="perspective-1000 cursor-pointer group select-none min-h-[320px] rounded-3xl bg-surface border-2 border-border shadow-lg p-6 md:p-8 flex flex-col justify-between transition-all duration-300 hover:border-primary/50 relative overflow-hidden"
              >
                {/* TOP BAR OF CARD */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-muted bg-muted/20 px-3 py-1 rounded-full">
                    {activeCardWord.word.language?.name || "GB English"}
                  </span>
                  <span
                    className={cn(
                      "font-bold px-3 py-1 rounded-full text-[11px]",
                      activeCardWord.status === "mastered"
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
                    )}
                  >
                    {activeCardWord.status === "mastered" ? "Đã thuộc" : "Đang học"}
                  </span>
                </div>

                {/* CARD CONTENT FRONT / BACK */}
                {!isFlipped ? (
                  /* FRONT OF CARD */
                  <div className="my-auto text-center space-y-3 py-4">
                    <div className="flex items-center justify-center gap-3">
                      <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
                        {activeCardWord.word.term}
                      </h2>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          speakWord(
                            activeCardWord.word.term,
                            activeCardWord.word.language?.code || "en",
                          );
                        }}
                        className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                        title="Nghe phát âm"
                      >
                        <Volume2 className="w-5 h-5" />
                      </button>
                    </div>

                    <p className="text-sm font-semibold text-rose-500">
                      {activeCardWord.word.phonetic || "/ˌser.ənˈdɪp.ə.ti/"}
                      {activeCardWord.word.partOfSpeech && (
                        <span> · {activeCardWord.word.partOfSpeech}</span>
                      )}
                    </p>

                    <div className="pt-4 flex items-center justify-center text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                      👇 Bấm để xem nghĩa
                    </div>
                  </div>
                ) : (
                  /* BACK OF CARD (FLIPPED) */
                  <div className="my-auto text-center space-y-4 py-2 animate-in fade-in zoom-in-95 duration-200">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-muted mb-1">
                        Nghĩa của từ
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold text-foreground">
                        {activeCardWord.word.definition ||
                          activeCardWord.personalNote ||
                          "Chưa có định nghĩa"}
                      </h3>
                    </div>

                    {activeCardWord.word.example && (
                      <div className="bg-muted/10 p-3 rounded-2xl text-xs text-muted italic max-w-md mx-auto">
                        &quot;{activeCardWord.word.example}&quot;
                      </div>
                    )}

                    {activeCardWord.personalNote && activeCardWord.word.definition && (
                      <p className="text-xs text-muted">
                        📝 Ghi chú: {activeCardWord.personalNote}
                      </p>
                    )}
                  </div>
                )}

                {/* BOTTOM PROGRESS BAR IN CARD */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-[11px] font-bold text-muted">
                    <span>Tiến độ ôn tập</span>
                    <span>
                      {currentIndex + 1} / {deck.length}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-muted/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-rose-500 transition-all duration-300 rounded-full"
                      style={{
                        width: `${((currentIndex + 1) / deck.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* CARD NAVIGATION & FLIP CONTROLS */}
              <div className="flex items-center justify-between gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevCard}
                  className="rounded-2xl h-10 px-4"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Trước
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="rounded-2xl h-10 px-6 font-bold shadow-sm"
                >
                  <RotateCw className="w-4 h-4 mr-2 text-primary" /> Lật thẻ
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNextCard}
                  className="rounded-2xl h-10 px-4"
                >
                  Sau <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>

              {/* ACTION BUTTONS: CẦN ÔN (RE-STUDY) VS ĐÃ THUỘC (MASTERED) */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => handleUpdateStatus("learning")}
                  className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm border-2 border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-98"
                >
                  <RotateCw className="w-4 h-4" /> ↺ Cần ôn
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateStatus("mastered")}
                  className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-98"
                >
                  <CheckCircle2 className="w-4 h-4" /> ✓ Đã thuộc
                </button>
              </div>
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
                  : "Hãy bôi đen từ mới trong ứng dụng hoặc khi chat để thêm vào sổ từ vựng nhé."}
              </p>
              {reviewMode === "learning_only" && (
                <Button onClick={() => handleModeChange("all")} variant="ghost">
                  Ôn toàn bộ từ vựng ({totalCount})
                </Button>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: SAVED WORD LIST "Từ đã lưu" (5 cols) */}
        <div className="lg:col-span-5 bg-surface rounded-3xl border border-border shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-lg text-foreground">Từ đã lưu</h2>
            <span className="text-xs font-semibold text-muted bg-muted/20 px-2.5 py-1 rounded-full">
              {filteredWords.length} từ
            </span>
          </div>

          {/* LIST FILTER TABS */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            {(["all", "new", "learning", "mastered"] as const).map((filterKey) => (
              <button
                key={filterKey}
                onClick={() => setListFilter(filterKey)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all border",
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
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm kiếm từ vựng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 rounded-2xl border border-border bg-muted/5 pl-10 pr-4 text-xs focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* WORD ITEMS SCROLLABLE LIST */}
          <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
            {filteredWords.length > 0 ? (
              filteredWords.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectWordFromList(item)}
                  className={cn(
                    "p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 group hover:border-primary/40",
                    selectedWordId === item.id || activeCardWord?.id === item.id
                      ? "bg-primary/5 border-primary shadow-sm"
                      : "bg-surface border-border hover:bg-muted/5",
                  )}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-foreground text-sm">
                        {item.word.term}
                      </span>
                      {item.word.partOfSpeech && (
                        <span className="text-[11px] italic text-muted">
                          {item.word.partOfSpeech}
                        </span>
                      )}
                      <span
                        className={cn(
                          "text-[10px] font-bold rounded-full px-2 py-0.5 ml-auto",
                          item.status === "mastered"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
                        )}
                      >
                        {item.status === "mastered" ? "Đã thuộc" : "Đang học"}
                      </span>
                    </div>

                    <p className="text-xs text-muted truncate">
                      {item.word.definition || item.personalNote || "Chưa có nghĩa"}
                    </p>

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
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleDeleteWord(item.id, item.word.term);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-all shrink-0"
                    title="Xóa từ"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-muted text-xs">
                Chưa có từ nào trong danh sách này.
              </div>
            )}
          </div>
        </div>
      </div>

      {toast}
    </div>
  );
}
