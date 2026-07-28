"use client";

import * as React from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { Pencil, Settings } from "lucide-react";
import { TIME_SLOTS, getTimezone } from "@/lib/timezones";
import { ageFromDob } from "@/lib/utils";
import { ChatStats, EndorsementBadges } from "@/components/features/Endorsements";
import { useTranslations } from "next-intl";
import { getTopicTranslation, getIntentTranslation } from "@/lib/i18nHelper";

/** MÀN 12 — Hồ sơ của tôi (US-06): xem hồ sơ + thanh % hoàn thiện + lối vào chỉnh sửa/Cài đặt. */

type Me = {
  id: number;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  intent?: string | null;
  gender?: string | null;
  dob?: string | null;
  city?: string | null;
  timezone?: string | null;
  availableSlots?: string[];
  languages: { id: number; role: string; level?: string | null; language: { name: string } }[];
  interests: { id: number; topic: { name: string } }[];
  matchPreference?: { languageFocus?: string | null; levelDesired?: string | null } | null;
};

/** % hoàn thiện + danh sách mục còn thiếu (gợi ý cải thiện hồ sơ) */
function computeCompletion(me: Me, t: any): { percent: number; missing: string[] } {
  const checks: { ok: boolean; weight: number; hint: string }[] = [
    { ok: !!me.avatarUrl, weight: 20, hint: t("hint_avatar") },
    { ok: !!me.bio?.trim(), weight: 20, hint: t("hint_bio") },
    {
      ok: me.languages.some((l) => l.role === "native" || l.role === "fluent"),
      weight: 20,
      hint: t("hint_teach"),
    },
    {
      ok: me.languages.some((l) => l.role === "learning"),
      weight: 20,
      hint: t("hint_learn"),
    },
    { ok: me.interests.length > 0, weight: 10, hint: t("hint_interests") },
    { ok: !!me.intent, weight: 10, hint: t("hint_intent") },
  ];
  const percent = checks.reduce((sum, c) => sum + (c.ok ? c.weight : 0), 0);
  return { percent, missing: checks.filter((c) => !c.ok).map((c) => c.hint) };
}

export default function MyProfilePage() {
  const t = useTranslations("profile");
  const tDisc = useTranslations("discover");
  const tRoot = useTranslations();
  const [me, setMe] = React.useState<Me | null>(null);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    api<Me>("/users/me")
      .then(setMe)
      .catch((err) => setError(err.message || t("loading_error")));
  }, [t]);

  if (error) return <div className="p-8 text-center text-error">{error}</div>;
  if (!me)
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );

  const { percent, missing } = computeCompletion(me, t);
  const teachLangs = me.languages.filter((l) => l.role === "native" || l.role === "fluent");
  const learnLangs = me.languages.filter((l) => l.role === "learning");

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 pb-24">
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-6">
        <Avatar
          src={me.avatarUrl ?? undefined}
          fallback={me.displayName.charAt(0)}
          size="xl"
          className="mb-4 shadow-lg"
        />
        <h1 className="text-3xl font-bold text-foreground">
          {me.displayName}
          {ageFromDob(me.dob) !== null && (
            <span className="font-medium text-muted">, {ageFromDob(me.dob)}</span>
          )}
        </h1>
        <p className="text-muted mt-1">{me.email}</p>
        {(me.city || me.gender) && (
          <p className="text-sm text-muted mt-1">
            {[me.gender, me.city].filter(Boolean).join(" · ")}
          </p>
        )}

        <div className="flex gap-3 mt-5">
          <Button asChild size="sm">
            <Link href="/profile/me/edit">
              <Pencil className="h-4 w-4 mr-2" /> {t("edit_profile")}
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/settings">
              <Settings className="h-4 w-4 mr-2" /> {t("settings")}
            </Link>
          </Button>
        </div>
      </div>

      {/* Thanh hoàn thiện hồ sơ */}
      <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="font-semibold text-foreground">{t("completion")}</p>
          <p className="font-bold text-primary">{percent}%</p>
        </div>
        <div className="h-2.5 rounded-full bg-muted/15 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
        {missing.length > 0 && (
          <ul className="mt-4 space-y-1.5">
            {missing.map((hint) => (
              <li key={hint} className="text-sm text-muted flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-warning shrink-0" /> {hint}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Nội dung hồ sơ */}
      <div className="space-y-8 bg-surface rounded-3xl p-6 shadow-sm border border-border">
        {/* FS-26/27 — trust signals */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <span>🏅</span> {t("trust_activity")}
          </h2>
          <div className="space-y-3">
            <EndorsementBadges userId={me.id} />
            <ChatStats userId={me.id} />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <span>🗣️</span> {t("languages")}
          </h2>
          <div className="flex flex-col gap-4 bg-muted/5 p-4 rounded-2xl">
            <div>
              <p className="text-sm font-semibold text-muted mb-2 uppercase tracking-wider">{t("can_teach")}</p>
              <div className="flex flex-wrap gap-2">
                {teachLangs.length === 0 && <p className="text-sm text-muted">{t("none")}</p>}
                {teachLangs.map((l) => (
                  <Chip key={l.id} variant="default" className="text-sm py-1">
                    {l.language.name} {l.role === "native" ? tDisc("card_native") : tDisc("card_fluent")}
                  </Chip>
                ))}
              </div>
            </div>
            <div className="h-px bg-border w-full" />
            <div>
              <p className="text-sm font-semibold text-muted mb-2 uppercase tracking-wider">{t("want_learn")}</p>
              <div className="flex flex-wrap gap-2">
                {learnLangs.length === 0 && <p className="text-sm text-muted">{t("none")}</p>}
                {learnLangs.map((l) => (
                  <Chip key={l.id} variant="secondary" className="text-sm py-1">
                    {l.language.name} (Level {l.level})
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <span>👋</span> {t("intro")}
          </h2>
          <p className="text-foreground leading-relaxed whitespace-pre-wrap">
            {me.bio || t("no_intro_me")}
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <span>🎯</span> {t("intent")}
          </h2>
          <Chip variant="outline" className="text-sm font-medium py-1">
            {getIntentTranslation(me.intent, tRoot)}
          </Chip>
        </div>

        <div>
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <span>⏰</span> {t("availability")}
          </h2>
          <div className="flex flex-wrap gap-2 items-center">
            <Chip variant="outline" className="text-sm py-1">
              {getTimezone(me.timezone).flag} {getTimezone(me.timezone).name} (UTC
              {getTimezone(me.timezone).offset >= 0 ? "+" : ""}
              {getTimezone(me.timezone).offset})
            </Chip>
            {(me.availableSlots ?? []).length === 0 ? (
              <p className="text-sm text-muted">{t("no_availability")}</p>
            ) : (
              TIME_SLOTS.filter((s) => (me.availableSlots ?? []).includes(s.id)).map((s) => (
                <Chip key={s.id} variant="secondary" className="text-sm py-1">
                  ⏰ {s.label}
                </Chip>
              ))
            )}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <span>⭐</span> {t("interests")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {me.interests.length === 0 && <p className="text-sm text-muted">{t("no_interests")}</p>}
            {me.interests.map((i) => (
              <Chip key={i.id} variant="outline" className="text-sm py-1">
                {getTopicTranslation(i.topic.name, tRoot)}
              </Chip>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
