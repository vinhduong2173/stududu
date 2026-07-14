"use client";

import * as React from "react";
import Link from "next/link";
import { Flag, Heart, Users, Image as ImageIcon, X, MessageSquare, MoreVertical, Edit, Trash2 } from "lucide-react";
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
  const [image, setImage] = React.useState<string | null>(null);
  const [posting, setPosting] = React.useState(false);
  const { show: showToast, toast } = useToast();

  // Comments state
  const [expandedPostId, setExpandedPostId] = React.useState<number | null>(null);
  const [comments, setComments] = React.useState<CommentType[]>([]);
  const [loadingComments, setLoadingComments] = React.useState(false);
  const [commentDraft, setCommentDraft] = React.useState("");
  const [postingComment, setPostingComment] = React.useState(false);
  const [replyToComment, setReplyToComment] = React.useState<CommentType | null>(null);

  // Post management states
  const [currentUser, setCurrentUser] = React.useState<{ id: number; displayName: string } | null>(null);
  const [activeMenuPostId, setActiveMenuPostId] = React.useState<number | null>(null);
  const [editingPost, setEditingPost] = React.useState<FeedPost | null>(null);
  const [editDraft, setEditDraft] = React.useState("");
  const [editImage, setEditImage] = React.useState<string | null>(null);
  const [updatingPost, setUpdatingPost] = React.useState(false);
  const [deletingPostId, setDeletingPostId] = React.useState<number | null>(null);
  const [deleting, setDeleting] = React.useState(false);

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

  const handleDeletePost = async (postId: number) => {
    setDeleting(true);
    try {
      await api(`/community/posts/${postId}`, { method: "DELETE" });
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setDeletingPostId(null);
      showToast("✅ Đã xóa bài viết");
    } catch (err: any) {
      showToast(err.message || "Không thể xóa bài viết");
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdatePost = async () => {
    if (!editingPost) return;
    const content = editDraft.trim();
    if (!content) return;
    setUpdatingPost(true);

    const removeImage = !editImage && !!editingPost.imageUrl;
    const isNewImage = editImage && editImage !== editingPost.imageUrl;

    const body: any = { content };
    if (removeImage) {
      body.removeImage = true;
    } else if (isNewImage) {
      body.imageUrl = editImage;
    }

    try {
      const updated = await api<FeedPost>(`/community/posts/${editingPost.id}`, {
        method: "PATCH",
        body,
      });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === editingPost.id
            ? { ...p, content: updated.content, imageUrl: updated.imageUrl }
            : p
        )
      );
      setEditingPost(null);
      setEditDraft("");
      setEditImage(null);
      showToast("✅ Đã cập nhật bài viết");
    } catch (err: any) {
      showToast(err.message || "Không thể cập nhật bài viết");
    } finally {
      setUpdatingPost(false);
    }
  };

  const toggleMenu = (postId: number) => {
    setActiveMenuPostId(activeMenuPostId === postId ? null : postId);
  };

  const handleToggleComments = async (postId: number) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
      setComments([]);
      setReplyToComment(null);
      return;
    }
    setExpandedPostId(postId);
    setLoadingComments(true);
    setCommentDraft("");
    setReplyToComment(null);
    try {
      const fetched = await api<CommentType[]>(`/community/posts/${postId}/comments`);
      setComments(fetched);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async (postId: number) => {
    const val = commentDraft.trim();
    if (!val) return;
    setPostingComment(true);
    try {
      const created = await api<CommentType>(`/community/posts/${postId}/comments`, {
        method: "POST",
        body: { content: val, parentId: replyToComment ? replyToComment.id : undefined },
      });
      setComments((prev) => [...prev, created]);
      setCommentDraft("");
      setReplyToComment(null);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p))
      );
    } catch (err: any) {
      showToast(err.message || "Không gửi được bình luận");
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

  const handleDeleteComment = async (postId: number, commentId: number) => {
    try {
      await api(`/community/comments/${commentId}`, { method: "DELETE" });
      
      // Calculate deleted count (comment + replies)
      const deletedComments = comments.filter((c) => c.id === commentId || c.parentId === commentId);
      const deletedCount = deletedComments.length;

      setComments((prev) => prev.filter((c) => c.id !== commentId && c.parentId !== commentId));
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, commentCount: Math.max(0, p.commentCount - deletedCount) }
            : p
        )
      );
      showToast("✅ Đã xóa bình luận");
    } catch (err: any) {
      showToast(err.message || "Không thể xóa bình luận");
    }
  };

  const renderCommentItem = (c: CommentType, isReply = false, postOwnerId?: number) => (
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
              <span className="text-[10px] text-muted">{timeAgo(c.createdAt)}</span>
            </div>
            <p className="text-foreground mt-0.5 leading-relaxed text-xs break-words">{c.content}</p>
          </div>
          <div className="flex items-center gap-3 mt-1 ml-2 text-[10px] text-muted">
            {!isReply && (
              <button
                onClick={() => setReplyToComment(c)}
                className="hover:underline font-bold"
              >
                Trả lời
              </button>
            )}
            {currentUser && (c.userId === currentUser.id || postOwnerId === currentUser.id) && (
              <>
                {!isReply && <span>•</span>}
                <button
                  onClick={() => handleDeleteComment(c.postId, c.id)}
                  className="hover:underline text-error font-bold"
                >
                  Xóa
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
        title={c.likedByMe ? "Bỏ thích" : "Thích"}
      >
        <Heart className={cn("w-3 h-3", c.likedByMe && "fill-error")} />
        {c.likeCount > 0 && <span className="text-[9px] font-semibold mt-0.5">{c.likeCount}</span>}
      </button>
    </div>
  );

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
            <label className="cursor-pointer flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted text-muted hover:text-primary transition-colors" title="Thêm hình ảnh">
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
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-foreground leading-relaxed flex-1 min-w-0">
                      <Link href={`/profile/${p.user.id}`} className="font-bold hover:underline">
                        {p.user.displayName}
                      </Link>{" "}
                      {postText(p)}
                    </p>

                    {currentUser && p.user.id === currentUser.id && (
                      <div className="relative flex-shrink-0">
                        <button
                          onClick={() => toggleMenu(p.id)}
                          className="p-1 rounded-full text-muted hover:bg-muted/10 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {activeMenuPostId === p.id && (
                          <div className="absolute right-0 mt-1 w-32 bg-surface border border-border rounded-xl shadow-lg py-1 z-20">
                            <button
                              onClick={() => {
                                setEditingPost(p);
                                setEditDraft(p.content || "");
                                setEditImage(p.imageUrl || null);
                                setActiveMenuPostId(null);
                              }}
                              className="w-full text-left px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/10 flex items-center gap-1.5 transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              Chỉnh sửa
                            </button>
                            <button
                              onClick={() => {
                                setDeletingPostId(p.id);
                                setActiveMenuPostId(null);
                              }}
                              className="w-full text-left px-3 py-2 text-xs font-semibold text-error hover:bg-error/5 flex items-center gap-1.5 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Xóa bài viết
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {p.type === "user_post" && p.content && (
                    <p className="text-[15px] text-foreground leading-relaxed mt-1.5 whitespace-pre-wrap break-words">
                      {p.content}
                    </p>
                  )}
                  {p.imageUrl && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-border/50 max-w-md bg-muted/5 inline-block">
                      <img
                        src={p.imageUrl}
                        alt="Đính kèm"
                        className="w-full h-auto object-contain max-h-96"
                      />
                    </div>
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
                      onClick={() => handleToggleComments(p.id)}
                      className={cn(
                        "flex items-center gap-1 text-xs font-semibold rounded-full px-2.5 py-1 border transition-all",
                        expandedPostId === p.id
                          ? "border-primary/40 bg-primary/5 text-primary"
                          : "border-border text-muted hover:border-primary/40 hover:text-primary",
                      )}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      {p.commentCount > 0 ? p.commentCount : "Bình luận"}
                    </button>
                    <button
                      onClick={() => setReportTarget(p)}
                      className="flex items-center gap-1 text-xs font-semibold rounded-full px-2.5 py-1 border border-border text-muted hover:border-warning hover:text-warning transition-all"
                      title="Báo cáo bài viết"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Comments section */}
                  {expandedPostId === p.id && (
                    <div className="mt-4 pt-4 border-t border-border space-y-4">
                      {/* Comments list */}
                      {loadingComments ? (
                        <div className="text-center py-4 text-xs text-muted">Đang tải bình luận...</div>
                      ) : comments.length === 0 ? (
                        <div className="text-center py-4 text-xs text-muted">Chưa có bình luận nào. Hãy là người đầu tiên!</div>
                      ) : (
                        <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                          {comments
                            .filter((c) => !c.parentId)
                            .map((parentComment) => (
                              <div key={parentComment.id} className="space-y-2">
                                {/* Parent Comment */}
                                {renderCommentItem(parentComment, false, p.user.id)}

                                {/* Replies under this parent comment */}
                                {comments
                                  .filter((reply) => reply.parentId === parentComment.id)
                                  .map((replyComment) => renderCommentItem(replyComment, true, p.user.id))}
                              </div>
                            ))}
                        </div>
                      )}

                      {/* Reply Target Info */}
                      {replyToComment && (
                        <div className="flex items-center justify-between bg-muted/30 rounded-xl px-3 py-1.5 text-xs text-muted mb-2 animate-fade-in">
                          <span>
                            Đang trả lời <span className="font-bold text-foreground">@{replyToComment.user.displayName}</span>
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
                              handleAddComment(p.id);
                            }
                          }}
                          placeholder={replyToComment ? `Trả lời @${replyToComment.user.displayName}...` : "Viết bình luận..."}
                          disabled={postingComment}
                          className="flex-1 rounded-full border border-border bg-muted/5 px-4 py-2 text-xs focus:outline-none focus:border-primary transition-colors"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleAddComment(p.id)}
                          disabled={!commentDraft.trim() || postingComment}
                          className="rounded-full text-xs px-4"
                        >
                          {postingComment ? "..." : "Gửi"}
                        </Button>
                      </div>
                    </div>
                  )}
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

      {/* Confirm Delete Post Modal */}
      {deletingPostId && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl max-w-sm w-full p-6 shadow-xl animate-scale-in">
            <h3 className="text-base font-bold text-foreground mb-2">Xác nhận xóa bài viết?</h3>
            <p className="text-xs text-muted mb-6">Hành động này không thể hoàn tác. Bài viết và tất cả bình luận/thích sẽ bị xóa vĩnh viễn.</p>
            <div className="flex gap-2 justify-end">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDeletingPostId(null)}
                disabled={deleting}
                className="rounded-full text-xs"
              >
                Hủy
              </Button>
              <Button
                size="sm"
                onClick={() => handleDeletePost(deletingPostId)}
                disabled={deleting}
                className="rounded-full text-xs bg-error hover:bg-error/95 text-white"
              >
                {deleting ? "Đang xóa..." : "Xóa bài viết"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Post Modal */}
      {editingPost && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl max-w-md w-full p-6 shadow-xl animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-foreground">Chỉnh sửa bài viết</h3>
              <button
                onClick={() => {
                  setEditingPost(null);
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
              placeholder="Nhập nội dung bài viết..."
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
                    title="Xóa ảnh"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs text-muted hover:text-primary transition-colors border border-dashed border-border rounded-xl px-3 py-2 hover:bg-muted/5">
                  <ImageIcon className="w-4 h-4" />
                  Đính kèm hình ảnh
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 2 * 1024 * 1024) {
                        showToast("⚠️ Dung lượng ảnh không được vượt quá 2MB");
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
                  setEditingPost(null);
                  setEditDraft("");
                  setEditImage(null);
                }}
                disabled={updatingPost}
                className="rounded-full text-xs"
              >
                Hủy
              </Button>
              <Button
                size="sm"
                onClick={handleUpdatePost}
                disabled={(!editDraft.trim() && !editImage) || updatingPost}
                className="rounded-full text-xs"
              >
                {updatingPost ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {toast}
    </div>
  );
}
