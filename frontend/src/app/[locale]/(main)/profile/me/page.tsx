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
  Globe,
  Activity,
  MapPin,
  Clock,
  Camera,
} from "lucide-react";
import { TIME_SLOTS, getTimezone } from "@/lib/timezones";
import { ageFromDob, cn } from "@/lib/utils";
import { ChatStats } from "@/components/features/Endorsements";
import { useTranslations, useLocale } from "next-intl";
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
  languages: { id: number; role: string; level?: string | null; language: { name: string } }[];
  interests: { id: number; topic: { name: string } }[];
  matchPreference?: { languageFocus?: string | null; levelDesired?: string | null } | null;
};

export default function MyProfilePage() {
  const t = useTranslations("profile");
  const tDisc = useTranslations("discover");
  const tRoot = useTranslations();
  const locale = useLocale();
  const [me, setMe] = React.useState<Me | null>(null);
  const [myPosts, setMyPosts] = React.useState<FeedPost[]>([]);
  const [error, setError] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<"posts" | "about" | "languages" | "activity">("posts");
  const [reportTarget, setReportTarget] = React.useState<FeedPost | null>(null);
  const { show: showToast, toast } = useToast();

  React.useEffect(() => {
    api<Me>("/users/me")
      .then((userData) => {
        setMe(userData);
        if (userData?.id) {
          api<any[]>(`/community/feed?userId=${userData.id}`)
            .then(setMyPosts)
            .catch(() => []);
        }
      })
      .catch((err) => setError(err.message || t("loading_error")));
  }, [t]);

  const handleTogglePostLike = async (postId: number, likedByMe: boolean) => {
    try {
      if (likedByMe) {
        await api(`/community/posts/${postId}/like`, { method: "DELETE" });
      } else {
        await api(`/community/posts/${postId}/like`, { method: "POST" });
      }
      setMyPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                likedByMe: !likedByMe,
                likeCount: p.likeCount + (likedByMe ? -1 : 1),
              }
            : p,
        ),
      );
    } catch (err: any) {
      console.error(err);
    }
  };

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
    <div className="max-w-6xl mx-auto px-2 sm:px-4 md:px-6 pb-20 pt-2">
      {/* Facebook Style Cover + Profile Header Card */}
      <div className="bg-surface rounded-3xl border border-border shadow-sm overflow-hidden mb-6">
        {/* Cover Photo Banner */}
        <div className="sd-cover relative h-44 sm:h-60 md:h-72 lg:h-80 w-full group">
          <div className="pointer-events-none absolute -top-16 -right-10 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-8 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
          
          {/* Change cover photo subtle button */}
          <Link
            href="/profile/me/edit"
            className="absolute bottom-4 right-4 bg-black/40 hover:bg-black/60 text-white backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md z-10"
          >
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">{t("edit_cover")}</span>
          </Link>
        </div>

        {/* Profile Info Header Body (Overlapping Avatar layout) */}
        <div className="px-4 sm:px-8 pb-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
            
            {/* Left: Overlapping Avatar (Negative top margin ONLY on avatar container) + Name & Subtitle */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
              <div className="-mt-16 sm:-mt-20 md:-mt-24 relative group shrink-0 z-10">
                <Avatar
                  src={me.avatarUrl ?? undefined}
                  fallback={me.displayName.charAt(0)}
                  size="xl"
                  className="w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44 ring-4 ring-surface shadow-2xl"
                />
                <Link
                  href="/profile/me/edit"
                  className="absolute bottom-2 right-2 p-2 bg-surface hover:bg-surface-2 text-foreground rounded-full shadow-md border border-border transition-colors z-20"
                  title={t("edit_avatar")}
                >
                  <Camera className="w-4 h-4 text-primary" />
                </Link>
              </div>

              <div className="pt-2 sm:pt-4 sm:pb-2">
                <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground flex items-center justify-center sm:justify-start gap-2">
                  {me.displayName}
                  {ageFromDob(me.dob) !== null && (
                    <span className="font-normal text-muted text-xl sm:text-2xl">, {ageFromDob(me.dob)}</span>
                  )}
                </h1>

                <p className="text-sm font-medium text-muted mt-1 flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <span>{me.email}</span>
                  {(me.city || me.gender) && (
                    <>
                      <span>·</span>
                      <span>{[getGenderTranslation(me.gender, tRoot), me.city].filter(Boolean).join(" · ")}</span>
                    </>
                  )}
                </p>

                {/* Subtitle count/friends indicator */}
                <div className="flex items-center justify-center sm:justify-start gap-3 sm:gap-4 mt-2 text-xs font-semibold text-muted flex-wrap">
                  <span>💬 {t("posts_count", { count: myPosts.length })}</span>
                  <span>·</span>
                  <span>🗣️ {t("languages_count", { count: me.languages.length })}</span>
                  <span>·</span>
                  <span>⭐ {t("interests_count", { count: me.interests.length })}</span>
                </div>
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center justify-center sm:justify-end gap-2.5 sm:pb-3">
              <Button asChild className="rounded-xl font-semibold shadow-sm px-4 bg-primary hover:bg-primary-hover text-white">
                <Link href="/profile/me/edit">
                  <Pencil className="h-4 w-4 mr-2" /> {t("edit_profile")}
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl font-semibold px-4 border-border">
                <Link href="/settings">
                  <Settings className="h-4 w-4 mr-2" /> {t("settings")}
                </Link>
              </Button>
            </div>

          </div>

          {/* Facebook Header Divider & Navigation Tabs */}
          <div className="border-t border-border pt-2">
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

              <button
                onClick={() => setActiveTab("languages")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                  activeTab === "languages"
                    ? "bg-primary/10 text-primary"
                    : "text-muted hover:text-foreground hover:bg-surface-2"
                )}
              >
                <Globe className="w-4 h-4" />
                <span>{t("tab_languages")}</span>
              </button>

              <button
                onClick={() => setActiveTab("activity")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                  activeTab === "activity"
                    ? "bg-primary/10 text-primary"
                    : "text-muted hover:text-foreground hover:bg-surface-2"
                )}
              >
                <Activity className="w-4 h-4" />
                <span>{t("tab_activity")}</span>
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content Layout — Facebook 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column — Facebook Sidebar (Intro, Languages, Availability, Interests) */}
        <div className={cn(
          "lg:col-span-5 space-y-6",
          activeTab === "posts" && "block",
          activeTab === "about" && "block lg:col-span-12",
          activeTab === "languages" && "block lg:col-span-12",
          activeTab === "activity" && "hidden lg:block"
        )}>

          {/* Facebook Intro Box (Giới thiệu) */}
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
                      {getTimezone(me.timezone).flag} {getTimezone(me.timezone).name} (UTC
                      {getTimezone(me.timezone).offset >= 0 ? "+" : ""}
                      {getTimezone(me.timezone).offset})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ngôn ngữ Card */}
          {(activeTab === "posts" || activeTab === "languages" || activeTab === "about") && (
            <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span>🗣️</span> {t("languages")}
                </span>
                <Link href="/profile/me/edit" className="text-xs font-semibold text-primary hover:underline">
                  {t("edit_btn")}
                </Link>
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">{t("speaks_label")}</p>
                  <div className="flex flex-wrap gap-2">
                    {teachLangs.length === 0 && <p className="text-xs text-muted">{t("none")}</p>}
                    {teachLangs.map((l) => (
                      <Chip key={l.id} variant="default" className="text-xs py-1 px-3 rounded-xl font-medium">
                        {l.language.name} {l.role === "native" ? `(${t("native_label")})` : `(${t("fluent_label")})`}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div className="h-px bg-border w-full" />
                <div>
                  <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">{t("learns_label")}</p>
                  <div className="flex flex-wrap gap-2">
                    {learnLangs.length === 0 && <p className="text-xs text-muted">{t("none")}</p>}
                    {learnLangs.map((l) => (
                      <Chip key={l.id} variant="secondary" className="text-xs py-1 px-3 rounded-xl font-medium">
                        {l.language.name} ({t("level_label")} {l.level})
                      </Chip>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Khung giờ rảnh Card */}
          {(activeTab === "posts" || activeTab === "about" || activeTab === "languages") && (
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

          {/* Sở thích Card */}
          {(activeTab === "posts" || activeTab === "languages" || activeTab === "about") && (
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
                {me.interests.length === 0 && <p className="text-xs text-muted">{t("no_interests")}</p>}
                {me.interests.map((i) => (
                  <Chip key={i.id} variant="outline" className="text-xs py-1 px-3 rounded-xl">
                    {getTopicTranslation(i.topic.name, tRoot)}
                  </Chip>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Column — Facebook Posts Feed & Practice Stats */}
        <div className={cn(
          "lg:col-span-7 space-y-6",
          activeTab === "posts" && "block",
          activeTab === "activity" && "block lg:col-span-12",
          activeTab === "about" && "hidden lg:block",
          activeTab === "languages" && "hidden lg:block"
        )}>

          {/* Post Creation Prompt Card */}
          {(activeTab === "posts" || activeTab === "activity") && (
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
          {(activeTab === "posts" || activeTab === "activity") && (
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

          {/* Hoạt động luyện tập (Practice Activity / ChatStats) */}
          {(activeTab === "posts" || activeTab === "activity") && (
            <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <span>⏱️</span> {t("practice_activity")}
              </h2>
              <ChatStats userId={me.id} />
            </div>
          )}

        </div>

      </div>

      {reportTarget && (
        <ReportDialog
          open
          onClose={() => setReportTarget(null)}
          targetId={reportTarget.user.id}
          targetName={reportTarget.user.displayName}
          targetType="post"
          targetContentId={reportTarget.id}
          onDone={() => showToast(t("report_success_toast"))}
        />
      )}

      {toast}
    </div>
  );
}

