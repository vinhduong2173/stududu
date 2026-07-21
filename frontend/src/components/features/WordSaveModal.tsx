"use client";

import * as React from "react";
import { BookOpen, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

/** FS-23 — Lưu từ vào sổ (WORD_LIBRARY + USER_SAVED_WORD). Dùng trong chat + trang Từ vựng. */

type Language = { id: number; code: string; name: string };

export type SavedWord = {
  id: number;
  personalNote?: string | null;
  source: "chat" | "manual";
  createdAt: string;
  word: {
    id: number;
    term: string;
    definition?: string | null;
    example?: string | null;
    level?: string | null;
    saveCount: number;
    isPublic: boolean;
    language: Language;
  };
};

export function WordSaveModal({
  open,
  onClose,
  initialWord = "",
  source,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  initialWord?: string;
  source: "chat" | "manual";
  onSaved?: (item: SavedWord, duplicated: boolean) => void;
}) {
  const t = useTranslations();
  const [term, setTerm] = React.useState(initialWord);
  const [definition, setDefinition] = React.useState("");
  const [example, setExample] = React.useState("");
  const [languages, setLanguages] = React.useState<Language[]>([]);
  const [languageId, setLanguageId] = React.useState<number | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");



  React.useEffect(() => {
    if (open) {
      setTerm(initialWord.trim());
      setDefinition("");
      setExample("");
      setError("");
      api<Language[]>("/languages")
        .then((langs) => {
          setLanguages(langs);
          setLanguageId((prev) => prev ?? langs.find((l) => l.code === "en")?.id ?? langs[0]?.id ?? null);
        })
        .catch(console.error);
    }
  }, [open, initialWord]);

  if (!open) return null;

  const handleSave = async () => {
    if (!term.trim() || !languageId) return;
    setSaving(true);
    setError("");
    try {
      const res = await api<{ saved: SavedWord; duplicated: boolean }>("/vocabulary/save-word", {
        method: "POST",
        body: {
          term: term.trim(),
          languageId,
          definition: definition.trim() || undefined,
          example: example.trim() || undefined,
          source,
        },
      });
      onSaved?.(res.saved, res.duplicated);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Đã có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-sm bg-surface rounded-t-3xl sm:rounded-3xl border border-border shadow-2xl animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-foreground">{t("vocabulary.modal_title")}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-muted/10 flex items-center justify-center text-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && <div className="rounded-xl bg-error/10 p-3 text-sm text-error">{error}</div>}

          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wide mb-2 block">
              {t("vocabulary.language_label")}
            </label>
            <div className="flex flex-wrap gap-2">
              {languages.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setLanguageId(l.id)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm font-semibold border-2 transition-all",
                    languageId === l.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-surface text-foreground hover:border-primary/40",
                  )}
                >
                  {l.name}
                </button>
              ))}
            </div>
          </div>



          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wide mb-2 block">
              {t("vocabulary.term_label")}
            </label>
            <input
              value={term}
              maxLength={100}
              onChange={(e) => setTerm(e.target.value)}
              placeholder={t("vocabulary.term_placeholder")}
              className="w-full h-11 rounded-xl border-2 border-border bg-transparent px-4 text-sm font-medium focus:outline-none focus:border-primary transition-colors"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wide mb-2 block">
              {t("vocabulary.definition_label")}
            </label>
            <textarea
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              placeholder={t("vocabulary.definition_placeholder")}
              className="w-full rounded-xl border-2 border-border bg-transparent p-3 text-sm focus:outline-none focus:border-primary transition-colors resize-none h-20"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wide mb-2 block">
              {t("vocabulary.example_label")}
            </label>
            <textarea
              value={example}
              onChange={(e) => setExample(e.target.value)}
              placeholder={t("vocabulary.example_placeholder")}
              className="w-full rounded-xl border-2 border-border bg-transparent p-3 text-sm focus:outline-none focus:border-primary transition-colors resize-none h-16"
            />
          </div>

          <Button className="w-full" size="lg" onClick={handleSave} disabled={!term.trim() || !languageId || saving}>
            <BookOpen className="w-4 h-4 mr-2" />
            {saving ? t("common.loading") : t("vocabulary.modal_title")}
          </Button>
        </div>
      </div>
    </div>
  );
}
