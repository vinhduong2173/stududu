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

  React.useEffect(() => {
    if (id) fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const [data, relation] = await Promise.all([
        api<any>(`/users/${id}`),
        api<{ liked: boolean; conversationId: number | null }>(`/matching/relation/${id}`),
      ]);
      setUser(data);
      setLiked(relation.liked);
      setConversationId(relation.conversationId);
    } catch (err: any) {
      setError(err.message || t("loading_error_other"));
    } finally {
      setLoading(false);
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
    <div className="max-w-3xl mx-auto pb-24">
      <div className="sticky top-0 bg-background/80 backdrop-blur-md z-10 flex items-center justify-between p-4 border-b border-border">
        <button onClick={() => router.back()} className="p-2 hover:bg-muted/10 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <div className="relative">
          <button
            className="p-2 hover:bg-muted/10 rounded-full transition-colors"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <MoreHorizontal className="w-6 h-6 text-foreground" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-12 z-20 w-48 rounded-2xl border border-border bg-surface shadow-xl py-2 animate-in fade-in zoom-in-95 duration-150">
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

      <div className="p-4 md:p-8">
        {/* Header — cover banner + avatar đè mép */}
        <div className="bg-surface rounded-3xl border border-border shadow-sm overflow-hidden mb-8">
          <div className="sd-cover relative h-32 md:h-44">
            <div className="pointer-events-none absolute -top-16 -right-10 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 left-8 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          </div>
          <div className="px-6 pb-6">
            <div className="-mt-12 mb-4 inline-block rounded-full ring-4 ring-surface bg-surface">
              <Avatar src={user.avatarUrl} fallback={user.displayName.charAt(0)} size="xl" online={isOnline} className="shadow-lg" />
            </div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">
              {user.displayName}
              {ageFromDob(user.dob) !== null && (
                <span className="font-medium text-muted">, {ageFromDob(user.dob)}</span>
              )}
            </h1>
            <p className="text-muted mt-1 flex items-center gap-1.5">
              <span className={`inline-block h-2 w-2 rounded-full ${isOnline ? "bg-success" : "bg-muted"}`} />
              {isOnline ? tDisc("card_online") : tDisc("card_recent")}
              {user.city && (
                <span className="inline-flex items-center gap-0.5">
                  · <MapPin className="w-4 h-4" /> {user.city}
                </span>
              )}
              {user.gender && <span>· {user.gender}</span>}
            </p>
          </div>
        </div>

        <div className="space-y-8 bg-surface rounded-3xl p-6 shadow-sm border border-border">

          {/* FS-26/27 — trust signals: ghi nhận định tính + giờ luyện tập */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <span>🏅</span> {t("trust_activity_other")}
              </h2>
              {conversationId && (
                <button
                  onClick={() => setEndorseOpen(true)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                >
                  <Award className="w-4 h-4" /> {t("endorse_btn")}
                </button>
              )}
            </div>
            <div className="space-y-3">
              <EndorsementBadges userId={id} refreshKey={endorseRefresh} />
              <ChatStats userId={id} />
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
                  {teachLangs.map((l: any) => (
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
                  {learnLangs.map((l: any) => (
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
              {user.bio || t("no_intro_other")}
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <span>🎯</span> {t("intent")}
            </h2>
            <Chip variant="outline" className="text-sm font-medium py-1">
              {getIntentTranslation(user.intent, tRoot)}
            </Chip>
          </div>

          {user.interests && user.interests.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <span>⭐</span> {t("interests")}
              </h2>
              <div className="flex flex-wrap gap-2">
                {user.interests.map((i: any) => (
                  <Chip key={i.id} variant="outline" className="text-sm py-1">
                    {getTopicTranslation(i.topic.name, tRoot)}
                  </Chip>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 md:left-[max(0px,calc(50%-24rem))] md:right-[max(0px,calc(50%-24rem))] p-4 bg-gradient-to-t from-background via-background to-transparent pointer-events-none">
        <div className="flex gap-4 pointer-events-auto">
          {liked ? (
            <>
              <div className="flex-1 h-14 relative" onMouseEnter={() => setIsLikeHovered(true)} onMouseLeave={() => setIsLikeHovered(false)}>
                <Button
                  variant={isLikeHovered ? "ghost" : "ghost"}
                  onClick={handleUnlike}
                  className={cn(
                    "w-full h-full rounded-2xl border transition-all duration-200",
                    isLikeHovered
                      ? "border-error/40 text-error bg-error/5"
                      : "border-success/40 text-success bg-success/5"
                  )}
                >
                  <Heart className={cn("w-6 h-6 mr-2", isLikeHovered ? "fill-none text-error" : "fill-success")} />
                  {isLikeHovered ? tDisc("card_unlike") : tDisc("card_liked")}
                </Button>
              </div>
              <Button
                variant="secondary"
                className="flex-1 h-14 rounded-2xl shadow-lg transition-transform hover:scale-[1.02]"
                onClick={() =>
                  router.push(conversationId ? `/inbox?conversation=${conversationId}` : "/inbox")
                }
              >
                <MessageCircle className="w-6 h-6 mr-2" />
                {t("message_btn")}
              </Button>
            </>
          ) : (
            <Button
              variant="secondary"
              className="flex-1 h-14 rounded-2xl shadow-lg transition-transform hover:scale-[1.02]"
              onClick={handleLike}
            >
              <Heart className="w-6 h-6 mr-2 fill-current" />
              {tDisc("card_like")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
