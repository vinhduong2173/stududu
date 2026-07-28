"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Clock,
  Pencil,
  Settings,
  Camera,
} from "lucide-react";
import { api } from "@/lib/api";
import { ageFromDob } from "@/lib/utils";
import { ReportDialog, BlockDialog, useToast } from "@/components/features/TrustDialogs";
import { MatchModal } from "@/components/features/MatchModal";
import { ChatStats, EndorseModal } from "@/components/features/Endorsements";
import { useTranslations, useLocale } from "next-intl";
import { getTopicTranslation, getIntentTranslation, getGenderTranslation } from "@/lib/i18nHelper";
import { TIME_SLOTS, getTimezone } from "@/lib/timezones";
import { PostCard, FeedPost } from "@/components/features/PostCard";

interface ProfileViewProps {
  userId?: number | "me";
  isOwnProfile?: boolean;
}

export function ProfileView({ userId, isOwnProfile: forceOwnProfile }: ProfileViewProps) {
  const router = useRouter();
  const t = useTranslations("profile");
  const tDisc = useTranslations("discover");
  const tRoot = useTranslations();
  const locale = useLocale();

  const [currentUser, setCurrentUser] = React.useState<{ id: number; displayName: string } | null>(null);
  const [user, setUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  // Modals & Menu State (for viewing other users)
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [reportOpen, setReportOpen] = React.useState(false);
  const [blockOpen, setBlockOpen] = React.useState(false);
  const [matchOpen, setMatchOpen] = React.useState(false);
  const [endorseOpen, setEndorseOpen] = React.useState(false);
  const [endorseRefresh, setEndorseRefresh] = React.useState(0);
  const [liked, setLiked] = React.useState(false);
  const [conversationId, setConversationId] = React.useState<number | null>(null);
  const [reportPostTarget, setReportPostTarget] = React.useState<FeedPost | null>(null);
  const { show: showToast, toast } = useToast();

  const [userPosts, setUserPosts] = React.useState<FeedPost[]>([]);

  // Fetch current user first or concurrently
  React.useEffect(() => {
    api<{ id: number; displayName: string }>("/users/me")
      .then((me) => setCurrentUser(me))
      .catch(() => null);
  }, []);

  // Determine effective user ID & whether this profile belongs to current user
  const effectiveUserId = React.useMemo(() => {
    if (userId === "me" || forceOwnProfile) return "me";
    if (typeof userId === "number" && userId > 0) return userId;
    return "me";
  }, [userId, forceOwnProfile]);

  const isMe = React.useMemo(() => {
    if (forceOwnProfile || userId === "me" || effectiveUserId === "me") return true;
    if (currentUser && typeof userId === "number" && currentUser.id === userId) return true;
    if (currentUser && user && currentUser.id === user.id) return true;
    return false;
  }, [forceOwnProfile, userId, effectiveUserId, currentUser, user]);

  const targetId = React.useMemo(() => {
    if (isMe) return currentUser?.id ?? 0;
    return typeof userId === "number" ? userId : 0;
  }, [isMe, currentUser, userId]);

  const fetchProfileData = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (effectiveUserId === "me") {
        const meData = await api<any>("/users/me");
        setUser(meData);
        if (meData?.id) {
          const posts = await api<any[]>(`/community/feed?userId=${meData.id}`).catch(() => []);
          setUserPosts(posts);
        }
      } else {
        const [data, relation, postsData] = await Promise.all([
          api<any>(`/users/${effectiveUserId}`),
          api<{ liked: boolean; conversationId: number | null }>(`/matching/relation/${effectiveUserId}`).catch(() => ({ liked: false, conversationId: null })),
          api<any[]>(`/community/feed?userId=${effectiveUserId}`).catch(() => []),
        ]);

        // Double check if loaded profile is actually current user
        if (currentUser && data.id === currentUser.id) {
          setUser(data);
          setUserPosts(postsData);
        } else {
          setUser(data);
          setLiked(relation.liked);
          setConversationId(relation.conversationId);
          setUserPosts(postsData);
        }
      }
    } catch (err: any) {
      setError(err.message || t("loading_error_other"));
    } finally {
      setLoading(false);
    }
  }, [effectiveUserId, currentUser, t]);

  React.useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const handleLike = async () => {
    if (!targetId || isMe) return;
    try {
      const result = await api<{ mutual: boolean; conversation: { id: number } | null }>(
        `/matching/like/${targetId}`,
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
    if (!targetId || isMe) return;
    try {
      await api(`/matching/like/${targetId}`, { method: "DELETE" });
      setLiked(false);
      setConversationId(null);
      showToast(tDisc("card_unliked_toast", { name: user.displayName }) || "Unliked");
    } catch (err: any) {
      showToast(err.message || "Failed to unlike");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !user) {
    return <div className="p-8 text-center text-error">{error || t("user_not_found")}</div>;
  }

  const isOnline = user.lastActive ? new Date(user.lastActive).getTime() > Date.now() - 5 * 60 * 1000 : false;
  const teachLangs = (user.languages || []).filter((l: any) => l.role === "native" || l.role === "fluent");
  const learnLangs = (user.languages || []).filter((l: any) => l.role === "learning");
  const userInterests = user.interests || [];

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4 md:px-6 pb-20 pt-2">
      {/* Top Header Navigation for Other Users */}
      {!isMe && (
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
                    onClick={() => {
                      setMenuOpen(false);
                      setReportOpen(true);
                    }}
                  >
                    <Flag className="h-4 w-4 text-warning" /> {t("report")}
                  </button>
                  <button
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-error hover:bg-error/5"
                    onClick={() => {
                      setMenuOpen(false);
                      setBlockOpen(true);
                    }}
                  >
                    <ShieldBan className="h-4 w-4" /> {t("block")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modals for Other User Actions */}
      {!isMe && (
        <>
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
            targetId={user.id}
            targetName={user.displayName}
            onDone={() => {
              setEndorseRefresh((v) => v + 1);
              showToast(t("endorse_success_toast"));
            }}
          />
          <ReportDialog
            open={reportOpen}
            onClose={() => setReportOpen(false)}
            targetId={user.id}
            targetName={user.displayName}
            onDone={() => showToast(t("report_success_toast"))}
          />
          <BlockDialog
            open={blockOpen}
            onClose={() => setBlockOpen(false)}
            targetId={user.id}
            targetName={user.displayName}
            onDone={() => {
              showToast(t("block_success_toast", { name: user.displayName }));
              router.push("/discover");
            }}
          />
        </>
      )}

      {toast}

      {/* Header Banner & Profile Info Card */}
      <div className="bg-surface rounded-3xl border border-border shadow-sm overflow-hidden mb-6">
        <div className="sd-cover relative h-44 sm:h-60 md:h-72 lg:h-80 w-full group">
          <div className="pointer-events-none absolute -top-16 -right-10 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-8 h-64 w-64 rounded-full bg-white/15 blur-3xl" />

          {isMe && (
            <Link
              href="/profile/me/edit"
              className="absolute bottom-4 right-4 bg-black/40 hover:bg-black/60 text-white backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md z-10"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">{t("edit_cover")}</span>
            </Link>
          )}
        </div>

        <div className="px-4 sm:px-8 pb-6 pt-2">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
              <div className="-mt-16 sm:-mt-20 md:-mt-24 relative group shrink-0 z-10">
                <Avatar
                  src={user.avatarUrl ?? undefined}
                  fallback={user.displayName?.charAt(0) || "U"}
                  size="xl"
                  online={!isMe ? isOnline : undefined}
                  className="w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44 ring-4 ring-surface shadow-2xl"
                />
                {isMe && (
                  <Link
                    href="/profile/me/edit"
                    className="absolute bottom-2 right-2 p-2 bg-surface hover:bg-surface-2 text-foreground rounded-full shadow-md border border-border transition-colors z-20"
                    title={t("edit_avatar")}
                  >
                    <Camera className="w-4 h-4 text-primary" />
                  </Link>
                )}
              </div>

              <div className="pt-2 sm:pt-4 sm:pb-2">
                <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground flex items-center justify-center sm:justify-start gap-2">
                  {user.displayName}
                  {ageFromDob(user.dob) !== null && (
                    <span className="font-normal text-muted text-xl sm:text-2xl">, {ageFromDob(user.dob)}</span>
                  )}
                </h1>

                <p className="text-sm font-medium text-muted mt-1 flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  {isMe ? (
                    <>
                      <span>{user.email}</span>
                      {(user.city || user.gender) && (
                        <>
                          <span>·</span>
                          <span>{[getGenderTranslation(user.gender, tRoot), user.city].filter(Boolean).join(" · ")}</span>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`inline-block h-2.5 w-2.5 rounded-full ${isOnline ? "bg-success" : "bg-muted"}`} />
                        {isOnline ? tDisc("card_online") : tDisc("card_recent")}
                      </span>
                      {user.city && <span>· {user.city}</span>}
                      {user.gender && <span>· {getGenderTranslation(user.gender, tRoot)}</span>}
                    </>
                  )}
                </p>

                <div className="flex items-center justify-center sm:justify-start gap-3 sm:gap-4 mt-2 text-xs font-semibold text-muted flex-wrap">
                  <span>💬 {t("posts_count", { count: userPosts.length })}</span>
                  <span>·</span>
                  <span>🗣️ {t("languages_count", { count: (user.languages || []).length })}</span>
                  {isMe && (
                    <>
                      <span>·</span>
                      <span>⭐ {t("interests_count", { count: userInterests.length })}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center sm:justify-end gap-2.5 sm:pb-3">
              {isMe ? (
                <>
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
                </>
              ) : liked ? (
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
        </div>
      </div>

      {/* Main Streamlined 2-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column — Member Info (Bio, Languages, Interests, Availability / Safety) */}
        <div className="lg:col-span-5 space-y-6">

          {/* Intro Box */}
          <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span>📌</span> {t("intro")}
              </span>
              {isMe && (
                <Link href="/profile/me/edit" className="text-xs font-semibold text-primary hover:underline">
                  {t("edit_btn")}
                </Link>
              )}
            </h2>
            <p className="text-foreground leading-relaxed whitespace-pre-wrap text-sm italic bg-surface-2/60 p-4 rounded-2xl border border-border/50 mb-4">
              {user.bio ? `"${user.bio}"` : isMe ? t("no_intro_me") : t("no_intro_other")}
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
                      {isMe && ` (UTC${getTimezone(user.timezone).offset >= 0 ? "+" : ""}${getTimezone(user.timezone).offset})`}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ngôn ngữ Box */}
          <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span>🗣️</span> {t("languages")}
              </span>
              {isMe && (
                <Link href="/profile/me/edit" className="text-xs font-semibold text-primary hover:underline">
                  {t("edit_btn")}
                </Link>
              )}
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">{t("speaks_label")}</p>
                <div className="flex flex-wrap gap-2">
                  {teachLangs.length === 0 && <p className="text-xs text-muted">{t("none")}</p>}
                  {teachLangs.map((l: any) => (
                    <Chip key={l.id} variant="default" className="text-xs py-1 px-3 rounded-xl font-medium">
                      {l.language?.name || l.language} {l.role === "native" ? `(${t("native_label")})` : `(${t("fluent_label")})`}
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
                      {l.language?.name || l.language} ({t("level_label")} {l.level})
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sở thích Box */}
          {(isMe || userInterests.length > 0) && (
            <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span>⭐</span> {isMe ? t("interests") : t("shared_interests")}
                </span>
                {isMe && (
                  <Link href="/profile/me/edit" className="text-xs font-semibold text-primary hover:underline">
                    {t("edit_btn")}
                  </Link>
                )}
              </h2>
              <div className="flex flex-wrap gap-2">
                {userInterests.length === 0 && <p className="text-xs text-muted">{t("no_interests")}</p>}
                {userInterests.map((i: any) => (
                  <Chip key={i.id} variant="outline" className="text-xs py-1 px-3 rounded-xl">
                    {getTopicTranslation(i.topic?.name || i.topic, tRoot)}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {/* Availability Box (for Me) */}
          {isMe && (
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
                {(user.availableSlots ?? []).length === 0 ? (
                  <p className="text-xs text-muted">{t("no_availability")}</p>
                ) : (
                  TIME_SLOTS.filter((s) => (user.availableSlots ?? []).includes(s.id)).map((s) => (
                    <Chip key={s.id} variant="secondary" className="text-xs py-1 px-3 rounded-xl">
                      ⏰ {s.label}
                    </Chip>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Safety Actions Box (for Other Users) */}
          {!isMe && (
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
          )}

        </div>

        {/* Right Column — Member Posts Stream & Practice Stats */}
        <div className="lg:col-span-7 space-y-6">

          {/* Post Creation Shortcut (Me) */}
          {isMe && (
            <div className="bg-surface rounded-3xl p-5 shadow-sm border border-border">
              <div className="flex items-center gap-3">
                <Avatar
                  src={user.avatarUrl ?? undefined}
                  fallback={user.displayName?.charAt(0) || "U"}
                  size="md"
                  className="shrink-0"
                />
                <Link
                  href="/community"
                  className="flex-1 bg-surface-2 hover:bg-border/60 text-muted rounded-2xl px-4 py-3 text-sm font-medium transition-colors cursor-pointer"
                >
                  {t("post_placeholder", { name: user.displayName })}
                </Link>
              </div>
            </div>
          )}

          {/* Posts Stream Card */}
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
                <p className="text-sm font-semibold text-foreground">
                  {isMe ? t("no_posts_me") : t("no_posts_other")}
                </p>
                {isMe && (
                  <>
                    <p className="text-xs text-muted mt-1">{t("create_post_hint")}</p>
                    <Button asChild size="sm" className="mt-4 rounded-xl">
                      <Link href="/community">{t("create_post_btn")}</Link>
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {userPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUser={currentUser || (isMe ? { id: user.id, displayName: user.displayName } : null)}
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

          {/* Practice Activity / ChatStats */}
          <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <span>⏱️</span> {t("practice_activity")}
            </h2>
            <ChatStats userId={user.id} />
          </div>

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
