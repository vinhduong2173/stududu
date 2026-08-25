"use client";

import * as React from "react";
import { BookOpen, Bookmark, Check, ChevronLeft, ChevronRight, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getLanguageInfo, LanguageFlag } from "@/lib/languages";
import { cn } from "@/lib/utils";
import { useTranslations, useLocale } from "next-intl";

export type DailyWord = {
  index: number;
  term: string;
  partOfSpeech: string;
  phonetic: string;
  definition: string;
  example: string;
  audioUrl?: string | null;
  isSaved: boolean;
  languageId?: number;
};

export type DailyWordsResponse = {
  language: { code: string; name: string };
  nativeLanguage?: string;
  learningLanguages?: { code: string; name: string }[];
  total: number;
  words: DailyWord[];
};

export interface DailyVocabCardProps {
  dailyWordsData: DailyWordsResponse | null;
  vocabIndex: number;
  savingVocab: boolean;
  dailyTargetLang: string | null;
  onTargetLangChange: (langCode: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onSave: () => void;
  onPlayAudio: (word: DailyWord, langCode?: string) => void;
}

export function DailyVocabCard({
  dailyWordsData,
  vocabIndex,
  savingVocab,
  dailyTargetLang,
  onTargetLangChange,
  onPrev,
  onNext,
  onSave,
  onPlayAudio,
}: DailyVocabCardProps) {
  const t = useTranslations();
  const locale = useLocale();

  const words = dailyWordsData?.words || [];
  const currentWord = words.length > 0 ? words[vocabIndex % words.length] : null;
  const currentLang = dailyWordsData?.language;
  const langInfo = currentLang ? getLanguageInfo(currentLang.code, currentLang.name, locale) : null;

  return (
    <div className="bg-surface rounded-2xl border border-border/80 shadow-card p-5 overflow-hidden transition-all">
      {/* Header Row: Title & Count Badge */}
      <div className="flex items-center justify-between gap-3 mb-3 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-muted truncate">
            {t("community.daily_vocab_title")}
          </span>
        </div>

        {words.length > 0 && (
          <span className="text-xs font-bold text-muted bg-surface-2 px-2.5 py-1 rounded-full border border-border/60 shrink-0 whitespace-nowrap">
            {vocabIndex + 1} / {words.length}
          </span>
        )}
      </div>

      {/* Language Switcher / Language Indicator Pill */}
      {dailyWordsData?.learningLanguages && dailyWordsData.learningLanguages.length > 1 ? (
        <div className="flex gap-1.5 mb-3.5 overflow-x-auto pb-1 no-scrollbar">
          {dailyWordsData.learningLanguages.map((l) => {
            const lInfo = getLanguageInfo(l.code, l.name, locale);
            const isSelected = (dailyTargetLang || currentLang?.code) === l.code;
            return (
              <button
                key={l.code}
                onClick={() => onTargetLangChange(l.code)}
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-bold transition-all shrink-0 whitespace-nowrap cursor-pointer",
                  isSelected
                    ? "bg-primary text-white shadow-2xs"
                    : "bg-surface-2 text-muted hover:text-foreground border border-border/60"
                )}
              >
                <LanguageFlag code={l.code} name={l.name} className="w-3.5 h-3.5" />
                <span>{lInfo.displayName}</span>
              </button>
            );
          })}
        </div>
      ) : langInfo ? (
        <div className="mb-3.5">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 border border-teal-200/70 dark:border-teal-800/50 px-2.5 py-0.5 rounded-full whitespace-nowrap">
            <LanguageFlag code={langInfo.code} name={langInfo.englishName} className="w-3.5 h-3.5" />
            <span>{langInfo.displayName}</span>
          </div>
        </div>
      ) : null}

      {/* Vocab Content Body */}
      {currentWord ? (
        <div className="bg-surface-2/50 dark:bg-surface-2/30 rounded-xl p-4 sm:p-5 border border-border/80 space-y-3.5">
          {/* Word Term & Audio Speaker */}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-2xl sm:text-3xl font-bold font-display text-foreground tracking-tight break-words">
                {currentWord.term}
              </h3>
              {currentWord.phonetic && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-amber-700 dark:text-amber-400 font-semibold font-mono bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-900/40">
                    {currentWord.phonetic}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => onPlayAudio(currentWord, currentLang?.code || "en")}
              className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
              title="Nghe phát âm chuẩn"
              type="button"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          {/* Definition */}
          <div className="pt-1">
            <p className="text-sm sm:text-base font-semibold text-foreground leading-relaxed">
              {currentWord.definition}
            </p>
          </div>

          {/* Example Sentence */}
          {currentWord.example && (
            <div className="bg-surface rounded-xl p-3 border border-border/70 text-xs sm:text-sm italic text-muted leading-relaxed">
              &laquo; {currentWord.example.replace(/^«\s*|^\s*["“]|["”]\s*$|\s*»$/g, "").trim()} &raquo;
            </div>
          )}

          {/* Action Controls */}
          <div className="flex items-center justify-between gap-2.5 pt-2 border-t border-border/60">
            <Button
              size="sm"
              variant="outline"
              onClick={onPrev}
              title={t("community.prev_word")}
              className="w-10 h-10 p-0 rounded-xl shrink-0 flex items-center justify-center bg-surface hover:bg-surface-2 border-border text-foreground transition-all shadow-2xs cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <Button
              size="sm"
              variant={currentWord.isSaved ? "outline" : "default"}
              onClick={onSave}
              disabled={savingVocab || currentWord.isSaved}
              className={cn(
                "flex-1 h-10 rounded-xl text-xs font-bold gap-2 px-4 min-w-0 shadow-2xs transition-all cursor-pointer",
                currentWord.isSaved
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                  : "sd-btn-gradient text-white"
              )}
            >
              {currentWord.isSaved ? (
                <>
                  <Check className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span className="truncate">{t("community.saved_word")}</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4 shrink-0 fill-current" />
                  <span className="truncate">{t("community.save_word")}</span>
                </>
              )}
            </Button>

            <Button
              size="sm"
              onClick={onNext}
              title={t("community.next_word")}
              className="w-10 h-10 p-0 rounded-xl shrink-0 flex items-center justify-center sd-btn-gradient text-white shadow-2xs transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="py-10 text-center text-xs text-muted">
          {t("common.loading")}
        </div>
      )}
    </div>
  );
}
