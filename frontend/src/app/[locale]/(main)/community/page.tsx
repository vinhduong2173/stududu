"use client";

import * as React from "react";
import Link from "next/link";
import { Flag, Heart, Users, Image as ImageIcon, X, MessageSquare, MoreVertical, Edit, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { ReportDialog, useToast } from "@/components/features/TrustDialogs";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { PostCard } from "@/components/features/PostCard";

/** FS-25 — Community feed: CHỈ bài auto-generated (từ vào thư viện chung / mốc giờ chat).
 *  Chưa có đăng bài tự do ở đợt này. */

type FeedPost = {
  id: number;
  type: "word_public" | "chat_hours_milestone" | "user_post";
  contentRef?: string | null;
  content?: string | null;
  imageUrl?: string | null;
  createdAt: string;
  user: { id: number; displayName: string; avatarUrl?: string | null };
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  word?: { id: number; term: string; language: { name: string } } | null;
};

type CommentType = {
  id: number;
  postId: number;
  userId: number;
  content: string;
  parentId?: number | null;
  createdAt: string;
  user: { id: number; displayName: string; avatarUrl?: string | null };
  likeCount: number;
  likedByMe: boolean;
};

function postText(p: FeedPost, t: any): string {
  if (p.type === "user_post") return t("community.post_share");
  if (p.type === "word_public") {
    return p.word
      ? t("community.post_word", { term: p.word.term, language: p.word.language.name })
      : t("community.post_word_generic");
  }
  return t("community.post_milestone", { hours: p.contentRef });
}

function timeAgo(iso: string, t: any): string {
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1) return t("community.time_just_now");
  if (diffMin < 60) return t("community.time_minutes_ago", { count: diffMin });
  const h = Math.floor(diffMin / 60);
  if (h < 24) return t("community.time_hours_ago", { count: h });
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

export default function CommunityPage() {
  const t = useTranslations();
  const [posts, setPosts] = React.useState<FeedPost[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [reportTarget, setReportTarget] = React.useState<FeedPost | null>(null);
  const [draft, setDraft] = React.useState("");
  const [image, setImage] = React.useState<string | null>(null);
  const [posting, setPosting] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<{ id: number; displayName: string } | null>(null);
  const { show: showToast, toast } = useToast();

  React.useEffect(() => {
    api<FeedPost[]>("/community/feed")
      .then(setPosts)
      .catch(console.error)
      .finally(() => setLoading(false));

    api<{ id: number; displayName: string }>("/users/me")
      .then(setCurrentUser)
      .catch(console.error);
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast("⚠️ Dung lượng ảnh không được vượt quá 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Đăng bài chia sẻ tự do
  const handlePost = async () => {
    const content = draft.trim();
    if (!content && !image) return;
    setPosting(true);
    try {
      const created = await api<FeedPost & { _count?: { likes: number } }>("/community/posts", {
        method: "POST",
        body: { content, imageUrl: image || undefined },
      });
      setPosts((prev) => [
        { ...created, likeCount: 0, commentCount: 0, likedByMe: false, word: null },
        ...prev,
      ]);
      setDraft("");
      setImage(null);
      showToast("✅ Đã đăng bài chia sẻ");
    } catch (err: any) {
      showToast(err.message || "Không đăng được bài");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:py-8 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" /> {t("community.title")}
        </h1>
        <p className="text-muted text-sm mt-1">
          {t("community.subtitle")}
        </p>
      </div>

      {/* Composer — bài chia sẻ tự do */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm p-4 mb-6">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={500}
          placeholder={t("community.post_placeholder")}
          className="w-full rounded-xl border-2 border-border bg-transparent p-3 text-sm focus:outline-none focus:border-primary transition-colors resize-none h-20"
        />

        {image && (
          <div className="relative mt-2 w-32 h-32 rounded-xl overflow-hidden border border-border bg-muted/5 group">
            <img src={image} alt="Preview" className="w-full h-full object-cover" />
            <button
              onClick={() => setImage(null)}
              className="absolute top-1 right-1 p-1 bg-foreground/80 hover:bg-foreground text-surface rounded-full transition-colors shadow-sm"
              type="button"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
          <div className="flex items-center gap-2">
            <label className="cursor-pointer flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted text-muted hover:text-primary transition-colors" title={t("community.add_image")}>
              <ImageIcon className="w-5 h-5" />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                disabled={posting}
              />
            </label>
            <span className="text-xs text-muted">{draft.length}/500</span>
          </div>
          <Button size="sm" onClick={handlePost} disabled={(!draft.trim() && !image) || posting}>
            {posting ? t("common.loading") : t("community.post_button")}
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
          <h3 className="text-xl font-bold text-foreground mb-2">{t("community.empty_feed")}</h3>
          <p className="text-muted text-sm max-w-xs">
            {t("community.empty_feed_hint")}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              currentUser={currentUser}
              onPostUpdated={(updated) =>
                setPosts((prev) => prev.map((postItem) => (postItem.id === updated.id ? updated : postItem)))
              }
              onPostDeleted={(postId) =>
                setPosts((prev) => prev.filter((postItem) => postItem.id !== postId))
              }
              onReportPost={(p) => setReportTarget(p)}
            />
          ))}
        </div>
      )}

      {/* Report post — tái dùng cơ chế Report với targetType='post' */}
      {reportTarget && (
        <ReportDialog
          open
          onClose={() => setReportTarget(null)}
          targetId={reportTarget.user.id}
          targetName={t("community.report_post_target", { name: reportTarget.user.displayName })}
          targetType="post"
          targetContentId={reportTarget.id}
          onDone={() => showToast(t("profile.report_success_toast"))}
        />
      )}

      {toast}
    </div>
  );
}
