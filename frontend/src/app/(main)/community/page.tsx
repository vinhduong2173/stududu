"use client";

import * as React from "react";
import Link from "next/link";
import { Flag, Heart, Users } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { ReportDialog, useToast } from "@/components/features/TrustDialogs";
import { cn } from "@/lib/utils";

/** FS-25 — Community feed: CHỈ bài auto-generated (từ vào thư viện chung / mốc giờ chat).
 *  Chưa có đăng bài tự do ở đợt này. */

type FeedPost = {
  id: number;
  type: "word_public" | "chat_hours_milestone" | "user_post";
  contentRef?: string | null;
  content?: string | null;
  createdAt: string;
  user: { id: number; displayName: string; avatarUrl?: string | null };
  likeCount: number;
  likedByMe: boolean;
  word?: { id: number; term: string; language: { name: string } } | null;
};

function postText(p: FeedPost): string {
  if (p.type === "user_post") return "chia sẻ:";
  if (p.type === "word_public") {
    return p.word
      ? `đã góp từ "${p.word.term}" (${p.word.language.name}) vào Thư viện chung 🌐`
      : "đã góp một từ vào Thư viện chung 🌐";
  }
  return `vừa đạt mốc ${p.contentRef} giờ luyện tập trò chuyện 🎉`;
}

function timeAgo(iso: string): string {
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1) return "Vừa xong";
  if (diffMin < 60) return `${diffMin} phút trước`;
  const h = Math.floor(diffMin / 60);
  if (h < 24) return `${h} giờ trước`;
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

export default function CommunityPage() {
  const [posts, setPosts] = React.useState<FeedPost[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [reportTarget, setReportTarget] = React.useState<FeedPost | null>(null);
  const [draft, setDraft] = React.useState("");
  const [posting, setPosting] = React.useState(false);
  const { show: showToast, toast } = useToast();

  React.useEffect(() => {
    api<FeedPost[]>("/community/feed")
      .then(setPosts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Đăng bài chia sẻ tự do
  const handlePost = async () => {
    const content = draft.trim();
    if (!content) return;
    setPosting(true);
    try {
      const created = await api<FeedPost & { _count?: { likes: number } }>("/community/posts", {
        method: "POST",
        body: { content },
      });
      setPosts((prev) => [
        { ...created, likeCount: 0, likedByMe: false, word: null },
        ...prev,
      ]);
      setDraft("");
      showToast("✅ Đã đăng bài chia sẻ");
    } catch (err: any) {
      showToast(err.message || "Không đăng được bài");
    } finally {
      setPosting(false);
    }
  };

  const toggleLike = async (post: FeedPost) => {
    // optimistic
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, likedByMe: !p.likedByMe, likeCount: p.likeCount + (p.likedByMe ? -1 : 1) }
          : p,
      ),
    );
    try {
      await api(`/community/posts/${post.id}/like`, {
        method: post.likedByMe ? "DELETE" : "POST",
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:py-8 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" /> Cộng đồng
        </h1>
        <p className="text-muted text-sm mt-1">
          Chia sẻ điều bạn muốn + hoạt động nổi bật của thành viên.
        </p>
      </div>

      {/* Composer — bài chia sẻ tự do */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm p-4 mb-6">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={500}
          placeholder="Bạn muốn chia sẻ điều gì với cộng đồng? (mẹo học, cột mốc, câu chuyện...)"
          className="w-full rounded-xl border-2 border-border bg-transparent p-3 text-sm focus:outline-none focus:border-primary transition-colors resize-none h-20"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted">{draft.length}/500</span>
          <Button size="sm" onClick={handlePost} disabled={!draft.trim() || posting}>
            {posting ? "Đang đăng..." : "Đăng"}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-muted/10 animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-6xl mb-4">🌱</div>
          <h3 className="text-xl font-bold text-foreground mb-2">Chưa có hoạt động nào</h3>
          <p className="text-muted text-sm max-w-xs">
            Khi thành viên góp từ vào thư viện chung hoặc đạt mốc giờ luyện tập, hoạt động sẽ hiện ở đây.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <div key={p.id} className="bg-surface rounded-2xl border border-border shadow-sm p-4">
              <div className="flex items-start gap-3">
                <Link href={`/profile/${p.user.id}`}>
                  <Avatar
                    src={p.user.avatarUrl ?? undefined}
                    fallback={p.user.displayName.charAt(0)}
                    size="md"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-relaxed">
                    <Link href={`/profile/${p.user.id}`} className="font-bold hover:underline">
                      {p.user.displayName}
                    </Link>{" "}
                    {postText(p)}
                  </p>
                  {p.type === "user_post" && p.content && (
                    <p className="text-[15px] text-foreground leading-relaxed mt-1.5 whitespace-pre-wrap break-words">
                      {p.content}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-muted">{timeAgo(p.createdAt)}</span>
                    <button
                      onClick={() => toggleLike(p)}
                      className={cn(
                        "flex items-center gap-1 text-xs font-semibold rounded-full px-2.5 py-1 border transition-all",
                        p.likedByMe
                          ? "border-error/40 bg-error/5 text-error"
                          : "border-border text-muted hover:border-error/40 hover:text-error",
                      )}
                    >
                      <Heart className={cn("w-3.5 h-3.5", p.likedByMe && "fill-error")} />
                      {p.likeCount > 0 ? p.likeCount : "Thích"}
                    </button>
                    <button
                      onClick={() => setReportTarget(p)}
                      className="flex items-center gap-1 text-xs font-semibold rounded-full px-2.5 py-1 border border-border text-muted hover:border-warning hover:text-warning transition-all"
                      title="Báo cáo bài viết"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report post — tái dùng cơ chế Report với targetType='post' */}
      {reportTarget && (
        <ReportDialog
          open
          onClose={() => setReportTarget(null)}
          targetId={reportTarget.user.id}
          targetName={`bài viết của ${reportTarget.user.displayName}`}
          targetType="post"
          targetContentId={reportTarget.id}
          onDone={() => showToast("Đã gửi báo cáo. Cảm ơn bạn!")}
        />
      )}
      {toast}
    </div>
  );
}
