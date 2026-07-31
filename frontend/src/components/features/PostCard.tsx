"use client";

import * as React from "react";
import Link from "next/link";
import { Flag, Heart, MessageSquare, MoreVertical, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { api } from "@/lib/api";

export type FeedPost = {
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

export type PostCardProps = {
  post: FeedPost;
  currentUser?: { id: number; displayName: string } | null;
  onPostUpdated?: (updated: FeedPost) => void;
  onPostDeleted?: (postId: number) => void;
  onReportPost?: (post: FeedPost) => void;
};

export function PostCard({
  post,
  currentUser,
  onPostDeleted,
  onReportPost,
}: PostCardProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [liked, setLiked] = React.useState(post.likedByMe);
  const [likeCount, setLikeCount] = React.useState(post.likeCount);

  const toggleLike = async () => {
    try {
      if (liked) {
        setLiked(false);
        setLikeCount((prev) => Math.max(0, prev - 1));
        await api(`/community/posts/${post.id}/like`, { method: "DELETE" });
      } else {
        setLiked(true);
        setLikeCount((prev) => prev + 1);
        await api(`/community/posts/${post.id}/like`, { method: "POST" });
      }
    } catch {
      // Revert if error
      setLiked(post.likedByMe);
      setLikeCount(post.likeCount);
    }
  };

  const getPostContent = () => {
    if (post.type === "word_public") {
      return `đã thêm từ "${post.word?.term || post.contentRef || ""}" vào thư viện chung.`;
    }
    if (post.type === "chat_hours_milestone") {
      return `đã đạt mốc ${post.contentRef || ""} giờ trò chuyện! 🎉`;
    }
    return post.content || "";
  };

  return (
    <div className="bg-surface rounded-2xl border border-border shadow-sm p-4">
      <div className="flex items-start gap-3">
        <Link href={`/profile/${post.user.id}`}>
          <Avatar
            src={post.user.avatarUrl ?? undefined}
            fallback={post.user.displayName.charAt(0)}
            size="md"
          />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-foreground leading-relaxed flex-1 min-w-0">
              <Link href={`/profile/${post.user.id}`} className="font-bold hover:underline">
                {post.user.displayName}
              </Link>{" "}
              {getPostContent()}
            </p>

            <div className="relative flex-shrink-0">
              <button
                onClick={() => setMenuOpen((prev) => !prev)}
                className="p-1 rounded-full text-muted hover:bg-muted/10 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-1 w-32 bg-surface border border-border rounded-xl shadow-lg py-1 z-20">
                  {currentUser && post.user.id === currentUser.id ? (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onPostDeleted?.(post.id);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-error hover:bg-muted/10 text-left font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Xóa bài viết
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onReportPost?.(post);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-muted hover:bg-muted/10 text-left font-medium"
                    >
                      <Flag className="w-3.5 h-3.5" /> Báo cáo
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {post.imageUrl && (
            <div className="mt-3 rounded-xl overflow-hidden border border-border bg-muted/5 max-h-80">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.imageUrl} alt="Post content" className="w-full h-full object-cover" />
            </div>
          )}

          <div className="flex items-center gap-4 mt-3 pt-2 border-t border-border/40 text-xs text-muted">
            <button
              onClick={toggleLike}
              className={`flex items-center gap-1.5 font-medium transition-colors ${
                liked ? "text-error" : "hover:text-foreground"
              }`}
            >
              <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
              <span>{likeCount}</span>
            </button>
            <div className="flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" />
              <span>{post.commentCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
