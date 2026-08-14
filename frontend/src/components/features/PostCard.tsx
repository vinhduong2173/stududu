"use client";

import * as React from "react";
import Link from "next/link";
import { Flag, Heart, MessageSquare, MoreVertical, Trash2, Languages, X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";

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

export type CommentType = {
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

export type PostCardProps = {
  post: FeedPost;
  currentUser?: { id: number; displayName: string } | null;
  onPostUpdated?: (updated: FeedPost) => void;
  onPostDeleted?: (postId: number) => void;
  onReportPost?: (post: FeedPost) => void;
};

function timeAgo(iso: string, t: any): string {
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1) return t("community.time_just_now");
  if (diffMin < 60) return t("community.time_minutes_ago", { count: diffMin });
  const h = Math.floor(diffMin / 60);
  if (h < 24) return t("community.time_hours_ago", { count: h });
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

export function PostCard({
  post,
  currentUser,
  onPostDeleted,
  onReportPost,
}: PostCardProps) {
  const t = useTranslations();
  const locale = useLocale();

  const [menuOpen, setMenuOpen] = React.useState(false);
  const [liked, setLiked] = React.useState(post.likedByMe);
  const [likeCount, setLikeCount] = React.useState(post.likeCount);
  const [commentCount, setCommentCount] = React.useState(post.commentCount);

  // Translation states
  const [translatedText, setTranslatedText] = React.useState<string | null>(null);
  const [translating, setTranslating] = React.useState(false);
  const [showTranslation, setShowTranslation] = React.useState(false);

  // Comments states
  const [commentsExpanded, setCommentsExpanded] = React.useState(false);
  const [comments, setComments] = React.useState<CommentType[]>([]);
  const [loadingComments, setLoadingComments] = React.useState(false);
  const [commentDraft, setCommentDraft] = React.useState("");
  const [postingComment, setPostingComment] = React.useState(false);
  const [replyToComment, setReplyToComment] = React.useState<CommentType | null>(null);

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
      setLiked(post.likedByMe);
      setLikeCount(post.likeCount);
    }
  };

  const getPostTextToTranslate = (): string => {
    if (post.type === "user_post" && post.content) return post.content;
    if (post.type === "word_public" && post.word) return `${post.word.term} - ${post.word.language.name}`;
    if (post.type === "chat_hours_milestone" && post.contentRef) return `${post.contentRef} hours milestone`;
    return post.content || "";
  };

  const handleTranslate = async () => {
    if (showTranslation) {
      setShowTranslation(false);
      return;
    }

    if (translatedText) {
      setShowTranslation(true);
      return;
    }

    const textToTranslate = getPostTextToTranslate();
    if (!textToTranslate.trim()) return;

    setTranslating(true);
    try {
      const res = await api<{ translation: string }>("/translate", {
        method: "POST",
        body: { text: textToTranslate, target: locale || "en", source: "auto" },
      });
      setTranslatedText(res.translation);
      setShowTranslation(true);
    } catch (err) {
      console.error(err);
    } finally {
      setTranslating(false);
    }
  };

  const handleToggleComments = async () => {
    if (commentsExpanded) {
      setCommentsExpanded(false);
      setComments([]);
      setReplyToComment(null);
      return;
    }
    setCommentsExpanded(true);
    setLoadingComments(true);
    setCommentDraft("");
    setReplyToComment(null);
    try {
      const fetched = await api<CommentType[]>(`/community/posts/${post.id}/comments`);
      setComments(fetched);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    const val = commentDraft.trim();
    if (!val) return;
    setPostingComment(true);
    try {
      const created = await api<CommentType>(`/community/posts/${post.id}/comments`, {
        method: "POST",
        body: { content: val, parentId: replyToComment ? replyToComment.id : undefined },
      });
      setComments((prev) => [...prev, created]);
      setCommentDraft("");
      setReplyToComment(null);
      setCommentCount((prev) => prev + 1);
    } catch (err) {
      console.error(err);
    } finally {
      setPostingComment(false);
    }
  };

  const toggleLikeComment = async (comment: CommentType) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === comment.id
          ? { ...c, likedByMe: !c.likedByMe, likeCount: c.likeCount + (c.likedByMe ? -1 : 1) }
          : c
      )
    );
    try {
      await api(`/community/comments/${comment.id}/like`, {
        method: comment.likedByMe ? "DELETE" : "POST",
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await api(`/community/comments/${commentId}`, { method: "DELETE" });
      const deletedComments = comments.filter((c) => c.id === commentId || c.parentId === commentId);
      const deletedCount = deletedComments.length;

      setComments((prev) => prev.filter((c) => c.id !== commentId && c.parentId !== commentId));
      setCommentCount((prev) => Math.max(0, prev - deletedCount));
    } catch (err) {
      console.error(err);
    }
  };

  const getPostContent = () => {
    if (post.type === "word_public") {
      return post.word
        ? t("community.post_word", { term: post.word.term, language: post.word.language.name })
        : t("community.post_word_generic");
    }
    if (post.type === "chat_hours_milestone") {
      return t("community.post_milestone", { hours: post.contentRef || "" });
    }
    return t("community.post_share");
  };

  const renderCommentItem = (c: CommentType, isReply = false) => (
    <div key={c.id} className={cn("flex items-start justify-between gap-2.5 text-sm", isReply && "pl-9 mt-2")}>
      <div className="flex items-start gap-2.5 flex-1 min-w-0">
        <Avatar
          src={c.user.avatarUrl ?? undefined}
          fallback={c.user.displayName.charAt(0)}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <div className="bg-muted/20 rounded-2xl px-3 py-2 inline-block max-w-full">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-xs text-foreground">{c.user.displayName}</span>
              <span className="text-[10px] text-muted">{timeAgo(c.createdAt, t)}</span>
            </div>
            <p className="text-foreground mt-0.5 leading-relaxed text-xs break-words">{c.content}</p>
          </div>
          <div className="flex items-center gap-3 mt-1 ml-2 text-[10px] text-muted">
            {!isReply && (
              <button
                onClick={() => setReplyToComment(c)}
                className="hover:underline font-bold"
              >
                {t("community.reply")}
              </button>
            )}
            {currentUser && (c.userId === currentUser.id || post.user.id === currentUser.id) && (
              <>
                {!isReply && <span>•</span>}
                <button
                  onClick={() => handleDeleteComment(c.id)}
                  className="hover:underline text-error font-bold"
                >
                  {t("community.delete")}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      <button
        onClick={() => toggleLikeComment(c)}
        className={cn(
          "flex flex-col items-center justify-center p-1 text-muted hover:text-error transition-colors self-center",
          c.likedByMe && "text-error hover:text-error/80"
        )}
        title={c.likedByMe ? t("community.unlike") : t("community.like")}
      >
        <Heart className={cn("w-3 h-3", c.likedByMe && "fill-error")} />
        {c.likeCount > 0 && <span className="text-[9px] font-semibold mt-0.5">{c.likeCount}</span>}
      </button>
    </div>
  );

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
                      <Trash2 className="w-3.5 h-3.5" /> {t("community.delete_post")}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onReportPost?.(post);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-muted hover:bg-muted/10 text-left font-medium"
                    >
                      <Flag className="w-3.5 h-3.5" /> {t("community.report")}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Post Content */}
          {post.type === "user_post" && post.content && (
            <p className="text-sm text-foreground leading-relaxed mt-1.5 whitespace-pre-wrap break-words">
              {post.content}
            </p>
          )}

          {/* FB / X Style: See Translation Link right below post content */}
          {getPostTextToTranslate().trim().length > 0 && (
            <button
              onClick={handleTranslate}
              disabled={translating}
              className="mt-1 text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 transition-colors"
            >
              <Languages className="w-3.5 h-3.5" />
              <span>
                {translating
                  ? "..."
                  : showTranslation
                  ? t("community.hide_translation") || "Ẩn bản dịch"
                  : t("community.see_translation") || "Xem bản dịch"}
              </span>
            </button>
          )}

          {/* Automatic Inline Translation Box (directly below post text) */}
          {showTranslation && translatedText && (
            <div className="mt-2 p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs leading-relaxed text-foreground animate-fade-in">
              <div className="flex items-center justify-between text-[11px] font-bold text-primary mb-1">
                <span className="flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5" />
                  {t("community.translation_title") || "Bản dịch tự động"}
                </span>
                <button
                  onClick={() => setShowTranslation(false)}
                  className="text-muted hover:text-foreground text-[10px]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="whitespace-pre-wrap mt-0.5">{translatedText}</p>
            </div>
          )}

          {post.imageUrl && (
            <div className="mt-3 rounded-xl overflow-hidden border border-border bg-muted/5 max-h-80">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.imageUrl} alt="Post content" className="w-full h-full object-cover" />
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center gap-3 mt-3 pt-2 border-t border-border/40 text-xs text-muted">
            <span className="text-xs text-muted">{timeAgo(post.createdAt, t)}</span>
            <button
              onClick={toggleLike}
              className={cn(
                "flex items-center gap-1 font-semibold rounded-full px-2.5 py-1 border transition-all",
                liked ? "border-error/40 bg-error/5 text-error" : "border-border text-muted hover:border-error/40 hover:text-error"
              )}
            >
              <Heart className={cn("w-3.5 h-3.5", liked && "fill-error")} />
              <span>{likeCount > 0 ? likeCount : t("community.like")}</span>
            </button>

            {/* Interactive Comments Button */}
            <button
              onClick={handleToggleComments}
              className={cn(
                "flex items-center gap-1 font-semibold rounded-full px-2.5 py-1 border transition-all",
                commentsExpanded
                  ? "border-primary/40 bg-primary/5 text-primary"
                  : "border-border text-muted hover:border-primary/40 hover:text-primary"
              )}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{commentCount > 0 ? commentCount : t("community.comment_placeholder").replace("...", "")}</span>
            </button>
          </div>

          {/* Interactive Comments Section */}
          {commentsExpanded && (
            <div className="mt-4 pt-4 border-t border-border space-y-4">
              {loadingComments ? (
                <div className="text-center py-4 text-xs text-muted">{t("common.loading")}</div>
              ) : comments.length === 0 ? (
                <div className="text-center py-4 text-xs text-muted">{t("community.empty_feed_hint")}</div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {comments
                    .filter((c) => !c.parentId)
                    .map((parentComment) => (
                      <div key={parentComment.id} className="space-y-2">
                        {renderCommentItem(parentComment, false)}
                        {comments
                          .filter((reply) => reply.parentId === parentComment.id)
                          .map((replyComment) => renderCommentItem(replyComment, true))}
                      </div>
                    ))}
                </div>
              )}

              {replyToComment && (
                <div className="flex items-center justify-between bg-muted/30 rounded-xl px-3 py-1.5 text-xs text-muted mb-2 animate-fade-in">
                  <span>
                    {t("community.reply_placeholder", { name: replyToComment.user.displayName })}
                  </span>
                  <button
                    onClick={() => setReplyToComment(null)}
                    className="text-muted hover:text-foreground p-0.5 rounded-full hover:bg-muted transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !postingComment) {
                      handleAddComment();
                    }
                  }}
                  placeholder={
                    replyToComment
                      ? t("community.reply_placeholder", { name: replyToComment.user.displayName })
                      : t("community.comment_placeholder")
                  }
                  disabled={postingComment}
                  className="flex-1 rounded-full border border-border bg-muted/5 px-4 py-2 text-xs focus:outline-none focus:border-primary transition-colors"
                />
                <Button
                  size="sm"
                  onClick={handleAddComment}
                  disabled={!commentDraft.trim() || postingComment}
                  className="rounded-full text-xs px-4"
                >
                  {postingComment ? "..." : t("community.post_button")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
