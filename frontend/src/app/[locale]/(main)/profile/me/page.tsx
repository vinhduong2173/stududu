"use client";

import * as React from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import {
  Pencil,
  Settings,
  Heart,
  FileText,
  User,
  MapPin,
  Clock,
  Camera,
} from "lucide-react";
import { TIME_SLOTS, getTimezone } from "@/lib/timezones";
import { ageFromDob, cn } from "@/lib/utils";
import { ChatStats, EndorsementBadges } from "@/components/features/Endorsements";
import { LanguagesCard } from "@/components/features/LanguagesCard";
import { useTranslations } from "next-intl";
import { getTopicTranslation, getIntentTranslation, getGenderTranslation } from "@/lib/i18nHelper";
import { PostCard, FeedPost } from "@/components/features/PostCard";
import { ReportDialog, useToast } from "@/components/features/TrustDialogs";

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
  languages: { id: number; role: string; level?: string | null; language: { id?: number; code?: string; name: string } }[];
  interests: { id: number; topic: { name: string } }[];
  matchPreference?: { languageFocus?: string | null; levelDesired?: string | null } | null;
};

export default function MyProfilePage() {
  const t = useTranslations("profile");
  const tDisc = useTranslations("discover");
  const tRoot = useTranslations();
  const [me, setMe] = React.useState<Me | null>(null);
  const [error, setError] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<"posts" | "about">("posts");
  const [myPosts, setMyPosts] = React.useState<FeedPost[]>([]);
  const [reportTarget, setReportTarget] = React.useState<FeedPost | null>(null);
  const { show: showToast, toast } = useToast();

  React.useEffect(() => {
    api<Me>("/users/me")
      .then((data) => {
        setMe(data);
        api<FeedPost[]>(`/community/feed?userId=${data.id}&targetUserId=${data.id}`)
          .then(setMyPosts)
          .catch(() => {});
      })
      .catch((err) => setError(err.message || t("loading_error")));
  }, [t]);

  if (error) return <div className="p-8 text-center text-error">{error}</div>;
  if (!me)
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );

  const teachLangs = me.languages.filter((l) => l.role === "native" || l.role === "fluent");
  const learnLangs = me.languages.filter((l) => l.role === "learning");

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 pb-24">
      {/* Header — cover banner + avatar đè mép */}
      <div className="bg-surface rounded-3xl border border-border shadow-sm overflow-hidden mb-6">
        {/* Cover Photo Banner */}
        <div className="sd-cover relative h-44 sm:h-60 md:h-72 lg:h-80 w-full group">
          <div className="pointer-events-none absolute -top-16 -right-10 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-8 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
        </div>
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-12 mb-4">
            <div className="inline-block rounded-full ring-4 ring-surface bg-surface">
              <Avatar
                src={me.avatarUrl ?? undefined}
                fallback={me.displayName.charAt(0)}
                size="xl"
                className="shadow-lg"
              />
            </div>
            <div className="flex gap-2 sm:gap-3">
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
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">
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

          {/* Navigation Tabs */}
          <div className="border-t border-border pt-3 mt-4">
            <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-1">
              <button
                onClick={() => setActiveTab("posts")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                  activeTab === "posts"
                    ? "bg-primary/10 text-primary"
                    : "text-muted hover:text-foreground hover:bg-surface-2"
                )}
              >
                <FileText className="w-4 h-4" />
                <span>{t("tab_posts")}</span>
              </button>

              <button
                onClick={() => setActiveTab("about")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                  activeTab === "about"
                    ? "bg-primary/10 text-primary"
                    : "text-muted hover:text-foreground hover:bg-surface-2"
                )}
              >
                <User className="w-4 h-4" />
                <span>{t("tab_about")}</span>
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Grid Layout — Sidebar (Left) & Feed (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column — Sidebar (Trust Badges, Intro, Languages, Availability, Interests) */}
        <div className={cn(
          "lg:col-span-5 space-y-6",
          activeTab === "posts" && "block",
          activeTab === "about" && "block lg:col-span-12"
        )}>
          {/* Trust Signals (Badge & Stats) */}
          <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <span>🏅</span> {t("trust_activity")}
            </h2>
            <div className="space-y-3">
              <EndorsementBadges userId={me.id} />
              <ChatStats userId={me.id} />
            </div>
          </div>

          {/* Intro Box */}
          {(activeTab === "posts" || activeTab === "about") && (
            <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span>📌</span> {t("intro")}
                </span>
                <Link href="/profile/me/edit" className="text-xs font-semibold text-primary hover:underline">
                  {t("edit_btn")}
                </Link>
              </h2>

              <p className="text-foreground leading-relaxed whitespace-pre-wrap text-sm italic bg-surface-2/60 p-4 rounded-2xl border border-border/50 mb-4">
                {me.bio ? `"${me.bio}"` : t("no_intro_me")}
              </p>

              <div className="space-y-3 text-sm text-foreground">
                {me.intent && (
                  <div className="flex items-center gap-3">
                    <span className="text-base">🎯</span>
                    <div>
                      <span className="font-semibold text-muted text-xs block uppercase">{t("intent")}</span>
                      <span className="font-medium text-foreground">{getIntentTranslation(me.intent, tRoot)}</span>
                    </div>
                  </div>
                )}

                {me.city && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-muted shrink-0" />
                    <div>
                      <span className="font-semibold text-muted text-xs block uppercase">{t("lives_in")}</span>
                      <span className="font-medium text-foreground">{me.city}</span>
                    </div>
                  </div>
                )}

                {me.gender && (
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-muted shrink-0" />
                    <div>
                      <span className="font-semibold text-muted text-xs block uppercase">{t("gender_label")}</span>
                      <span className="font-medium text-foreground">{getGenderTranslation(me.gender, tRoot)}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-muted shrink-0" />
                  <div>
                    <span className="font-semibold text-muted text-xs block uppercase">{t("timezone_label_short")}</span>
                    <span className="font-medium text-foreground">
                      {getTimezone(me.timezone).flag} {getTimezone(me.timezone).name}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Languages Card */}
          {(activeTab === "posts" || activeTab === "about") && (
            <LanguagesCard languages={me.languages} editHref="/profile/me/edit" />
          )}

          {/* Availability Card */}
          {(activeTab === "posts" || activeTab === "about") && (
            <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span>⏰</span> {t("availability")}
                </span>
                <Link href="/profile/me/edit" className="text-xs font-semibold text-primary hover:underline">
                  {t("edit_btn")}
                </Link>
              </h2>
              <div className="flex flex-wrap gap-2 items-center">
                {(me.availableSlots ?? []).length === 0 ? (
                  <p className="text-xs text-muted">{t("no_availability")}</p>
                ) : (
                  TIME_SLOTS.filter((s) => (me.availableSlots ?? []).includes(s.id)).map((s) => (
                    <Chip key={s.id} variant="secondary" className="text-xs py-1 px-3 rounded-xl">
                      ⏰ {s.label}
                    </Chip>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Interests Card */}
          {(activeTab === "posts" || activeTab === "about") && (
            <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span>⭐</span> {t("interests")}
                </span>
                <Link href="/profile/me/edit" className="text-xs font-semibold text-primary hover:underline">
                  {t("edit_btn")}
                </Link>
              </h2>
              <div className="flex flex-wrap gap-2">
                {me.interests.length === 0 && <p className="text-xs text-muted">{t("none")}</p>}
                {me.interests.map((i) => (
                  <Chip key={i.id} variant="outline" className="text-xs py-1 px-3 rounded-xl">
                    {getTopicTranslation(i.topic.name, tRoot)}
                  </Chip>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column — Posts Feed */}
        <div className={cn(
          "lg:col-span-7 space-y-6",
          activeTab === "posts" && "block",
          activeTab === "about" && "hidden"
        )}>
          {/* Post Creation Prompt Card */}
          {activeTab === "posts" && (
            <div className="bg-surface rounded-3xl p-5 shadow-sm border border-border">
              <div className="flex items-center gap-3">
                <Avatar
                  src={me.avatarUrl ?? undefined}
                  fallback={me.displayName.charAt(0)}
                  size="md"
                  className="shrink-0"
                />
                <Link
                  href="/community"
                  className="flex-1 bg-surface-2 hover:bg-border/60 text-muted rounded-2xl px-4 py-3 text-sm font-medium transition-colors cursor-pointer"
                >
                  {t("post_placeholder", { name: me.displayName })}
                </Link>
              </div>
            </div>
          )}

          {/* User Posts Card Feed */}
          {activeTab === "posts" && (
            <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span>💬</span> {t("posts_title")}
                </span>
                <span className="text-xs text-muted font-normal">{t("posts_count", { count: myPosts.length })}</span>
              </h2>

              {myPosts.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-border rounded-2xl bg-surface-2/40">
                  <FileText className="w-10 h-10 text-muted mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-semibold text-foreground">{t("no_posts_me")}</p>
                  <p className="text-xs text-muted mt-1">{t("create_post_hint")}</p>
                  <Button asChild size="sm" className="mt-4 rounded-xl">
                    <Link href="/community">{t("create_post_btn")}</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {myPosts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      currentUser={{ id: me.id, displayName: me.displayName }}
                      onPostUpdated={(updated) =>
                        setMyPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
                      }
                      onPostDeleted={(postId) =>
                        setMyPosts((prev) => prev.filter((p) => p.id !== postId))
                      }
                      onReportPost={(p) => setReportTarget(p)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
