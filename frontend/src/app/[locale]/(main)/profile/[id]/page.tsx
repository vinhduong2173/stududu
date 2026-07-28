"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { Heart, ArrowLeft, MoreHorizontal, Flag, ShieldBan, MessageCircle, MapPin } from "lucide-react";
import { api } from "@/lib/api";
import { ageFromDob, cn } from "@/lib/utils";
import { ReportDialog, BlockDialog, useToast } from "@/components/features/TrustDialogs";
import { MatchModal } from "@/components/features/MatchModal";
import {
  ChatStats,
  EndorseModal,
  EndorsementBadges,
} from "@/components/features/Endorsements";
import { Award } from "lucide-react";
import { useTranslations } from "next-intl";
import { getTopicTranslation, getIntentTranslation } from "@/lib/i18nHelper";

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("profile");
  const tDisc = useTranslations("discover");
  const tRoot = useTranslations();
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
  const [isLikeHovered, setIsLikeHovered] = React.useState(false);
  const { show: showToast, toast } = useToast();

  const [userPosts, setUserPosts] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (id) fetchProfile();
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



  // Logic mới: thích là mở hội thoại ngay; đã thích → nút chuyển "Nhắn tin"
  const handleLike = async () => {
    try {
      const result = await api<{ mutual: boolean; conversation: { id: number } | null }>(
        `/matching/like/${id}`,
        { method: "POST" },
      );
      setLiked(true);
      setConversationId(result.conversation?.id ?? null);
      if (result.mutual) {
        setMatchOpen(true); // 2 bên cùng thích → mừng match (US-13)
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 pt-4">
      {/* Header Bar Navigation */}
      <div className="flex items-center justify-between mb-4">
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

      {/* Profile Header Banner + Info Card */}
      <div className="bg-surface rounded-3xl border border-border shadow-sm overflow-hidden mb-6">
        <div className="sd-cover relative h-36 md:h-48 w-full">
          <div className="pointer-events-none absolute -top-16 -right-10 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-8 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        </div>
        
        {/* Info row positioned cleanly BELOW the cover banner */}
        <div className="p-6 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar src={user.avatarUrl} fallback={user.displayName.charAt(0)} size="xl" online={isOnline} className="shadow-md shrink-0" />
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                {user.displayName}
                {ageFromDob(user.dob) !== null && (
                  <span className="font-medium text-muted">, {ageFromDob(user.dob)}</span>
                )}
              </h1>
              <p className="text-sm text-muted mt-1 flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5">
                  <span className={`inline-block h-2 w-2 rounded-full ${isOnline ? "bg-success" : "bg-muted"}`} />
                  {isOnline ? tDisc("card_online") : tDisc("card_recent")}
                </span>
                {user.city && (
                  <span className="inline-flex items-center gap-1">
                    · <MapPin className="w-3.5 h-3.5" /> {user.city}
                  </span>
                )}
                {user.gender && <span>· {user.gender}</span>}
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            {liked ? (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-xl font-semibold shadow-sm"
                  onClick={() => router.push(conversationId ? `/inbox?conversation=${conversationId}` : "/inbox")}
                >
                  <MessageCircle className="w-4 h-4 mr-1.5 text-primary" />
                  {t("message_btn")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUnlike}
                  className="text-error hover:bg-error/10 rounded-xl"
                >
                  <Heart className="w-4 h-4 mr-1 fill-error text-error" />
                  {tDisc("card_liked")}
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={handleLike}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl px-5 shadow-sm"
              >
                <Heart className="w-4 h-4 mr-1.5 fill-current" />
                {tDisc("card_like")}
              </Button>
            )}
            <button
              onClick={() => setReportOpen(true)}
              className="p-2 text-muted hover:text-warning hover:bg-warning/10 rounded-xl transition-colors"
              title={t("report")}
            >
              <Flag className="w-4 h-4" />
            </button>
            <button
              onClick={() => setBlockOpen(true)}
              className="p-2 text-muted hover:text-error hover:bg-error/10 rounded-xl transition-colors"
              title={t("block")}
            >
              <ShieldBan className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Layout — Horizontal 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (60% width on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card 1: Giới thiệu (Bio) */}
          <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
            <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              <span>📝</span> {t("intro")}
            </h2>
            <p className="text-foreground leading-relaxed whitespace-pre-wrap text-sm md:text-base">
              {user.bio || t("no_intro_other")}
            </p>
            {user.intent && (
              <div className="mt-4 pt-4 border-t border-border flex items-center gap-2">
                <span className="text-sm font-semibold text-muted">🎯 {t("intent")}:</span>
                <Chip variant="outline" className="text-xs font-medium py-0.5">
                  {getIntentTranslation(user.intent, tRoot)}
                </Chip>
              </div>
            )}
          </div>

          {/* Card 2: Bài viết (User Posts) */}
          <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <span>💬</span> {t("posts_title")}
            </h2>
            {userPosts.length === 0 ? (
              <p className="text-sm text-muted py-2">{t("no_posts_other")}</p>
            ) : (
              <div className="space-y-4">
                {userPosts.map((post) => (
                  <div key={post.id} className="p-4 rounded-2xl bg-muted/5 border border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar src={post.user?.avatarUrl} fallback={post.user?.displayName?.charAt(0) || "U"} size="sm" />
                        <div>
                          <p className="text-sm font-bold text-foreground">{post.user?.displayName}</p>
                          <p className="text-xs text-muted">
                            {new Date(post.createdAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                      {post.content || (post.type === "word_public" && post.word ? `Đã góp từ "${post.word.term}" vào Thư viện chung` : "")}
                    </p>

                    <div className="flex items-center gap-4 pt-1">
                      <button
                        onClick={() => handleTogglePostLike(post.id, post.likedByMe)}
                        className={cn(
                          "flex items-center gap-1.5 text-xs font-medium transition-colors py-1 px-2.5 rounded-lg",
                          post.likedByMe
                            ? "text-error bg-error/10"
                            : "text-muted hover:text-foreground hover:bg-muted/10"
                        )}
                      >
                        <Heart className={cn("w-4 h-4", post.likedByMe && "fill-current")} />
                        <span>{post.likeCount || 0}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card 3: Hoạt động luyện tập (Practice Activity) */}
          <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <span>⏱️</span> {t("practice_activity")}
            </h2>
            <ChatStats userId={id} />
          </div>

        </div>

        {/* Right Column (40% width on desktop) */}
        <div className="space-y-6">

          {/* Card 1: Ngôn ngữ (Languages) */}
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
                    <Chip key={l.id} variant="default" className="text-xs py-1">
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
                    <Chip key={l.id} variant="secondary" className="text-xs py-1">
                      {l.language.name} ({t("level_label")} {l.level})
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Sở thích chung (Interests) */}
          {user.interests && user.interests.length > 0 && (
            <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <span>⭐</span> {t("shared_interests")}
              </h2>
              <div className="flex flex-wrap gap-2">
                {user.interests.map((i: any) => (
                  <Chip key={i.id} variant="outline" className="text-xs py-1">
                    {getTopicTranslation(i.topic.name, tRoot)}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {/* Card 3: An toàn (Safety Actions) */}
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

      </div>
    </div>
  );
}
