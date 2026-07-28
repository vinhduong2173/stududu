"use client";

import * as React from "react";
import Link from "next/link";
import { Flag, Heart, Image as ImageIcon, X, MessageSquare, MoreVertical, Edit, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { useToast } from "@/components/features/TrustDialogs";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

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

export function postText(p: FeedPost, t: any): string {
  if (p.type === "user_post") return t("community.post_share");
  if (p.type === "word_public") {
    return p.word
      ? t("community.post_word", { term: p.word.term, language: p.word.language.name })
      : t("community.post_word_generic");
  }
  return t("community.post_milestone", { hours: p.contentRef });
}

export function timeAgo(iso: string, t: any): string {
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1) return t("community.time_just_now");
  if (diffMin < 60) return t("community.time_minutes_ago", { count: diffMin });
  const h = Math.floor(diffMin / 60);
  if (h < 24) return t("community.time_hours_ago", { count: h });
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

interface PostCardProps {
  post: FeedPost;
  currentUser?: { id: number; displayName: string } | null;
  onPostUpdated?: (updated: FeedPost) => void;
  onPostDeleted?: (postId: number) => void;
  onReportPost?: (post: FeedPost) => void;
}

export function PostCard({
  post: initialPost,
  currentUser,
  onPostUpdated,
  onPostDeleted,
  onReportPost,
}: PostCardProps) {
  const t = useTranslations();
  const { show: showToast, toast } = useToast();

  const [post, setPost] = React.useState<FeedPost>(initialPost);
  React.useEffect(() => {
    setPost(initialPost);
  }, [initialPost]);

  // Dropdown menu state
  const [menuOpen, setMenuOpen] = React.useState(false);

  // Edit post states
  const [isEditing, setIsEditing] = React.useState(false);
  const [editDraft, setEditDraft] = React.useState("");
  const [editImage, setEditImage] = React.useState<string | null>(null);
  const [updatingPost, setUpdatingPost] = React.useState(false);

  // Delete post modal state
  const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  // Comments state
  const [commentsExpanded, setCommentsExpanded] = React.useState(false);
  const [comments, setComments] = React.useState<CommentType[]>([]);
  const [loadingComments, setLoadingComments] = React.useState(false);
  const [commentDraft, setCommentDraft] = React.useState("");
  const [postingComment, setPostingComment] = React.useState(false);
  const [replyToComment, setReplyToComment] = React.useState<CommentType | null>(null);

  // Toggle Like
  const toggleLike = async () => {
    const nextLiked = !post.likedByMe;
    const nextCount = post.likeCount + (nextLiked ? 1 : -1);

    const updated = { ...post, likedByMe: nextLiked, likeCount: nextCount };
    setPost(updated);
    if (onPostUpdated) onPostUpdated(updated);

    try {
      await api(`/community/posts/${post.id}/like`, {
        method: nextLiked ? "POST" : "DELETE",
      });
    } catch (err) {
      console.error("Failed to toggle post like", err);
    }
  };

  // Handle Edit Post
  const handleUpdatePost = async () => {
    const content = editDraft.trim();
    if (!content) return;
    setUpdatingPost(true);

    const removeImage = !editImage && !!post.imageUrl;
    const isNewImage = editImage && editImage !== post.imageUrl;

    const body: any = { content };
    if (removeImage) {
      body.removeImage = true;
    } else if (isNewImage) {
      body.imageUrl = editImage;
    }

    try {
      const updatedApi = await api<FeedPost>(`/community/posts/${post.id}`, {
        method: "PATCH",
        body,
      });

      const updated = {
        ...post,
        content: updatedApi.content,
        imageUrl: updatedApi.imageUrl,
      };

      setPost(updated);
      if (onPostUpdated) onPostUpdated(updated);

      setIsEditing(false);
      setEditDraft("");
      setEditImage(null);
      showToast("✅ Đã cập nhật bài viết");
    } catch (err: any) {
      showToast(err.message || "Không thể cập nhật bài viết");
    } finally {
      setUpdatingPost(false);
    }
  };

  // Handle Delete Post
  const handleDeletePost = async () => {
    setDeleting(true);
    try {
      await api(`/community/posts/${post.id}`, { method: "DELETE" });
      setConfirmDeleteOpen(false);
      showToast("✅ Đã xóa bài viết");
      if (onPostDeleted) onPostDeleted(post.id);
    } catch (err: any) {
      showToast(err.message || "Không thể xóa bài viết");
    } finally {
      setDeleting(false);
    }
  };

  // Toggle Comments Section
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
      console.error("Failed to load comments", err);
    } finally {
      setLoadingComments(false);
    }
  };

  // Add Comment / Reply
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

      const nextCommentCount = post.commentCount + 1;
      const updated = { ...post, commentCount: nextCommentCount };
      setPost(updated);
      if (onPostUpdated) onPostUpdated(updated);
    } catch (err: any) {
      showToast(err.message || "Không gửi được bình luận");
    } finally {
      setPostingComment(false);
    }
  };

  // Toggle Like on Comment
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

  // Delete Comment
  const handleDeleteComment = async (commentId: number) => {
    try {
      await api(`/community/comments/${commentId}`, { method: "DELETE" });

      const deletedComments = comments.filter((c) => c.id === commentId || c.parentId === commentId);
      const deletedCount = deletedComments.length;

      setComments((prev) => prev.filter((c) => c.id !== commentId && c.parentId !== commentId));

      const nextCount = Math.max(0, post.commentCount - deletedCount);
      const updated = { ...post, commentCount: nextCount };
      setPost(updated);
      if (onPostUpdated) onPostUpdated(updated);

      showToast("✅ Đã xóa bình luận");
    } catch (err: any) {
      showToast(err.message || "Không thể xóa bình luận");
    }
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
      {toast}
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
              {postText(post, t)}
            </p>

            {currentUser && post.user.id === currentUser.id && (
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="p-1 rounded-full text-muted hover:bg-muted/10 transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 mt-1 w-32 bg-surface border border-border rounded-xl shadow-lg py-1 z-20">
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setEditDraft(post.content || "");
                          setEditImage(post.imageUrl || null);
                          setMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/10 flex items-center gap-1.5 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        {t("community.edit")}
                      </button>
                      <button
                        onClick={() => {
                          setConfirmDeleteOpen(true);
                          setMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-error hover:bg-error/5 flex items-center gap-1.5 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {t("community.delete_post")}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {post.type === "user_post" && post.content && (
            <p className="text-[15px] text-foreground leading-relaxed mt-1.5 whitespace-pre-wrap break-words">
              {post.content}
            </p>
          )}

          {post.imageUrl && (
            <div className="mt-3 rounded-xl overflow-hidden border border-border/50 max-w-md bg-muted/5 inline-block">
              <img
                src={post.imageUrl}
                alt="Đính kèm"
                className="w-full h-auto object-contain max-h-96"
              />
            </div>
          )}

          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-muted">{timeAgo(post.createdAt, t)}</span>
            <button
              onClick={toggleLike}
              className={cn(
                "flex items-center gap-1 text-xs font-semibold rounded-full px-2.5 py-1 border transition-all",
                post.likedByMe
                  ? "border-error/40 bg-error/5 text-error"
                  : "border-border text-muted hover:border-error/40 hover:text-error"
              )}
            >
              <Heart className={cn("w-3.5 h-3.5", post.likedByMe && "fill-error")} />
              {post.likeCount > 0 ? post.likeCount : t("community.like")}
            </button>
            <button
              onClick={handleToggleComments}
              className={cn(
                "flex items-center gap-1 text-xs font-semibold rounded-full px-2.5 py-1 border transition-all",
                commentsExpanded
                  ? "border-primary/40 bg-primary/5 text-primary"
                  : "border-border text-muted hover:border-primary/40 hover:text-primary"
              )}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {post.commentCount > 0
                ? post.commentCount
                : t("community.comment_placeholder").replace("...", "")}
            </button>
            {onReportPost && (
              <button
                onClick={() => onReportPost(post)}
                className="flex items-center gap-1 text-xs font-semibold rounded-full px-2.5 py-1 border border-border text-muted hover:border-warning hover:text-warning transition-all"
                title={t("community.report")}
              >
                <Flag className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Expanded Comments section */}
          {commentsExpanded && (
            <div className="mt-4 pt-4 border-t border-border space-y-4">
              {loadingComments ? (
                <div className="text-center py-4 text-xs text-muted">{t("common.loading")}</div>
              ) : comments.length === 0 ? (
                <div className="text-center py-4 text-xs text-muted">{t("community.empty_feed_hint")}</div>
              ) : (
                <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
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

              {/* Reply Target Info */}
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

              {/* Comment Composer */}
              <div className="flex items-center gap-2 pt-2">
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

      {/* Confirm Delete Post Modal */}
      {confirmDeleteOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl max-w-sm w-full p-6 shadow-xl animate-scale-in">
            <h3 className="text-base font-bold text-foreground mb-2">{t("community.delete_post")}</h3>
            <p className="text-xs text-muted mb-6">{t("community.confirm_delete")}</p>
            <div className="flex gap-2 justify-end">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirmDeleteOpen(false)}
                disabled={deleting}
                className="rounded-full text-xs"
              >
                {t("community.confirm_no")}
              </Button>
              <Button
                size="sm"
                onClick={handleDeletePost}
                disabled={deleting}
                className="rounded-full text-xs bg-error hover:bg-error/95 text-white"
              >
                {deleting ? t("common.loading") : t("community.confirm_yes")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Post Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl max-w-md w-full p-6 shadow-xl animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-foreground">{t("community.edit")}</h3>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditDraft("");
                  setEditImage(null);
                }}
                className="text-muted hover:text-foreground p-1 rounded-full hover:bg-muted/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              value={editDraft}
              onChange={(e) => setEditDraft(e.target.value)}
              placeholder={t("community.post_placeholder")}
              rows={4}
              disabled={updatingPost}
              className="w-full rounded-2xl border border-border bg-muted/5 p-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none transition-all"
            />

            {/* Edit image attachments */}
            <div className="mt-3">
              {editImage ? (
                <div className="relative inline-block rounded-xl overflow-hidden border border-border max-w-[200px]">
                  <img
                    src={editImage}
                    alt="Xem trước chỉnh sửa"
                    className="w-full h-auto object-cover max-h-32"
                  />
                  <button
                    onClick={() => setEditImage(null)}
                    disabled={updatingPost}
                    className="absolute top-1.5 right-1.5 bg-background/80 backdrop-blur-sm text-foreground p-1 rounded-full hover:bg-background transition-all shadow-sm"
                    title={t("community.delete_image") || "Xóa ảnh"}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs text-muted hover:text-primary transition-colors border border-dashed border-border rounded-xl px-3 py-2 hover:bg-muted/5">
                  <ImageIcon className="w-4 h-4" />
                  {t("community.attach_image")}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 2 * 1024 * 1024) {
                        showToast(t("community.image_size_error"));
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setEditImage(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }}
                    className="hidden"
                    disabled={updatingPost}
                  />
                </label>
              )}
            </div>

            <div className="flex gap-2 justify-end mt-6">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsEditing(false);
                  setEditDraft("");
                  setEditImage(null);
                }}
                disabled={updatingPost}
                className="rounded-full text-xs"
              >
                {t("common.cancel")}
              </Button>
              <Button
                size="sm"
                onClick={handleUpdatePost}
                disabled={(!editDraft.trim() && !editImage) || updatingPost}
                className="rounded-full text-xs"
              >
                {updatingPost ? t("common.loading") : t("common.save")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
