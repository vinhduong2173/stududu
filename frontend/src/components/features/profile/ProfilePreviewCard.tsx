"use client";

import * as React from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import { Eye, Heart, MapPin, Sparkles } from "lucide-react";
import { getTopicTranslation } from "@/lib/i18nHelper";
import { INTENTS, Topic, UserLanguageItem } from "@/hooks/useProfileEdit";

interface ProfilePreviewCardProps {
  t: any;
  tOnboard: any;
  tDisc: any;
  tRoot: any;
  displayName: string;
  avatarUrl: string;
  previewAge: number | null;
  city: string;
  country?: string;
  teachPreview?: UserLanguageItem;
  learnPreview?: UserLanguageItem;
  previewTopics: Topic[];
  getLangName: (id: number) => string;
  intent: string;
  setIntent: (val: string) => void;
}

export function ProfilePreviewCard({
  t,
  tOnboard,
  tDisc,
  tRoot,
  displayName,
  avatarUrl,
  previewAge,
  city,
  country,
  teachPreview,
  learnPreview,
  previewTopics,
  getLangName,
  intent,
  setIntent,
}: ProfilePreviewCardProps) {
  const selectClass =
    "flex h-12 rounded-xl border border-border bg-transparent px-4 py-2 outline-none focus:border-primary font-medium text-foreground";

  return (
    <div className="space-y-6">
      {/* Xem trước — hồ sơ người khác nhìn thấy */}
      <section className="bg-surface rounded-3xl p-5 shadow-sm border border-border lg:sticky lg:top-6">
        <div className="flex items-center gap-2 mb-1">
          <Eye className="h-4 w-4 text-primary" />
          <h2 className="font-display text-base font-bold text-foreground">{t("preview")}</h2>
        </div>
        <p className="text-xs text-muted mb-4">{t("preview_hint")}</p>

        <div className="rounded-2xl border border-border p-4">
          <div className="flex items-center gap-3">
            <Avatar src={avatarUrl || undefined} fallback={displayName.charAt(0) || "?"} size="lg" />
            <div className="min-w-0">
              <p className="font-bold text-foreground truncate">
                {displayName || t("your_name")}
                {previewAge !== null && <span className="font-medium text-muted">, {previewAge}</span>}
              </p>
              <p className="text-xs text-muted flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
                {t("preview_online")}
                {(city || country) && (
                  <span className="inline-flex items-center gap-0.5">
                    · <MapPin className="w-3 h-3" /> {[city, country].filter(Boolean).join(", ")}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted shrink-0">{t("preview_speaks")}</span>
              {teachPreview ? (
                <Chip className="text-xs py-0.5">
                  {getLangName(teachPreview.languageId)} (
                  {teachPreview.role === "native" ? tDisc("card_native") : tDisc("card_fluent")})
                </Chip>
              ) : (
                <span className="text-xs text-muted">{t("preview_not_added")}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted shrink-0">{t("preview_learns")}</span>
              {learnPreview ? (
                <Chip variant="secondary" className="text-xs py-0.5">
                  {getLangName(learnPreview.languageId)} ({tOnboard(`level_${learnPreview.level}`)})
                </Chip>
              ) : (
                <span className="text-xs text-muted">{t("preview_not_added")}</span>
              )}
            </div>
          </div>

          {previewTopics.length > 0 && (
            <div className="mt-4 rounded-xl bg-primary/5 p-3">
              <p className="text-xs font-semibold text-primary mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t("shared_interests")}</span>
              </p>
              <p className="text-xs text-foreground leading-relaxed">
                {previewTopics.map((tp) => getTopicTranslation(tp.name, tRoot)).join(", ")}
              </p>
            </div>
          )}

          <div className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-semibold text-muted">
            <Heart className="w-4 h-4" /> {t("preview_like")}
          </div>
        </div>
      </section>

      {/* Mục tiêu luyện tập */}
      <section className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
        <h2 className="font-display text-lg font-bold text-foreground mb-1">{tOnboard("intent_label")}</h2>
        <p className="text-sm text-muted mb-3">{t("intent_hint")}</p>
        <select className={`${selectClass} w-full`} value={intent} onChange={(e) => setIntent(e.target.value)}>
          {INTENTS.map((i) => (
            <option key={i} value={i}>
              {i === "Giao tiếp casual"
                ? tOnboard("intent_casual")
                : i === "Thi cử"
                  ? tOnboard("intent_exam")
                  : i === "Du lịch"
                    ? tOnboard("intent_travel")
                    : i === "Làm việc"
                      ? tOnboard("intent_work")
                      : i}
            </option>
          ))}
        </select>
      </section>
    </div>
  );
}
