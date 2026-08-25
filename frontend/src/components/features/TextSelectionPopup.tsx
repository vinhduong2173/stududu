"use client";

import * as React from "react";
import { BookOpen, X, Volume2, Lightbulb } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { WordSaveModal, type SavedWord } from "@/components/features/WordSaveModal";
import { useLocale, useTranslations } from "next-intl";

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
      : code.includes("ja")
      ? "ja-JP"
      : code.includes("ko")
      ? "ko-KR"
      : code.includes("es")
      ? "es-ES"
      : code.includes("de")
      ? "de-DE"
      : "en-US";
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  }
};

const LANG_NAMES: Record<string, string> = {
  en: "English",
  fr: "Français",
  es: "Español",
  de: "Deutsch",
  ja: "日本語",
  ko: "한국어",
  zh: "中文",
  vi: "Tiếng Việt",
};

function getLangName(code?: string | null): string {
  if (!code) return "English";
  const c = code.toLowerCase();
  return LANG_NAMES[c] || c.toUpperCase();
}

/**
 * TextSelectionPopup — Popup thông minh khi bôi đen từ.
 *
 * Lắng nghe mouseup trên toàn trang. Khi có text được chọn,
 * gọi GET /vocabulary/lookup để lấy dữ liệu rồi hiển thị popup
 * ngay tại vị trí con trỏ.
 */

type LookupResult = {
  term: string;
  translation: string | null;
  detectedLang: string | null;
  languageId: number;
  phonetic?: string | null;
  dictionary: {
    phonetic: string | null;
    partOfSpeech: string | null;
    definition: string | null;
    example: string | null;
  } | null;
  library: {
    id: number;
    phonetic: string | null;
    definition: string | null;
    example: string | null;
    languageId: number;
    languageName: string;
    saveCount: number;
  } | null;
};

type PopupPosition = { top: number; left: number; direction: "above" | "below" };

