"use client";

import * as React from "react";
import Link from "next/link";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import {
  FileText,
  User,
  MapPin,
  Clock,
} from "lucide-react";
import { TIME_SLOTS, getTimezone } from "@/lib/timezones";
import { cn } from "@/lib/utils";
import { ChatStats, EndorsementBadges } from "@/components/features/Endorsements";
import { LanguagesCard } from "@/components/features/LanguagesCard";
import { useTranslations } from "next-intl";
import { getTopicTranslation, getIntentTranslation, getGenderTranslation } from "@/lib/i18nHelper";
import { PostCard, FeedPost } from "@/components/features/PostCard";
import { ReportDialog, useToast } from "@/components/features/TrustDialogs";
import { Avatar } from "@/components/ui/Avatar";
import { ProfileHeader } from "@/components/features/profile/ProfileHeader";
import { ProPlanCard } from "@/components/features/pricing/ProPlanCard";

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

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 pb-24">
      {/* Profile Header (Banner, Avatar, Info, Tabs) */}
      <ProfileHeader
        me={me}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        t={t}
      />

      {/* Grid Layout — Sidebar (Left) & Feed (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column — Sidebar */}
        <div className={cn(
          "lg:col-span-5 space-y-6",
          activeTab === "posts" && "block",
          activeTab === "about" && "block lg:col-span-12"
        )}>
          {/* EP-11 — lối vào gói Pro (đường duy nhất tới /pricing trên mobile) */}
          <ProPlanCard />

          {/* Trust Signals */}
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

          {/* Languages Card */}
          <LanguagesCard languages={me.languages} editHref="/profile/me/edit" />

          {/* Availability Card */}
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

          {/* Interests Card */}
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

          {/* User Posts Feed */}
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
      {reportTarget && (
        <ReportDialog
          open
          onClose={() => setReportTarget(null)}
          targetId={reportTarget.user.id}
          targetName={`Bài viết của ${reportTarget.user.displayName}`}
          targetType="post"
          targetContentId={reportTarget.id}
          onDone={() => showToast(t("report_success"))}
        />
      )}
      {toast}
    </div>
  );
}
