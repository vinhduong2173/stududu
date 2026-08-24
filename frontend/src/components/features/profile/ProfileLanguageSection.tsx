"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Language, UserLanguageItem, LEVEL_LABELS } from "@/hooks/useProfileEdit";

interface ProfileLanguageSectionProps {
  t: any;
  tOnboard: any;
  tDisc: any;
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
  addTeach: () => void;
  addLearn: () => void;
  removeLang: (id: number, role: string) => void;
}

export function ProfileLanguageSection({
  t,
  tOnboard,
  tDisc,
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
  addTeach,
  addLearn,
  removeLang,
}: ProfileLanguageSectionProps) {
  const selectClass =
    "flex h-12 rounded-xl border border-border bg-transparent px-4 py-2 outline-none focus:border-primary";

  return (
    <section className="bg-surface rounded-3xl p-6 shadow-sm border border-border space-y-6">
      <h2 className="text-lg font-bold text-foreground">{t("languages")}</h2>

      <div>
        <p className="font-semibold mb-3">{tOnboard("teach_title")}</p>
        <div className="flex gap-2 mb-3">
          <select className={`${selectClass} flex-1`} value={teachLangId} onChange={(e) => setTeachLangId(e.target.value)}>
            <option value="">{tOnboard("select_lang")}</option>
            {availableLanguages.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
          <select className={`${selectClass} w-32`} value={teachRole} onChange={(e) => setTeachRole(e.target.value as "native" | "fluent")}>
            <option value="native">{tDisc("card_native")}</option>
            <option value="fluent">{tDisc("card_fluent")}</option>
          </select>
          <Button variant="secondary" onClick={addTeach}>{tOnboard("add_btn")}</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {myLanguages.filter((l) => l.role !== "learning").map((l) => (
            <Chip key={`${l.languageId}-${l.role}`} className="pr-1">
              {getLangName(l.languageId)} ({l.role === "native" ? tDisc("card_native") : tDisc("card_fluent")})
              <button className="ml-2 hover:text-error" onClick={() => removeLang(l.languageId, l.role)}>×</button>
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <p className="font-semibold mb-3">{tOnboard("learn_title")}</p>
        <div className="flex gap-2 mb-3">
          <select className={`${selectClass} flex-1`} value={learnLangId} onChange={(e) => setLearnLangId(e.target.value)}>
            <option value="">{tOnboard("select_lang")}</option>
            {availableLanguages.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
          <select className={`${selectClass} w-36`} value={learnLevel} onChange={(e) => setLearnLevel(e.target.value)}>
            {Object.entries(LEVEL_LABELS).map(([v]) => (
              <option key={v} value={v}>{tOnboard(`level_${v}`)}</option>
            ))}
          </select>
          <Button variant="secondary" onClick={addLearn}>{tOnboard("add_btn")}</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {myLanguages.filter((l) => l.role === "learning").map((l) => (
            <Chip key={`${l.languageId}-learning`} variant="secondary" className="pr-1">
              {getLangName(l.languageId)} ({tOnboard(`level_${l.level}`) || `Level ${l.level}`})
              <button className="ml-2 hover:text-error" onClick={() => removeLang(l.languageId, "learning")}>×</button>
            </Chip>
          ))}
        </div>
      </div>
    </section>
  );
}