export function TextSelectionPopup({
  targetLang,
  onWordSaved,
}: {
  targetLang?: string;
  onWordSaved?: (item: SavedWord, duplicated: boolean) => void;
}) {
  const locale = useLocale();
  const t = useTranslations("vocabulary");
  const effectiveTargetLang = targetLang || locale || "en";

  const [selectedText, setSelectedText] = React.useState("");
  const [position, setPosition] = React.useState<PopupPosition | null>(null);
  const [result, setResult] = React.useState<LookupResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [showSaveModal, setShowSaveModal] = React.useState(false);
  const [visible, setVisible] = React.useState(false);

  const popupRef = React.useRef<HTMLDivElement>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  // Lấy definition + example + phonetic — ưu tiên top-level / Dictionary, fallback Library
  const phonetic =
    result?.phonetic ??
    result?.dictionary?.phonetic ??
    result?.library?.phonetic ??
    null;
  const rawDefinition =
    result?.dictionary?.definition ??
    result?.library?.definition ??
    result?.translation ??
    null;
  const example =
    result?.dictionary?.example ?? result?.library?.example ?? null;

  const [translatedDef, setTranslatedDef] = React.useState<string | null>(null);

  // Auto-translate definition to user's native language if definition is in English
  React.useEffect(() => {
    if (!rawDefinition) {
      setTranslatedDef(null);
      return;
    }

    const isPureEnglish = /^[a-zA-Z0-9\s.,;:'"()\-«»]+$/.test(rawDefinition.trim());
    if (isPureEnglish && locale && !locale.startsWith("en")) {
      api<{ translation: string }>("/translate", {
        method: "POST",
        body: { text: rawDefinition, target: locale, source: "auto" },
      })
        .then((res) => {
          if (res?.translation) {
            setTranslatedDef(res.translation);
          } else {
            setTranslatedDef(rawDefinition);
          }
        })
        .catch(() => setTranslatedDef(rawDefinition));
    } else {
      setTranslatedDef(rawDefinition);
    }
  }, [rawDefinition, locale]);

  const definition = translatedDef ?? rawDefinition;

  const handlePlayAudio = () => {
    const audioUrl = (result?.dictionary as any)?.audioUrl || (result?.library as any)?.audioUrl;
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(() => speakWord(selectedText, result?.detectedLang || "en"));
    } else {
      speakWord(selectedText, result?.detectedLang || "en");
    }
  };

  const handleSave = async () => {
    if (!result || saving) return;
    setSaving(true);
    try {
      const res = await api<{ saved: SavedWord; duplicated: boolean }>("/vocabulary/save-word", {
        method: "POST",
        body: {
          term: selectedText.trim(),
          languageId: result.languageId,
          phonetic: phonetic?.trim() || undefined,
          definition: definition?.trim() || undefined,
          example: example?.trim() || undefined,
          source: "manual",
        },
      });
      onWordSaved?.(res.saved, res.duplicated);
      close();
    } catch (err) {
      console.error("Lưu từ thất bại:", err);
      // Fallback mở modal nếu có lỗi lạ
      setShowSaveModal(true);
    } finally {
      setSaving(false);
    }
  };

  const close = React.useCallback(() => {
    setVisible(false);
    // Clear sau khi animation kết thúc
    setTimeout(() => {
      setSelectedText("");
      setPosition(null);
      setResult(null);
      setLoading(false);
      setSaving(false);
    }, 150);
    abortRef.current?.abort();
  }, []);

  // Lắng nghe mouseup trên toàn trang
  React.useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      // Không kích hoạt nếu click bên trong popup
      if (popupRef.current?.contains(e.target as Node)) return;

      // Delay nhỏ để browser cập nhật selection
      setTimeout(() => {
        const selection = window.getSelection();
        const text = selection?.toString().trim() ?? "";

        // Bỏ qua nếu text quá ngắn hoặc quá dài
        if (text.length < 1 || text.length > 100) {
          close();
          return;
        }

        // Bỏ qua nếu chọn trong input/textarea
        const activeEl = document.activeElement;
        if (
          activeEl instanceof HTMLInputElement ||
          activeEl instanceof HTMLTextAreaElement
        ) {
          close();
          return;
        }

        // Lấy vị trí
        const range = selection?.getRangeAt(0);
        if (!range) return;
        const rect = range.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return;

        const POPUP_HEIGHT_ESTIMATE = 280;
        const direction: "above" | "below" =
          rect.top > POPUP_HEIGHT_ESTIMATE + 16 ? "above" : "below";

        const POPUP_WIDTH = 360;
        const top =
          direction === "above"
            ? rect.top + window.scrollY - 8
            : rect.bottom + window.scrollY + 8;
        const left = Math.max(
          16,
          Math.min(
            rect.left + rect.width / 2 - POPUP_WIDTH / 2,
            window.innerWidth - POPUP_WIDTH - 16
          )
        );

        setSelectedText(text);
        setPosition({ top, left, direction });
        setResult(null);
        setLoading(true);
        setVisible(true);

        // Abort previous request nếu có
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        // Gọi API
        api<LookupResult>(
          `/vocabulary/lookup?term=${encodeURIComponent(text)}&target=${encodeURIComponent(effectiveTargetLang)}`
        )
          .then((data) => {
            if (!controller.signal.aborted) {
              setResult(data);
              setLoading(false);
            }
          })
          .catch((err) => {
            if (!controller.signal.aborted) {
              console.error("Lookup error:", err);
              setLoading(false);
            }
          });
      }, 10);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [effectiveTargetLang, close]);

  // Đóng khi scroll xa
  React.useEffect(() => {
    if (!visible) return;
    const handleScroll = () => close();
    // Dùng capture để bắt scroll trên mọi container
    window.addEventListener("scroll", handleScroll, { capture: true, passive: true });
    return () => window.removeEventListener("scroll", handleScroll, { capture: true });
  }, [visible, close]);

  if (!position || !visible) return showSaveModal ? (
    <WordSaveModal
      open={showSaveModal}
      onClose={() => setShowSaveModal(false)}
      initialWord={selectedText}
      source="manual"
      onSaved={(item, dup) => {
        onWordSaved?.(item, dup);
        setShowSaveModal(false);
      }}
    />
  ) : null;

  const partOfSpeech = result?.dictionary?.partOfSpeech ?? null;

  return (
    <>
      <div
        ref={popupRef}
        className={cn(
          "fixed z-[9999] w-[360px] max-w-[calc(100vw-32px)]",
          "bg-surface/95 backdrop-blur-xl border border-border/60",
          "rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)]",
          "transition-all duration-200 ease-out",
          visible
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-1",
        )}
        style={{
          top: position.top,
          left: position.left,
          transformOrigin:
            position.direction === "above" ? "bottom center" : "top center",
          transform: position.direction === "above"
            ? `translateY(-100%)`
            : undefined,
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-foreground break-all leading-tight">
                {selectedText}
              </h3>
              <button
                type="button"
                onClick={handlePlayAudio}
                className="w-7 h-7 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
                title={t("btn_audio_tooltip")}
              >
                <Volume2 className="w-4 h-4" />
              </button>
              {phonetic && (
                <span className="text-xs font-extrabold rounded-lg px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 shrink-0">
                  {phonetic}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={close}
            className="w-7 h-7 rounded-full hover:bg-muted/10 flex items-center justify-center text-muted hover:text-foreground transition-colors shrink-0 -mr-1 -mt-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 pb-3 space-y-2.5">
          {loading ? (
            /* Skeleton loading */
            <div className="space-y-2.5 animate-pulse">
              <div className="h-5 bg-muted/10 rounded-lg w-3/4" />
              <div className="space-y-1.5">
                <div className="h-3 bg-muted/10 rounded w-full" />
                <div className="h-3 bg-muted/10 rounded w-5/6" />
              </div>
              <div className="h-3 bg-muted/10 rounded w-2/3" />
            </div>
          ) : result ? (
            <>
              {/* Định nghĩa (Native Language) */}
              {definition && (
                <div>
                  <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{t("definition_heading")}</span>
                  </p>
                  <p className="text-sm font-medium text-foreground leading-relaxed">
                    {definition}
                  </p>
                </div>
              )}

              {/* Ví dụ (Original Target Language) */}
              {example && (
                <div>
                  <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    <span>{t("example_heading")}</span>
                  </p>
                  <p className="text-sm text-foreground/80 italic leading-relaxed">
                    &ldquo;{example}&rdquo;
                  </p>
                </div>
              )}

              {/* Nếu không có gì */}
              {!definition && !example && (
                <p className="text-sm text-muted py-2">
                  {t("no_info")}
                </p>
              )}

              {/* Language name badge */}
              {(result.library?.languageName || result.detectedLang) && (
                <div className="flex items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] text-muted font-medium">
                    • {result.library?.languageName || getLangName(result.detectedLang)}
                  </span>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-error py-2">
              {t("lookup_error")}
            </p>
          )}
        </div>

        {/* Footer — nút Lưu */}
        <div className="px-4 pb-4 pt-1 border-t border-border/40">
          <button
            onClick={handleSave}
            disabled={saving || !result}
            className={cn(
              "w-full flex items-center justify-center gap-2",
              "h-10 rounded-xl text-sm font-semibold",
              "bg-primary text-white hover:bg-primary-hover",
              "shadow-sm transition-all active:scale-[0.98]",
              "disabled:opacity-50 disabled:pointer-events-none"
            )}
          >
            <BookOpen className="w-4 h-4" />
            {saving ? t("saving_btn") : t("save_to_notebook_btn")}
          </button>
        </div>
      </div>

      {/* Word Save Modal — Fallback duy nhất khi auto-save lỗi */}
      <WordSaveModal
        open={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        initialWord={selectedText}
        source="manual"
        onSaved={(item, dup) => {
          onWordSaved?.(item, dup);
          setShowSaveModal(false);
        }}
      />
    </>
  );
}
