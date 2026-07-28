"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import {
  Heart,
  ArrowLeft,
  MoreHorizontal,
  Flag,
  ShieldBan,
  MessageCircle,
  MapPin,
  FileText,
  User,
  Globe,
  Activity,
  Clock,
} from "lucide-react";
import { api } from "@/lib/api";
import { ageFromDob, cn } from "@/lib/utils";
import { ReportDialog, BlockDialog, useToast } from "@/components/features/TrustDialogs";
import { MatchModal } from "@/components/features/MatchModal";
import {
  ChatStats,
  EndorseModal,
} from "@/components/features/Endorsements";
import { useTranslations, useLocale } from "next-intl";
import { getTopicTranslation, getIntentTranslation, getGenderTranslation } from "@/lib/i18nHelper";
import { getTimezone } from "@/lib/timezones";
import { PostCard, FeedPost } from "@/components/features/PostCard";

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("profile");
  const tDisc = useTranslations("discover");
  const tRoot = useTranslations();
  const locale = useLocale();
  const id = typeof params.id === "string" ? parseInt(params.id) : 0;

  const [user, setUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [reportOpen, setReportOpen] = React.useState(false);
  const [blockOpen, setBlockOpen] = React.useState(false);
  const [matchOpen, setMatchOpen] = React.useState(false);
  const [endorseOpen, setEndorseOpen] = React.useState(false);
  const [endorseRefresh, setEndorseRefresh] = React.useState(0);
  const [liked, setLiked] = React.useState(false);
  const [conversationId, setConversationId] = React.useState<number | null>(null);
  const [activeTab, setActiveTab] = React.useState<"posts" | "about" | "languages" | "activity">("posts");
  const { show: showToast, toast } = useToast();

  const [userPosts, setUserPosts] = React.useState<FeedPost[]>([]);
  const [currentUser, setCurrentUser] = React.useState<{ id: number; displayName: string } | null>(null);
  const [reportPostTarget, setReportPostTarget] = React.useState<FeedPost | null>(null);

  React.useEffect(() => {
    if (id) fetchProfile();
    api<{ id: number; displayName: string }>("/users/me")
      .then(setCurrentUser)
      .catch(() => null);
  }, [id]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const [data, relation, postsData] = await Promise.all([
        api<any>(`/users/${id}`),
        api<{ liked: boolean; conversationId: number | null }>(`/matching/relation/${id}`),
        api<any[]>(`/community/feed?userId=${id}`).catch(() => []),
      ]);
      setUser(data);
      setLiked(relation.liked);
      setConversationId(relation.conversationId);
      setUserPosts(postsData);
    } catch (err: any) {
      setError(err.message || t("loading_error_other"));
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePostLike = async (postId: number, likedByMe: boolean) => {
    try {
      if (likedByMe) {
        await api(`/community/posts/${postId}/like`, { method: "DELETE" });
      } else {
        await api(`/community/posts/${postId}/like`, { method: "POST" });
      }
      setUserPosts((prev) =>
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
      showToast(err.message || "Error");
    }
  };

  const handleLike = async () => {
    try {
      const result = await api<{ mutual: boolean; conversation: { id: number } | null }>(
        `/matching/like/${id}`,
        { method: "POST" },
      );
      setLiked(true);
      setConversationId(result.conversation?.id ?? null);
      if (result.mutual) {
        setMatchOpen(true);
      } else {
        showToast(t("like_success_toast", { name: user.displayName }));
      }
    } catch (err: any) {
      showToast(err.message || tDisc("error_generic") || "Error");
    }
  };

  const handleUnlike = async () => {
    try {
      await api(`/matching/like/${id}`, { method: "DELETE" });
      setLiked(false);
      setConversationId(null);
      showToast(tDisc("card_unliked_toast", { name: user.displayName }) || "Unliked");
    } catch (err: any) {
      showToast(err.message || "Failed to unlike");
    }
  };

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (error || !user) return <div className="p-8 text-center text-error">{error || t("user_not_found")}</div>;

  const isOnline = user.lastActive ? new Date(user.lastActive).getTime() > Date.now() - 5 * 60 * 1000 : false;
  const teachLangs = user.languages.filter((l: any) => l.role === "native" || l.role === "fluent");
  const learnLangs = user.languages.filter((l: any) => l.role === "learning");

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4 md:px-6 pb-20 pt-2">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-semibold text-muted hover:text-foreground transition-colors py-2 px-3 rounded-xl hover:bg-surface border border-transparent hover:border-border"
        >
          <ArrowLeft className="w-4 h-4" /> {tRoot("onboarding.back_btn") || "Quay lại"}
        </button>
        <div className="relative">
          <button
            className="p-2 hover:bg-surface rounded-full transition-colors border border-transparent hover:border-border"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <MoreHorizontal className="w-5 h-5 text-foreground" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-10 z-20 w-48 rounded-2xl border border-border bg-surface shadow-xl py-2 animate-in fade-in zoom-in-95 duration-150">
                <button
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/10"
                  onClick={() => { setMenuOpen(false); setReportOpen(true); }}
                >
                  <Flag className="h-4 w-4 text-warning" /> {t("report")}
                </button>
                <button
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-error hover:bg-error/5"
                  onClick={() => { setMenuOpen(false); setBlockOpen(true); }}
                >
                  <ShieldBan className="h-4 w-4" /> {t("block")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <MatchModal
        isOpen={matchOpen}
        onClose={() => {
          setMatchOpen(false);
          router.push("/discover");
        }}
        partnerName={user.displayName}
        partnerAvatar={user.avatarUrl}
        conversationId={conversationId ?? undefined}
      />
      <EndorseModal
        open={endorseOpen}
        onClose={() => setEndorseOpen(false)}
        targetId={id}
        targetName={user.displayName}
        onDone={() => {
          setEndorseRefresh((v) => v + 1);
          showToast(t("endorse_success_toast"));
        }}
      />
      <ReportDialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        targetId={id}
        targetName={user.displayName}
        onDone={() => showToast(t("report_success_toast"))}
      />
      <BlockDialog
        open={blockOpen}
        onClose={() => setBlockOpen(false)}
        targetId={id}
        targetName={user.displayName}
        onDone={() => { showToast(t("block_success_toast", { name: user.displayName })); router.push("/discover"); }}
      />
      {toast}

      <div className="bg-surface rounded-3xl border border-border shadow-sm overflow-hidden mb-6">
        <div className="sd-cover relative h-44 sm:h-60 md:h-72 lg:h-80 w-full">
          <div className="pointer-events-none absolute -top-16 -right-10 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-8 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
        </div>
        
        <div className="px-4 sm:px-8 pb-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
              <div className="-mt-16 sm:-mt-20 md:-mt-24 relative group shrink-0 z-10">
                <Avatar
                  src={user.avatarUrl}
                  fallback={user.displayName.charAt(0)}
                  size="xl"
                  online={isOnline}
                  className="w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44 ring-4 ring-surface shadow-2xl"
                />
              </div>
              <div className="pt-2 sm:pt-4 sm:pb-2">
                <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground flex items-center justify-center sm:justify-start gap-2">
                  {user.displayName}
                  {ageFromDob(user.dob) !== null && (
                    <span className="font-normal text-muted text-xl sm:text-2xl">, {ageFromDob(user.dob)}</span>
                  )}
                </h1>
                
                <p className="text-sm font-medium text-muted mt-1 flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5">
                    <span className={`inline-block h-2.5 w-2.5 rounded-full ${isOnline ? "bg-success" : "bg-muted"}`} />
                    {isOnline ? tDisc("card_online") : tDisc("card_recent")}
                  </span>
                  {user.city && (
                    <span>· {user.city}</span>
                  )}
                  {user.gender && <span>· {getGenderTranslation(user.gender, tRoot)}</span>}
                </p>

                <div className="flex items-center justify-center sm:justify-start gap-3 sm:gap-4 mt-2 text-xs font-semibold text-muted flex-wrap">
                  <span>💬 {t("posts_count", { count: userPosts.length })}</span>
                  <span>·</span>
                  <span>🗣️ {t("languages_count", { count: user.languages.length })}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center sm:justify-end gap-2.5 sm:pb-3">
              {liked ? (
                <>
                  <Button
                    variant="secondary"
                    className="rounded-xl font-semibold shadow-sm px-4 bg-primary/10 text-primary hover:bg-primary/20"
                    onClick={() => router.push(conversationId ? `/inbox?conversation=${conversationId}` : "/inbox")}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    {t("message_btn")}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleUnlike}
                    className="text-error hover:bg-error/10 rounded-xl"
                  >
                    <Heart className="w-4 h-4 mr-1.5 fill-error text-error" />
                    {tDisc("card_liked")}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleLike}
                  className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-semibold rounded-xl px-5 shadow-sm"
                >
                  <Heart className="w-4 h-4 mr-2 fill-current" />
                  {tDisc("card_like")}
                </Button>
              )}
            </div>
          </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className={cn(
          "lg:col-span-5 space-y-6",
          activeTab === "posts" && "block",
          activeTab === "about" && "block lg:col-span-12",
          activeTab === "languages" && "block lg:col-span-12",
          activeTab === "activity" && "hidden lg:block"
        )}>
          {(activeTab === "posts" || activeTab === "about") && (
            <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
              <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <span>📌</span> {t("intro")}
              </h2>
              <p className="text-foreground leading-relaxed whitespace-pre-wrap text-sm italic bg-surface-2/60 p-4 rounded-2xl border border-border/50 mb-4">
                {user.bio ? `"${user.bio}"` : t("no_intro_other")}
              </p>
              <div className="space-y-3 text-sm text-foreground">
                {user.intent && (
                  <div className="flex items-center gap-3">
                    <span className="text-base">🎯</span>
                    <div>
                      <span className="font-semibold text-muted text-xs block uppercase">{t("intent")}</span>
                      <span className="font-medium text-foreground">{getIntentTranslation(user.intent, tRoot)}</span>
                    </div>
                  </div>
                )}
                {user.city && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-muted shrink-0" />
                    <div>
                      <span className="font-semibold text-muted text-xs block uppercase">{t("lives_in")}</span>
                      <span className="font-medium text-foreground">{user.city}</span>
                    </div>
                  </div>
                )}
                {user.gender && (
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-muted shrink-0" />
                    <div>
                      <span className="font-semibold text-muted text-xs block uppercase">{t("gender_label")}</span>
                      <span className="font-medium text-foreground">{getGenderTranslation(user.gender, tRoot)}</span>
                    </div>
                  </div>
                )}
                {user.timezone && (
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-muted shrink-0" />
                    <div>
                      <span className="font-semibold text-muted text-xs block uppercase">{t("timezone_label_short")}</span>
                      <span className="font-medium text-foreground">
                        {getTimezone(user.timezone).flag} {getTimezone(user.timezone).name}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {(activeTab === "posts" || activeTab === "languages" || activeTab === "about") && (
            <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <span>🗣️</span> {t("languages")}
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">{t("speaks_label")}</p>
                  <div className="flex flex-wrap gap-2">
                    {teachLangs.length === 0 && <p className="text-xs text-muted">{t("none")}</p>}
                    {teachLangs.map((l: any) => (
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
                    {learnLangs.map((l: any) => (
                      <Chip key={l.id} variant="secondary" className="text-xs py-1 px-3 rounded-xl font-medium">
                        {l.language.name} ({t("level_label")} {l.level})
                      </Chip>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          {(activeTab === "posts" || activeTab === "languages" || activeTab === "about") && user.interests && user.interests.length > 0 && (
            <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <span>⭐</span> {t("shared_interests")}
              </h2>
              <div className="flex flex-wrap gap-2">
                {user.interests.map((i: any) => (
                  <Chip key={i.id} variant="outline" className="text-xs py-1 px-3 rounded-xl">
                    {getTopicTranslation(i.topic.name, tRoot)}
                  </Chip>
                ))}
              </div>
            </div>
          )}
          <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
            <h2 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
              <span>🛡️</span> {t("safety_title")}
            </h2>
            <p className="text-xs text-muted mb-4 leading-relaxed">
              {t("safety_desc")}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReportOpen(true)}
                className="w-full text-xs font-semibold text-warning border-warning/30 hover:bg-warning/10"
              >
                <Flag className="w-3.5 h-3.5 mr-1.5" /> {t("report")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBlockOpen(true)}
                className="w-full text-xs font-semibold text-error border-error/30 hover:bg-error/10"
              >
                <ShieldBan className="w-3.5 h-3.5 mr-1.5" /> {t("block")}
              </Button>
            </div>
          </div>
        </div>

        <div className={cn(
          "lg:col-span-7 space-y-6",
          activeTab === "posts" && "block",
          activeTab === "activity" && "block lg:col-span-12",
          activeTab === "about" && "hidden lg:block",
          activeTab === "languages" && "hidden lg:block"
        )}>
          {(activeTab === "posts" || activeTab === "activity") && (
            <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span>💬</span> {t("posts_title")}
                </span>
                <span className="text-xs text-muted font-normal">{t("posts_count", { count: userPosts.length })}</span>
              </h2>
              {userPosts.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-border rounded-2xl bg-surface-2/40">
                  <FileText className="w-10 h-10 text-muted mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-semibold text-foreground">{t("no_posts_other")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userPosts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      currentUser={currentUser}
                      onPostUpdated={(updated) =>
                        setUserPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
                      }
                      onPostDeleted={(postId) =>
                        setUserPosts((prev) => prev.filter((p) => p.id !== postId))
                      }
                      onReportPost={(p) => setReportPostTarget(p)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          {(activeTab === "posts" || activeTab === "activity") && (
            <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <span>⏱️</span> {t("practice_activity")}
              </h2>
              <ChatStats userId={id} />
            </div>
          )}
        </div>
      </div>

      {reportPostTarget && (
        <ReportDialog
          open
          onClose={() => setReportPostTarget(null)}
          targetId={reportPostTarget.user.id}
          targetName={t("report_post_target", { name: reportPostTarget.user.displayName }) || reportPostTarget.user.displayName}
          targetType="post"
          targetContentId={reportPostTarget.id}
          onDone={() => showToast(t("report_success_toast"))}
        />
      )}
    </div>
  );
}
