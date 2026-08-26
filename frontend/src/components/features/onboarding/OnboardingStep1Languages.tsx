"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { getLanguageInfo } from "@/lib/languages";
import { Plus, X, Globe, Sparkles } from "lucide-react";
import type { Language, UserLanguageItem } from "@/hooks/useOnboarding";

interface OnboardingStep1LanguagesProps {
  t: any;
  tDisc: any;
  locale: string;
  availableLanguages: Language[];
  myLanguages: UserLanguageItem[];
  teachLangId: string;
  setTeachLangId: (val: string) => void;
  teachRole: "native" | "fluent";
  setTeachRole: (val: "native" | "fluent") => void;
  learnLangId: string;
  setLearnLangId: (val: string) => void;
  learnLevel: string;
  setLearnLevel: (val: string) => void;
  getLangName: (id: number) => string;
  handleAddTeach: () => void;
  handleAddLearn: () => void;
  handleRemoveLang: (langId: number, role: string) => void;
  submitStep1: () => void;
  loading: boolean;
}

export function OnboardingStep1Languages({
  t,
  tDisc,
  locale,
  availableLanguages,
  myLanguages,
  teachLangId,
  setTeachLangId,
  teachRole,
  setTeachRole,
  learnLangId,
  setLearnLangId,
  learnLevel,
  setLearnLevel,
  getLangName,
  handleAddTeach,
  handleAddLearn,
  handleRemoveLang,
  submitStep1,
  loading,
}: OnboardingStep1LanguagesProps) {
  const teachList = myLanguages.filter((l) => l.role !== "learning");
  const learnList = myLanguages.filter((l) => l.role === "learning");

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. Ngôn ngữ có thể dạy (Speaks) */}
      <div className="bg-surface-2/40 p-4 sm:p-5 rounded-2xl border border-border/80 space-y-3.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200/80 flex items-center justify-center text-teal-700">
            <Globe className="w-4 h-4" />
          </div>
          <h2 className="text-base sm:text-lg font-extrabold font-display text-foreground">
            {t("teach_title")}
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <select
            className="flex h-12 rounded-xl border border-border bg-white px-3.5 py-2 flex-1 outline-none focus:ring-2 focus:ring-primary/20 font-medium text-sm text-foreground shadow-2xs"
            value={teachLangId}
            onChange={(e) => setTeachLangId(e.target.value)}
          >
            <option value="">{t("select_lang")}</option>
            {availableLanguages
              .filter((l) => !myLanguages.some((ml) => ml.languageId === l.id))
              .map((l) => (
                <option key={l.id} value={l.id}>
                  {getLanguageInfo(l.code, l.name, locale).displayName}
                </option>
              ))}
          </select>
          <select
            className="flex h-12 rounded-xl border border-border bg-white px-3 py-2 sm:w-36 outline-none focus:ring-2 focus:ring-primary/20 font-medium text-sm text-foreground shadow-2xs"
            value={teachRole}
            onChange={(e) => setTeachRole(e.target.value as any)}
          >
            <option value="native">{tDisc("card_native")}</option>
            <option value="fluent">{tDisc("card_fluent")}</option>
          </select>
          <Button variant="outline" className="h-12 rounded-xl px-5 font-bold bg-white hover:bg-surface-2" onClick={handleAddTeach}>
            <Plus className="w-4 h-4 mr-1.5" />
            {t("add_btn")}
          </Button>
        </div>

        {teachList.length > 0 ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {teachList.map((l) => (
              <Chip key={`${l.languageId}-${l.role}`} variant="default" className="py-1.5 px-3.5 gap-2 text-xs shadow-2xs">
                <span>{getLangName(l.languageId)} ({l.role === "native" ? tDisc("card_native") : tDisc("card_fluent")})</span>
                <button type="button" className="hover:opacity-75 transition-opacity" onClick={() => handleRemoveLang(l.languageId, l.role)}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </Chip>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted/80 italic pt-1">{t("empty_languages_hint")}</p>
        )}
      </div>

      {/* 2. Ngôn ngữ muốn học (Learns) */}
      <div className="bg-surface-2/40 p-4 sm:p-5 rounded-2xl border border-border/80 space-y-3.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-600">
            <Sparkles className="w-4 h-4" />
          </div>
          <h2 className="text-base sm:text-lg font-extrabold font-display text-foreground">
            {t("learn_title")}
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <select
            className="flex h-12 rounded-xl border border-border bg-white px-3.5 py-2 flex-1 outline-none focus:ring-2 focus:ring-primary/20 font-medium text-sm text-foreground shadow-2xs"
            value={learnLangId}
            onChange={(e) => setLearnLangId(e.target.value)}
          >
            <option value="">{t("select_lang")}</option>
            {availableLanguages
              .filter((l) => !myLanguages.some((ml) => ml.languageId === l.id))
              .map((l) => (
                <option key={l.id} value={l.id}>
                  {getLanguageInfo(l.code, l.name, locale).displayName}
                </option>
              ))}
          </select>
          <select
            className="flex h-12 rounded-xl border border-border bg-white px-3 py-2 sm:w-36 outline-none focus:ring-2 focus:ring-primary/20 font-medium text-sm text-foreground shadow-2xs"
            value={learnLevel}
            onChange={(e) => setLearnLevel(e.target.value)}
          >
            <option value="1">{t("level_1")}</option>
            <option value="2">{t("level_2")}</option>
            <option value="3">{t("level_3")}</option>
            <option value="4">{t("level_4")}</option>
            <option value="5">{t("level_5")}</option>
          </select>
          <Button variant="outline" className="h-12 rounded-xl px-5 font-bold bg-white hover:bg-surface-2" onClick={handleAddLearn}>
            <Plus className="w-4 h-4 mr-1.5" />
            {t("add_btn")}
          </Button>
        </div>

        {learnList.length > 0 ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {learnList.map((l) => (
              <Chip key={`${l.languageId}-learning`} variant="secondary" className="py-1.5 px-3.5 gap-2 text-xs shadow-2xs">
                <span>{getLangName(l.languageId)} ({t(`level_${l.level}` as any)})</span>
                <button type="button" className="hover:opacity-75 transition-opacity" onClick={() => handleRemoveLang(l.languageId, "learning")}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </Chip>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted/80 italic pt-1">{t("empty_languages_hint")}</p>
        )}
      </div>

      <Button className="w-full sd-btn-gradient h-12 rounded-full font-bold text-sm shadow-card active:scale-[0.98] transition-all cursor-pointer" onClick={submitStep1} disabled={loading}>
        {loading ? t("loading") : t("continue_btn")}
      </Button>
    </div>
  );
}
