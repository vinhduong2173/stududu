"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { Heart, ArrowLeft, MoreHorizontal, Flag, ShieldBan, MessageCircle, MapPin } from "lucide-react";
import { api } from "@/lib/api";
import { ageFromDob } from "@/lib/utils";
import { ReportDialog, BlockDialog, useToast } from "@/components/features/TrustDialogs";
import { MatchModal } from "@/components/features/MatchModal";
import {
  ChatStats,
  EndorseModal,
  EndorsementBadges,
} from "@/components/features/Endorsements";
import { Award } from "lucide-react";

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
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
  const { show: showToast, toast } = useToast();

  React.useEffect(() => {
    if (id) fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const [data, relation] = await Promise.all([
        api(`/users/${id}`),
        api<{ liked: boolean; conversationId: number | null }>(`/matching/relation/${id}`),
      ]);
      setUser(data);
      setLiked(relation.liked);
      setConversationId(relation.conversationId);
    } catch (err: any) {
      setError(err.message || "Failed to load profile");
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
        showToast(`💜 Đã thích ${user.displayName} — nhắn tin ngay nhé!`);
      }
    } catch (err: any) {
      showToast(err.message || "Đã có lỗi xảy ra");
    }
  };

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (error || !user) return <div className="p-8 text-center text-error">{error || "User not found"}</div>;

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
                  <Flag className="h-4 w-4 text-warning" /> Báo cáo
                </button>
                <button
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-error hover:bg-error/5"
                  onClick={() => { setMenuOpen(false); setBlockOpen(true); }}
                >
                  <ShieldBan className="h-4 w-4" /> Chặn
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
          showToast("🏅 Đã gửi ghi nhận. Cảm ơn bạn!");
        }}
      />
      <ReportDialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        targetId={id}
        targetName={user.displayName}
        onDone={() => showToast("Đã gửi báo cáo. Cảm ơn bạn!")}
      />
      <BlockDialog
        open={blockOpen}
        onClose={() => setBlockOpen(false)}
        targetId={id}
        targetName={user.displayName}
        onDone={() => { showToast(`Đã chặn ${user.displayName}`); router.push("/discover"); }}
      />
      {toast}

      <div className="p-6 md:p-8">
        <div className="flex flex-col items-center text-center mb-8">
          <Avatar src={user.avatarUrl} fallback={user.displayName.charAt(0)} size="xl" online={isOnline} className="mb-4 shadow-lg" />
          <h1 className="text-3xl font-bold text-foreground">
            {user.displayName}
            {ageFromDob(user.dob) !== null && (
              <span className="font-medium text-muted">, {ageFromDob(user.dob)}</span>
            )}
          </h1>
          <p className="text-muted mt-1 flex items-center gap-1.5">
            {isOnline ? "Đang hoạt động" : "Hoạt động gần đây"}
            {user.city && (
              <span className="inline-flex items-center gap-0.5">
                · <MapPin className="w-4 h-4" /> {user.city}
              </span>
            )}
            {user.gender && <span>· {user.gender}</span>}
          </p>
        </div>

        <div className="space-y-8 bg-surface rounded-3xl p-6 shadow-sm border border-border">

          {/* FS-26/27 — trust signals: ghi nhận định tính + giờ luyện tập */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <span>🏅</span> Ghi nhận từ cộng đồng
              </h2>
              {conversationId && (
                <button
                  onClick={() => setEndorseOpen(true)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                >
                  <Award className="w-4 h-4" /> Ghi nhận
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
              <span>🗣️</span> Ngôn ngữ
            </h2>
            <div className="flex flex-col gap-4 bg-muted/5 p-4 rounded-2xl">
              <div>
                <p className="text-sm font-semibold text-muted mb-2 uppercase tracking-wider">Có thể dạy</p>
                <div className="flex flex-wrap gap-2">
                  {teachLangs.map((l: any) => (
                    <Chip key={l.id} variant="default" className="text-sm py-1">
                      {l.language.name} {l.role === "native" ? "(Mẹ đẻ)" : "(Thành thạo)"}
                    </Chip>
                  ))}
                </div>
              </div>
              <div className="h-px bg-border w-full" />
              <div>
                <p className="text-sm font-semibold text-muted mb-2 uppercase tracking-wider">Muốn học</p>
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
              <span>👋</span> Giới thiệu
            </h2>
            <p className="text-foreground leading-relaxed whitespace-pre-wrap">
              {user.bio || "Người dùng này chưa cập nhật phần giới thiệu."}
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <span>🎯</span> Mục tiêu
            </h2>
            <Chip variant="outline" className="text-sm font-medium py-1">
              {user.intent || "Chưa xác định"}
            </Chip>
          </div>

          {user.interests && user.interests.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <span>⭐</span> Sở thích
              </h2>
              <div className="flex flex-wrap gap-2">
                {user.interests.map((i: any) => (
                  <Chip key={i.id} variant="outline" className="text-sm py-1">
                    {i.topic.name}
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
              <Button
                variant="ghost"
                disabled
                className="flex-1 h-14 rounded-2xl border-2 border-success/40 text-success bg-success/5 disabled:opacity-100 shadow-sm"
              >
                <Heart className="w-6 h-6 mr-2 fill-success" />
                Đã thích
              </Button>
              <Button
                variant="secondary"
                className="flex-1 h-14 rounded-2xl shadow-lg transition-transform hover:scale-[1.02]"
                onClick={() =>
                  router.push(conversationId ? `/inbox?conversation=${conversationId}` : "/inbox")
                }
              >
                <MessageCircle className="w-6 h-6 mr-2" />
                Nhắn tin
              </Button>
            </>
          ) : (
            <Button
              variant="secondary"
              className="flex-1 h-14 rounded-2xl shadow-lg transition-transform hover:scale-[1.02]"
              onClick={handleLike}
            >
              <Heart className="w-6 h-6 mr-2 fill-current" />
              Thích
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
