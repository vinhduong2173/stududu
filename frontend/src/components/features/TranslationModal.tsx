"use client";

import * as React from "react";
import { ArrowLeftRight, Languages, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api, ApiError } from "@/lib/api";
import { TRANSLATE_LANGS } from "@/lib/timezones";

/** Bảng dịch (theo bản Figma Make) — gọi POST /translate của backend. */

export function TranslationModal({
  open,
  onClose,
  initialText = "",
}: {
  open: boolean;
  onClose: () => void;
  initialText?: string;
}) {
  const [sourceLang, setSourceLang] = React.useState("auto");
  const [targetLang, setTargetLang] = React.useState("vi");
  const [inputText, setInputText] = React.useState(initialText);
  const [outputText, setOutputText] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setInputText(initialText);
      setOutputText("");
      setError("");
    }
  }, [open, initialText]);

  if (!open) return null;

  const handleSwap = () => {
    const newSource = targetLang;
    const newTarget = sourceLang === "auto" ? "en" : sourceLang;
    setSourceLang(newSource);
    setTargetLang(newTarget);
    setInputText(outputText);
    setOutputText(inputText);
  };

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await api<{ translation: string }>("/translate", {
        method: "POST",
        body: { text: inputText.trim(), source: sourceLang, target: targetLang },
      });
      setOutputText(res.translation);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Dịch thất bại, thử lại sau");
    } finally {
      setLoading(false);
    }
  };

  const sourceLangObj = TRANSLATE_LANGS.find((l) => l.code === sourceLang) ?? TRANSLATE_LANGS[0];
  const targetLangObj = TRANSLATE_LANGS.find((l) => l.code === targetLang) ?? TRANSLATE_LANGS[1];
  const selectClass =
    "flex-1 rounded-xl border-2 border-border px-3 py-2 text-sm font-medium focus:outline-none focus:border-primary bg-surface";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-2xl bg-surface rounded-t-3xl sm:rounded-3xl border border-border shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Languages className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-foreground">Dịch</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-muted/10 flex items-center justify-center text-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
          <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)} className={selectClass}>
            {TRANSLATE_LANGS.map((l) => (
              <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
            ))}
          </select>
          <button
            onClick={handleSwap}
            className="w-10 h-10 rounded-full border-2 border-border flex items-center justify-center hover:bg-primary/10 hover:border-primary text-muted hover:text-primary transition-all shrink-0"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>
          <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)} className={selectClass}>
            {TRANSLATE_LANGS.filter((l) => l.code !== "auto").map((l) => (
              <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col sm:flex-row gap-0 sm:gap-4 p-4 flex-1 overflow-hidden">
          <div className="flex-1 flex flex-col">
            <span className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
              {sourceLangObj.flag} {sourceLangObj.name}
            </span>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Nhập văn bản cần dịch..."
              rows={5}
              className="flex-1 w-full rounded-xl border-2 border-border bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.ctrlKey) void handleTranslate();
              }}
            />
            <p className="text-[10px] text-muted mt-1">Ctrl+Enter để dịch nhanh</p>
          </div>

          <div className="w-px bg-border hidden sm:block" />
          <div className="h-px bg-border sm:hidden my-2" />

          <div className="flex-1 flex flex-col">
            <span className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
              {targetLangObj.flag} {targetLangObj.name}
            </span>
            <div
              className={`flex-1 w-full rounded-xl border-2 border-border px-4 py-3 text-sm min-h-[120px] ${
                loading ? "bg-muted/10 animate-pulse" : "bg-muted/5"
              }`}
            >
              {loading ? (
                <span className="text-muted">Đang dịch...</span>
              ) : error ? (
                <span className="text-error">{error}</span>
              ) : outputText ? (
                <span className="text-foreground">{outputText}</span>
              ) : (
                <span className="text-muted">Kết quả dịch hiển thị ở đây</span>
              )}
            </div>
          </div>
        </div>

        <div className="px-5 pb-5 pt-2">
          <Button className="w-full" size="lg" onClick={handleTranslate} disabled={loading || !inputText.trim()}>
            <Languages className="w-4 h-4 mr-2" /> {loading ? "Đang dịch..." : "Dịch"}
          </Button>
        </div>
      </div>
    </div>
  );
}
