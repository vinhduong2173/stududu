"use client";

import * as React from "react";
import { Award, Clock3, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

/** FS-26 — Endorsement định tính (BR-13: chỉ đếm theo nhãn, KHÔNG rating/điểm trung bình)
 *  FS-27 — Thống kê giờ chat & hội thoại (BR-14: cắt phiên idle > 30 phút, tính khi đọc) */

export const ENDORSEMENT_LABELS: { key: string; icon: string; name: string }[] = [
  { key: "lang_proficiency", icon: "🗣️", name: "Ngôn ngữ chuẩn" },
  { key: "social_knowledge", icon: "🌍", name: "Hiểu biết xã hội" },
  { key: "niche_expertise", icon: "🎓", name: "Chuyên môn sâu" },
  { key: "friendliness", icon: "😊", name: "Thân thiện" },
];

export function EndorsementBadges({ userId, refreshKey = 0 }: { userId: number; refreshKey?: number }) {
  const t = useTranslations();
  const [counts, setCounts] = React.useState<Record<string, number> | null>(null);

  React.useEffect(() => {
    api<Record<string, number>>(`/users/${userId}/endorsements`)
      .then(setCounts)
      .catch(console.error);
  }, [userId, refreshKey]);

  if (!counts) return null;
  const visible = ENDORSEMENT_LABELS.filter((l) => (counts[l.key] ?? 0) > 0);

  return (
    <div className="flex flex-wrap gap-2">
      {visible.length === 0 ? (
        <p className="text-sm text-muted">{t("profile.no_endorsements")}</p>
      ) : (
        visible.map((l) => (
          <span
            key={l.key}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-sm font-semibold"
          >
            {l.icon} {t(`profile.${l.key}`)} · {counts[l.key]}
          </span>
        ))
      )}
    </div>
  );
}

export function ChatStats({ userId }: { userId: number }) {
  const t = useTranslations();
  const [stats, setStats] = React.useState<{
    totalChatHours: number;
    conversationCount: number;
  } | null>(null);

  React.useEffect(() => {
    api<{ totalChatHours: number; conversationCount: number }>(`/users/${userId}/chat-stats`)
      .then(setStats)
      .catch(console.error);
  }, [userId]);

  if (!stats) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/10 text-secondary px-3 py-1 text-sm font-semibold">
        <Clock3 className="w-3.5 h-3.5" /> {t("profile.chat_hours", { count: stats.totalChatHours })}
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/10 text-secondary px-3 py-1 text-sm font-semibold">
        <MessageCircle className="w-3.5 h-3.5" /> {t("profile.conversations", { count: stats.conversationCount })}
      </span>
    </div>
  );
}

export function EndorseModal({
  open,
  onClose,
  targetId,
  targetName,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  targetId: number;
  targetName: string;
  onDone?: () => void;
}) {
  const t = useTranslations();
  const [selected, setSelected] = React.useState<string[]>([]);
  const [alreadyGiven, setAlreadyGiven] = React.useState<string[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setSelected([]);
      setError("");
      api<string[]>(`/users/${targetId}/endorsements/given`)
        .then(setAlreadyGiven)
        .catch(console.error);
    }
  }, [open, targetId]);

  if (!open) return null;

  const toggle = (key: string) =>
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const handleSubmit = async () => {
    if (selected.length === 0) return;
    setSaving(true);
    setError("");
    try {
      await api("/trust/endorse", {
        method: "POST",
        body: { receiverId: targetId, labels: selected },
      });
      onDone?.();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("common.error_generic"));
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
            <Award className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-foreground">{t("profile.endorse_title", { name: targetName })}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-muted/10 flex items-center justify-center text-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-muted">
            {t("profile.endorse_desc", { name: targetName })}
          </p>

          {error && <div className="rounded-xl bg-error/10 p-3 text-sm text-error">{error}</div>}

          <div className="space-y-2">
            {ENDORSEMENT_LABELS.map((l) => {
              const given = alreadyGiven.includes(l.key);
              const checked = selected.includes(l.key);
              return (
                <label
                  key={l.key}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border-2 transition-colors",
                    given
                      ? "border-success/30 bg-success/5 opacity-70 cursor-not-allowed"
                      : checked
                        ? "border-primary bg-primary/5 cursor-pointer"
                        : "border-border cursor-pointer hover:bg-muted/5",
                  )}
                >
                  <input
                    type="checkbox"
                    className="accent-primary h-4 w-4"
                    disabled={given}
                    checked={given || checked}
                    onChange={() => toggle(l.key)}
                  />
                  <span className="text-sm font-medium text-foreground">
                    {l.icon} {t(`profile.${l.key}`)}
                    {given && <span className="text-xs text-success ml-2">{t("profile.endorse_already_given")}</span>}
                  </span>
                </label>
              );
            })}
          </div>

          <Button className="w-full" onClick={handleSubmit} disabled={selected.length === 0 || saving}>
            {saving ? t("profile.sending") : t("profile.submit_endorse")}
          </Button>
        </div>
      </div>
    </div>
  );
}
