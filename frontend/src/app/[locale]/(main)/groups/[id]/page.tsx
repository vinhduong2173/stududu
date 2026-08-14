"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Users,
  Lock,
  Globe,
  UserPlus,
  LogOut,
  Send,
  Heart,
  MessageSquare,
  MoreVertical,
  Edit,
  Trash2,
  Flag,
  X,
  Loader2,
  Image as ImageIcon,
  Languages,
  Sparkles,
  Share2,
  Check,
  UserMinus,
  UserX,
  Crown,
  Shield,
  ShieldCheck,
  ShieldOff,
  FileText,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  VolumeX,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { ReportDialog, useToast } from "@/components/features/TrustDialogs";
import { GroupItem } from "@/components/features/GroupModals";
import { cn } from "@/lib/utils";
import { useTranslations, useLocale } from "next-intl";

type GroupPost = {
  id: number;
  type: string;
  contentRef?: string | null;
  content?: string | null;
  imageUrl?: string | null;
  createdAt: string;
  user: { id: number; displayName: string; avatarUrl?: string | null };
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
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

type JoinRequest = {
  id: number;
  groupId: number;
  userId: number;
  status: "pending" | "approved" | "rejected";
  message?: string | null;
  createdAt: string;
  user: { id: number; displayName: string; avatarUrl?: string | null };
};

type MemberType = {
  id: number;
  groupId: number;
  userId: number;
  role: "owner" | "admin" | "member";
  status: "active" | "suspended";
  joinedAt: string;
  user: { id: number; displayName: string; avatarUrl?: string | null };
  isCreator: boolean;
};

function timeAgo(iso: string, t: any): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return t("community.time_just_now") || "vừa xong";
  if (diffMin < 60) return `${diffMin}m`;
  const h = Math.floor(diffMin / 60);
  if (h < 24) return `${h}h`;
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale();
  const { show: showToast } = useToast();

  const groupIdOrSlug = (params?.id as string) || "";

  const [group, setGroup] = React.useState<GroupItem | null>(null);
  const [posts, setPosts] = React.useState<GroupPost[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<{ id: number; displayName: string } | null>(null);

  // Join Requests state (Admin / Owner)
  const [joinRequests, setJoinRequests] = React.useState<JoinRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = React.useState(false);

  // Pending Posts state (Admin / Owner)
  const [pendingPosts, setPendingPosts] = React.useState<GroupPost[]>([]);
  const [loadingPendingPosts, setLoadingPendingPosts] = React.useState(false);

  // Group Members state
  const [members, setMembers] = React.useState<MemberType[]>([]);
  const [loadingMembers, setLoadingMembers] = React.useState(false);
  const [showMembersModal, setShowMembersModal] = React.useState(false);

  // Post creation state
  const [postDraft, setPostDraft] = React.useState("");
  const [postImage, setPostImage] = React.useState<string | null>(null);
  const [posting, setPosting] = React.useState(false);

  // Post management states
  const [activeMenuPostId, setActiveMenuPostId] = React.useState<number | null>(null);
  const [editingPost, setEditingPost] = React.useState<GroupPost | null>(null);
  const [editDraft, setEditDraft] = React.useState("");
  const [editImage, setEditImage] = React.useState<string | null>(null);
  const [updatingPost, setUpdatingPost] = React.useState(false);
  const [deletingPostId, setDeletingPostId] = React.useState<number | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  // Comments state
  const [expandedPostId, setExpandedPostId] = React.useState<number | null>(null);
  const [comments, setComments] = React.useState<CommentType[]>([]);
  const [loadingComments, setLoadingComments] = React.useState(false);
  const [commentDraft, setCommentDraft] = React.useState("");
  const [postingComment, setPostingComment] = React.useState(false);
  const [replyToComment, setReplyToComment] = React.useState<CommentType | null>(null);

  // Translation state
  const [translatedPosts, setTranslatedPosts] = React.useState<Record<number, string>>({});
  const [translatingPostId, setTranslatingPostId] = React.useState<number | null>(null);
  const [showTranslation, setShowTranslation] = React.useState<Record<number, boolean>>({});

  // Report state
  const [reportTarget, setReportTarget] = React.useState<GroupPost | null>(null);

  // Fetch Group details & posts
  const fetchGroupDetails = React.useCallback(async () => {
    if (!groupIdOrSlug) return;
    setLoading(true);
    try {
      const groupRes = await api<GroupItem>(`/groups/${groupIdOrSlug}`);
      setGroup(groupRes);

      try {
        const postsRes = await api<GroupPost[]>(`/groups/${groupRes.id}/posts`);
        setPosts(postsRes);
      } catch {
        setPosts([]);
      }
    } catch (err: any) {
      console.error("Error loading group:", err);
      showToast(err?.message || "Không thể tải thông tin nhóm");
    } finally {
      setLoading(false);
    }
  }, [groupIdOrSlug]);

  const fetchJoinRequests = React.useCallback(async (gid: number) => {
    setLoadingRequests(true);
    try {
      const res = await api<JoinRequest[]>(`/groups/${gid}/requests`);
      setJoinRequests(res);
    } catch {
      setJoinRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  const fetchMembers = React.useCallback(async (gid: number) => {
    setLoadingMembers(true);
    try {
      const res = await api<MemberType[]>(`/groups/${gid}/members`);
      setMembers(res);
    } catch {
      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  React.useEffect(() => {
    fetchGroupDetails();
    api<{ id: number; displayName: string }>("/users/me")
      .then(setCurrentUser)
      .catch(console.error);
  }, [fetchGroupDetails]);

  React.useEffect(() => {
    if (group) {
      fetchMembers(group.id);
    }
    if (
      group &&
      currentUser &&
      (group.creator.id === currentUser.id ||
        group.userContext.role === "owner" ||
        group.userContext.role === "admin")
    ) {
      fetchJoinRequests(group.id);
      fetchPendingPosts(group.id);
    }
  }, [group, currentUser, fetchJoinRequests, fetchMembers]);

  const fetchPendingPosts = React.useCallback(async (gid: number) => {
    setLoadingPendingPosts(true);
    try {
      const res = await api<GroupPost[]>(`/groups/${gid}/pending-posts`);
      setPendingPosts(res);
    } catch {
      setPendingPosts([]);
    } finally {
      setLoadingPendingPosts(false);
    }
  }, []);

  const handleApprovePendingPost = async (postId: number) => {
    if (!group) return;
    try {
      await api(`/groups/${group.id}/pending-posts/${postId}/approve`, { method: "POST" });
      showToast("Đã phê duyệt bài viết");
      setPendingPosts((prev) => prev.filter((p) => p.id !== postId));
      fetchGroupDetails();
    } catch (err: any) {
      showToast(err?.message || "Không thể phê duyệt bài viết");
    }
  };

  const handleRejectPendingPost = async (postId: number) => {
    if (!group) return;
    try {
      await api(`/groups/${group.id}/pending-posts/${postId}/reject`, { method: "POST" });
      showToast("Đã từ chối bài viết");
      setPendingPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err: any) {
      showToast(err?.message || "Không thể từ chối bài viết");
    }
  };

  const handleTogglePostApprovalSetting = async () => {
    if (!group) return;
    const newValue = !group.postApprovalRequired;
    try {
      await api(`/groups/${group.id}/settings`, {
        method: "PATCH",
        body: { postApprovalRequired: newValue },
      });
      setGroup((prev) => (prev ? { ...prev, postApprovalRequired: newValue } : prev));
      showToast(`Đã ${newValue ? "bật" : "tắt"} chế độ kiểm duyệt bài viết`);
    } catch (err: any) {
      showToast(err?.message || "Không thể thay đổi cài đặt kiểm duyệt");
    }
  };

  const handleKickMember = async (m: MemberType) => {
    if (!group) return;
    if (!confirm(`Bạn có chắc chắn muốn xóa "${m.user.displayName}" khỏi nhóm?`)) return;

    try {
      await api(`/groups/${group.id}/members/${m.userId}`, { method: "DELETE" });
      showToast(`Đã xóa thành viên ${m.user.displayName} khỏi nhóm`);
      setMembers((prev) => prev.filter((item) => item.userId !== m.userId));
      setGroup((prev) => (prev ? { ...prev, memberCount: Math.max(1, prev.memberCount - 1) } : prev));
    } catch (err: any) {
      showToast(err?.message || "Không thể xóa thành viên");
    }
  };

  const handleToggleAdmin = async (m: MemberType) => {
    if (!group) return;
    const isGranting = m.role !== "admin";
    const actionText = isGranting ? "trao quyền Quản trị viên cho" : "gỡ quyền Quản trị viên của";
    if (!confirm(`Bạn có chắc chắn muốn ${actionText} "${m.user.displayName}"?`)) return;

    try {
      const newRole = isGranting ? "admin" : "member";
      await api(`/groups/${group.id}/members/${m.userId}/role`, {
        method: "PATCH",
        body: { role: newRole },
      });
      showToast(`Đã ${actionText} ${m.user.displayName}`);
      setMembers((prev) =>
        prev.map((item) => (item.userId === m.userId ? { ...item, role: newRole } : item))
      );
    } catch (err: any) {
      showToast(err?.message || "Không thể thay đổi quyền quản trị");
    }
  };

  const handleApproveRequest = async (req: JoinRequest) => {
    if (!group) return;
    try {
      await api(`/groups/${group.id}/requests/${req.id}/approve`, { method: "POST" });
      showToast(`Đã phê duyệt thành viên ${req.user.displayName}`);
      setJoinRequests((prev) => prev.filter((r) => r.id !== req.id));
      setGroup((prev) => (prev ? { ...prev, memberCount: prev.memberCount + 1 } : prev));
    } catch (err: any) {
      showToast(err?.message || "Không thể phê duyệt thành viên");
    }
  };

  const handleRejectRequest = async (req: JoinRequest) => {
    if (!group) return;
    try {
      await api(`/groups/${group.id}/requests/${req.id}/reject`, { method: "POST" });
      showToast(`Đã từ chối yêu cầu của ${req.user.displayName}`);
      setJoinRequests((prev) => prev.filter((r) => r.id !== req.id));
    } catch (err: any) {
      showToast(err?.message || "Không thể từ chối yêu cầu");
    }
  };

  // Handle Join / Leave
  const handleJoin = async () => {
    if (!group) return;
    setActionLoading(true);
    try {
      await api(`/groups/${group.id}/join`, { method: "POST", body: {} });
      showToast("Tham gia nhóm thành công!");
      fetchGroupDetails();
    } catch (err: any) {
      showToast(err?.message || "Không thể tham gia nhóm");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!group) return;
    if (!confirm("Bạn có chắc chắn muốn rời nhóm này?")) return;
    setActionLoading(true);
    try {
      await api(`/groups/${group.id}/leave`, { method: "POST" });
      showToast("Đã rời nhóm");
      fetchGroupDetails();
    } catch (err: any) {
      showToast(err?.message || "Không thể rời nhóm");
    } finally {
      setActionLoading(false);
    }
  };

  // Image File Upload Helper
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast("Kích thước ảnh tối đa 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPostImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast("Kích thước ảnh tối đa 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setEditImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle Create Post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group || (!postDraft.trim() && !postImage)) return;

    setPosting(true);
    try {
      const res = await api<{ isPendingApproval?: boolean }>(`/groups/${group.id}/posts`, {
        method: "POST",
        body: {
          content: postDraft.trim() || undefined,
          imageUrl: postImage || undefined,
        },
      });
      setPostDraft("");
      setPostImage(null);

      if (res?.isPendingApproval) {
        showToast("Bài viết của bạn đã được gửi và đang chờ Quản trị viên phê duyệt!");
      } else {
        showToast("Đăng bài thành công!");
      }

      const postsRes = await api<GroupPost[]>(`/groups/${group.id}/posts`);
      setPosts(postsRes);
    } catch (err: any) {
      showToast(err?.message || "Không thể đăng bài");
    } finally {
      setPosting(false);
    }
  };

  // Handle Likes / Reactions
  const toggleLike = async (post: GroupPost) => {
    const isLiked = post.likedByMe;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? {
              ...p,
              likedByMe: !isLiked,
              likeCount: isLiked ? p.likeCount - 1 : p.likeCount + 1,
            }
          : p
      )
    );

    try {
      if (isLiked) {
        await api(`/community/posts/${post.id}/like`, { method: "DELETE" });
      } else {
        await api(`/community/posts/${post.id}/like`, { method: "POST" });
      }
    } catch {
      // Revert on error
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? {
                ...p,
                likedByMe: isLiked,
                likeCount: isLiked ? p.likeCount + 1 : p.likeCount - 1,
              }
            : p
        )
      );
    }
  };

  // Handle Comments Toggle & Fetch
  const handleToggleComments = async (postId: number) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
      setComments([]);
      return;
    }

    setExpandedPostId(postId);
    setLoadingComments(true);
    try {
      const res = await api<CommentType[]>(`/community/posts/${postId}/comments`);
      setComments(res);
    } catch (err) {
      console.error(err);
      showToast("Không thể tải bình luận");
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async (postId: number) => {
    if (!commentDraft.trim()) return;

    setPostingComment(true);
    try {
      const newComment = await api<CommentType>(`/community/posts/${postId}/comments`, {
        method: "POST",
        body: {
          content: commentDraft.trim(),
          parentId: replyToComment?.id || undefined,
        },
      });

      setComments((prev) => [...prev, newComment]);
      setCommentDraft("");
      setReplyToComment(null);

      // Increment comment count in UI
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p))
      );
    } catch (err: any) {
      showToast(err?.message || "Không thể đăng bình luận");
    } finally {
      setPostingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number, postId: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bình luận này?")) return;

    try {
      await api(`/community/comments/${commentId}`, { method: "DELETE" });
      setComments((prev) => prev.filter((c) => c.id !== commentId && c.parentId !== commentId));
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, commentCount: Math.max(0, p.commentCount - 1) } : p))
      );
      showToast("Đã xóa bình luận");
    } catch (err: any) {
      showToast(err?.message || "Không thể xóa bình luận");
    }
  };

  const toggleCommentLike = async (comment: CommentType) => {
    const isLiked = comment.likedByMe;
    setComments((prev) =>
      prev.map((c) =>
        c.id === comment.id
          ? {
              ...c,
              likedByMe: !isLiked,
              likeCount: isLiked ? c.likeCount - 1 : c.likeCount + 1,
            }
          : c
      )
    );

    try {
      if (isLiked) {
        await api(`/community/comments/${comment.id}/like`, { method: "DELETE" });
      } else {
        await api(`/community/comments/${comment.id}/like`, { method: "POST" });
      }
    } catch {
      setComments((prev) =>
        prev.map((c) =>
          c.id === comment.id
            ? {
                ...c,
                likedByMe: isLiked,
                likeCount: isLiked ? c.likeCount + 1 : c.likeCount - 1,
              }
            : c
        )
      );
    }
  };

  // Handle Edit Post
  const handleUpdatePost = async () => {
    if (!editingPost) return;
    setUpdatingPost(true);
    try {
      const updated = await api<GroupPost>(`/community/posts/${editingPost.id}`, {
        method: "PATCH",
        body: {
          content: editDraft.trim(),
          imageUrl: editImage || undefined,
          removeImage: !editImage && !!editingPost.imageUrl,
        },
      });

      setPosts((prev) => prev.map((p) => (p.id === editingPost.id ? { ...p, ...updated } : p)));
      setEditingPost(null);
      showToast("Đã cập nhật bài viết");
    } catch (err: any) {
      showToast(err?.message || "Không thể cập nhật bài viết");
    } finally {
      setUpdatingPost(false);
    }
  };

  // Handle Delete Post
  const handleDeletePost = async () => {
    if (!deletingPostId) return;
    setDeleting(true);
    try {
      await api(`/community/posts/${deletingPostId}`, { method: "DELETE" });
      setPosts((prev) => prev.filter((p) => p.id !== deletingPostId));
      setDeletingPostId(null);
      showToast("Đã xóa bài viết");
    } catch (err: any) {
      showToast(err?.message || "Không thể xóa bài viết");
    } finally {
      setDeleting(false);
    }
  };

  // Handle Translation
  const handleTranslatePost = async (p: GroupPost) => {
    if (showTranslation[p.id]) {
      setShowTranslation((prev) => ({ ...prev, [p.id]: false }));
      return;
    }
    if (translatedPosts[p.id]) {
      setShowTranslation((prev) => ({ ...prev, [p.id]: true }));
      return;
    }

    const textToTranslate = p.content || p.contentRef || "";
    if (!textToTranslate.trim()) return;

    setTranslatingPostId(p.id);
    try {
      const res = await api<{ translation: string }>("/translate", {
        method: "POST",
        body: { text: textToTranslate, target: locale === "en" ? "en" : "vi", source: "auto" },
      });
      setTranslatedPosts((prev) => ({ ...prev, [p.id]: res.translation }));
      setShowTranslation((prev) => ({ ...prev, [p.id]: true }));
    } catch (err) {
      console.error(err);
      showToast("Dịch thất bại, thử lại sau");
    } finally {
      setTranslatingPostId(null);
    }
  };

  // Render Comment Item Component
  const renderCommentItem = (comment: CommentType, isReply = false, postOwnerId?: number) => (
    <div key={comment.id} className={cn("flex gap-2.5 items-start text-xs", isReply && "ml-8 mt-2")}>
      <Link href={`/profile/${comment.user.id}`}>
        <Avatar
          src={comment.user.avatarUrl ?? undefined}
          fallback={comment.user.displayName.charAt(0)}
          size="sm"
        />
      </Link>
      <div className="flex-1 min-w-0">
        <div className="bg-muted/15 p-2.5 rounded-2xl border border-border/50 inline-block max-w-full">
          <div className="flex items-center gap-2">
            <Link href={`/profile/${comment.user.id}`} className="font-bold text-foreground hover:underline">
              {comment.user.displayName}
            </Link>
            {postOwnerId && comment.user.id === postOwnerId && (
              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.2 rounded font-semibold">
                Tác giả
              </span>
            )}
          </div>
          <p className="text-foreground leading-relaxed mt-0.5 whitespace-pre-wrap break-words">
            {comment.content}
          </p>
        </div>
        <div className="flex items-center gap-3 mt-1 text-[11px] text-muted pl-1">
          <span>{timeAgo(comment.createdAt, t)}</span>
          <button
            onClick={() => toggleCommentLike(comment)}
            className={cn("font-semibold hover:underline", comment.likedByMe && "text-error")}
          >
            {comment.likedByMe ? "Đã thích" : "Thích"}{" "}
            {comment.likeCount > 0 && `(${comment.likeCount})`}
          </button>
          {!isReply && (
            <button
              onClick={() => setReplyToComment(comment)}
              className="font-semibold hover:underline text-primary"
            >
              Trả lời
            </button>
          )}
          {currentUser && comment.user.id === currentUser.id && (
            <button
              onClick={() => handleDeleteComment(comment.id, comment.postId)}
              className="font-semibold hover:underline text-error"
            >
              Xóa
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in">
      {/* Back Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/community")}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-surface hover:bg-muted/10 text-xs font-semibold text-foreground transition-all shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-primary" />
          <span>Quay lại Cộng đồng</span>
        </button>

        {group && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: group.name, url: window.location.href });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  showToast("Đã sao chép liên kết nhóm!");
                }
              }}
              className="p-2 rounded-xl border border-border bg-surface hover:bg-muted/10 text-muted hover:text-foreground transition-all shadow-xs"
              title="Chia sẻ nhóm"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center space-y-3 bg-surface rounded-3xl border border-border shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs font-semibold text-muted">Đang tải trang nhóm...</p>
        </div>
      ) : group ? (
        <div className="space-y-6">
          {/* Facebook-style Group Hero Banner */}
          <div className="bg-surface rounded-3xl border border-border shadow-md overflow-hidden">
            {/* Cover Image */}
            <div className="relative h-56 md:h-72 w-full bg-gradient-to-r from-primary/30 via-pink-500/20 to-warning/30 overflow-hidden">
              {group.coverUrl ? (
                <img
                  src={group.coverUrl}
                  alt={group.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-primary/30">
                  <Sparkles className="w-24 h-24" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
            </div>

            {/* Header Body */}
            <div className="p-6 md:p-8 pt-0 relative -mt-16 md:-mt-20 space-y-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                {/* Avatar & Title */}
                <div className="flex flex-col md:flex-row items-center md:items-end gap-5 text-center md:text-left">
                  <div className="w-28 h-28 md:w-32 md:h-32 rounded-3xl border-4 border-surface shadow-2xl bg-surface overflow-hidden flex items-center justify-center text-primary font-bold text-3xl font-display shrink-0">
                    {group.avatarUrl ? (
                      <img
                        src={group.avatarUrl}
                        alt={group.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      group.name.charAt(0).toUpperCase()
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-3 justify-center md:justify-start flex-wrap">
                      <h1 className="text-2xl md:text-3xl font-bold text-foreground font-display">
                        {group.name}
                      </h1>
                      {group.privacy === "private" ? (
                        <span className="text-xs px-3 py-1 rounded-full bg-pink-500/10 text-pink-500 font-semibold border border-pink-500/20 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5" />
                          Nhóm Riêng tư
                        </span>
                      ) : (
                        <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold border border-primary/20 flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5" />
                          Nhóm Công khai
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-center md:justify-start gap-4 text-xs text-muted font-medium flex-wrap">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-primary" />
                        <strong className="text-foreground">{group.memberCount}</strong> thành viên
                      </span>
                      {group.language && (
                        <span>· Ngôn ngữ: <strong className="text-foreground">{group.language.name}</strong></span>
                      )}
                      <span>· Quản trị: <strong className="text-foreground">{group.creator.displayName}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Join / Leave Actions */}
                <div className="flex items-center justify-center md:justify-end gap-3 shrink-0">
                  {group.userContext.isMember ? (
                    <Button
                      variant="outline"
                      onClick={handleLeave}
                      disabled={actionLoading}
                      className="rounded-2xl text-xs font-semibold gap-2 text-rose-500 border-rose-500/30 hover:bg-rose-500/10 h-10 px-5"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Rời nhóm</span>
                    </Button>
                  ) : group.userContext.hasPendingRequest ? (
                    <Button
                      disabled
                      className="rounded-2xl text-xs font-semibold gap-2 bg-warning/20 text-warning border border-warning/30 h-10 px-5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Đã gửi yêu cầu gia nhập</span>
                    </Button>
                  ) : (
                    <Button
                      onClick={handleJoin}
                      disabled={actionLoading}
                      className="sd-btn-gradient rounded-2xl text-xs font-bold gap-2 shadow-md h-10 px-6"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Tham gia nhóm</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Description Block */}
              {group.description && (
                <div className="p-4 rounded-2xl bg-muted/10 border border-border/60 text-xs text-foreground/90 leading-relaxed">
                  <p className="font-bold text-foreground mb-1">Mô tả nhóm:</p>
                  <p className="whitespace-pre-wrap">{group.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Group Content Feed Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Main Feed (2 cols) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Create Post Card (Members only) */}
              {group.userContext.isMember ? (
                <div className="bg-surface rounded-3xl border border-border shadow-xs p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={currentUser?.displayName}
                      fallback={currentUser?.displayName?.charAt(0) || "U"}
                      size="md"
                    />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-foreground">Chia sẻ tin bài với nhóm</p>
                      <p className="text-[11px] text-muted">Đăng câu hỏi, kinh nghiệm học tập hoặc ý tưởng</p>
                    </div>
                  </div>

                  <form onSubmit={handleCreatePost} className="space-y-3">
                    <textarea
                      value={postDraft}
                      onChange={(e) => setPostDraft(e.target.value)}
                      placeholder="Bạn đang muốn chia sẻ điều gì với các thành viên trong nhóm?"
                      rows={3}
                      className="w-full text-xs p-3 rounded-2xl border border-border/60 bg-muted/10 text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-all resize-none"
                    />

                    {postImage && (
                      <div className="relative rounded-2xl overflow-hidden border border-border max-h-52 w-full group">
                        <img src={postImage} alt="Attachment" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setPostImage(null)}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <label
                        className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border/60 bg-muted/10 hover:bg-muted/20 text-xs font-semibold text-muted hover:text-foreground transition-colors"
                      >
                        <ImageIcon className="w-4 h-4 text-primary" />
                        <span>Đính kèm ảnh</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                          disabled={posting}
                        />
                      </label>

                      <Button
                        type="submit"
                        disabled={posting || (!postDraft.trim() && !postImage)}
                        className="sd-btn-gradient rounded-xl text-xs font-bold gap-2 px-5 h-9"
                      >
                        {posting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Đang đăng...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Đăng bài</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="p-6 rounded-3xl bg-muted/10 border border-dashed border-border text-center space-y-2">
                  <p className="text-xs font-bold text-foreground">Bạn chưa phải là thành viên của nhóm</p>
                  <p className="text-xs text-muted max-w-sm mx-auto">
                    Hãy tham gia nhóm để đăng bài chia sẻ, thảo luận và tương tác cùng các thành viên khác!
                  </p>
                </div>
              )}

              {/* Group Feed Posts List */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-foreground flex items-center justify-between px-1">
                  <span>Bài viết trong nhóm ({posts.length})</span>
                </h3>

                {posts.length === 0 ? (
                  <div className="p-12 text-center bg-surface rounded-3xl border border-border space-y-2">
                    <div className="text-4xl mb-2">💬</div>
                    <p className="text-sm font-bold text-foreground">Chưa có bài viết nào</p>
                    <p className="text-xs text-muted">Hãy là người đầu tiên đăng bài trong nhóm này!</p>
                  </div>
                ) : (
                  posts.map((p) => (
                    <div
                      key={p.id}
                      className="bg-surface rounded-3xl border border-border shadow-xs p-5 space-y-3 transition-all"
                    >
                      {/* Post Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Link href={`/profile/${p.user.id}`}>
                            <Avatar
                              src={p.user.avatarUrl ?? undefined}
                              fallback={p.user.displayName.charAt(0)}
                              size="md"
                            />
                          </Link>
                          <div>
                            <Link href={`/profile/${p.user.id}`} className="font-bold text-xs text-foreground hover:underline">
                              {p.user.displayName}
                            </Link>
                            <p className="text-[10px] text-muted mt-0.5">
                              {timeAgo(p.createdAt, t)}
                            </p>
                          </div>
                        </div>

                        {/* Owner & Admin Management Menu */}
                        {currentUser && (p.user.id === currentUser.id || group.creator.id === currentUser.id || group.userContext.role === "owner" || group.userContext.role === "admin") && (
                          <div className="relative">
                            <button
                              onClick={() => setActiveMenuPostId(activeMenuPostId === p.id ? null : p.id)}
                              className="p-1.5 rounded-full text-muted hover:bg-muted/10 transition-colors"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {activeMenuPostId === p.id && (
                              <div className="absolute right-0 mt-1 w-36 bg-surface border border-border rounded-2xl shadow-xl py-1 z-20 overflow-hidden">
                                {p.user.id === currentUser.id && (
                                  <button
                                    onClick={() => {
                                      setEditingPost(p);
                                      setEditDraft(p.content || "");
                                      setEditImage(p.imageUrl || null);
                                      setActiveMenuPostId(null);
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/10 flex items-center gap-2 transition-colors"
                                  >
                                    <Edit className="w-3.5 h-3.5 text-primary" />
                                    Chỉnh sửa
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setDeletingPostId(p.id);
                                    setActiveMenuPostId(null);
                                  }}
                                  className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-500/5 flex items-center gap-2 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Xóa bài viết
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Post Content */}
                      {p.content && (
                        <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">
                          {p.content}
                        </p>
                      )}

                      {/* See Translation */}
                      <button
                        onClick={() => handleTranslatePost(p)}
                        disabled={translatingPostId === p.id}
                        className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1 transition-colors"
                      >
                        <Languages className="w-3.5 h-3.5" />
                        <span>
                          {translatingPostId === p.id
                            ? "..."
                            : showTranslation[p.id]
                            ? "Ẩn bản dịch"
                            : "Xem bản dịch"}
                        </span>
                      </button>

                      {/* Translation Content */}
                      {showTranslation[p.id] && translatedPosts[p.id] && (
                        <div className="p-3 rounded-2xl bg-primary/5 border border-primary/20 text-xs leading-relaxed text-foreground">
                          <div className="flex items-center justify-between text-[10px] font-bold text-primary mb-1">
                            <span className="flex items-center gap-1">
                              <Languages className="w-3 h-3" />
                              Bản dịch tự động
                            </span>
                            <button
                              onClick={() => setShowTranslation((prev) => ({ ...prev, [p.id]: false }))}
                              className="text-muted hover:text-foreground"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="whitespace-pre-wrap">{translatedPosts[p.id]}</p>
                        </div>
                      )}

                      {/* Post Image (Full display without cropping) */}
                      {p.imageUrl && (
                        <div className="mt-3 rounded-2xl overflow-hidden border border-border/50 w-full bg-muted/5 flex items-center justify-center p-1">
                          <img
                            src={p.imageUrl}
                            alt="Attachment"
                            className="w-full h-auto object-contain max-h-[600px] rounded-xl"
                          />
                        </div>
                      )}

                      {/* Action Bar (Like, Comment, Report) */}
                      <div className="flex items-center gap-3 pt-2 border-t border-border/50 flex-wrap">
                        <button
                          onClick={() => toggleLike(p)}
                          className={cn(
                            "flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-1 border transition-all",
                            p.likedByMe
                              ? "border-rose-500/40 bg-rose-500/10 text-rose-500"
                              : "border-border text-muted hover:border-rose-500/40 hover:text-rose-500"
                          )}
                        >
                          <Heart className={cn("w-3.5 h-3.5", p.likedByMe && "fill-rose-500 text-rose-500")} />
                          <span>{p.likeCount > 0 ? p.likeCount : "Thích"}</span>
                        </button>

                        <button
                          onClick={() => handleToggleComments(p.id)}
                          className={cn(
                            "flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-1 border transition-all",
                            expandedPostId === p.id
                              ? "border-primary/40 bg-primary/10 text-primary"
                              : "border-border text-muted hover:border-primary/40 hover:text-primary"
                          )}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>{p.commentCount > 0 ? `${p.commentCount} Bình luận` : "Bình luận"}</span>
                        </button>

                        <button
                          onClick={() => setReportTarget(p)}
                          className="flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-1 border border-border text-muted hover:border-warning hover:text-warning transition-all"
                          title="Báo cáo"
                        >
                          <Flag className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Comments Section */}
                      {expandedPostId === p.id && (
                        <div className="mt-4 pt-4 border-t border-border/60 space-y-4 animate-fade-in">
                          {loadingComments ? (
                            <div className="text-center py-4 text-xs text-muted flex items-center justify-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin text-primary" />
                              <span>Đang tải bình luận...</span>
                            </div>
                          ) : comments.length === 0 ? (
                            <div className="text-center py-4 text-xs text-muted">
                              Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
                            </div>
                          ) : (
                            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                              {comments
                                .filter((c) => !c.parentId)
                                .map((parentComment) => (
                                  <div key={parentComment.id} className="space-y-2">
                                    {renderCommentItem(parentComment, false, p.user.id)}
                                    {comments
                                      .filter((reply) => reply.parentId === parentComment.id)
                                      .map((replyComment) => renderCommentItem(replyComment, true, p.user.id))}
                                  </div>
                                ))}
                            </div>
                          )}

                          {replyToComment && (
                            <div className="flex items-center justify-between bg-muted/20 rounded-xl px-3 py-1.5 text-xs text-muted border border-border/50">
                              <span>Trả lời <strong>{replyToComment.user.displayName}</strong></span>
                              <button
                                onClick={() => setReplyToComment(null)}
                                className="text-muted hover:text-foreground"
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
                                  handleAddComment(p.id);
                                }
                              }}
                              placeholder={
                                replyToComment
                                  ? `Trả lời ${replyToComment.user.displayName}...`
                                  : "Viết bình luận của bạn..."
                              }
                              disabled={postingComment}
                              className="flex-1 rounded-2xl border border-border bg-muted/10 px-4 py-2 text-xs focus:outline-none focus:border-primary transition-colors text-foreground"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleAddComment(p.id)}
                              disabled={!commentDraft.trim() || postingComment}
                              className="sd-btn-gradient rounded-xl text-xs px-4 h-8 font-semibold"
                            >
                              {postingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Gửi"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Sidebar (1 col) - Group Info & Stats */}
            <div className="space-y-6">
              <div className="bg-surface rounded-3xl border border-border shadow-xs p-6 space-y-4 sticky top-6">
                <h3 className="text-sm font-bold text-foreground font-display border-b border-border/60 pb-3">
                  Thông tin nhóm
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Quyền riêng tư:</span>
                    <span className="font-bold text-foreground">
                      {group.privacy === "private" ? "Riêng tư" : "Công khai"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted">Số thành viên:</span>
                    <span className="font-bold text-foreground">{group.memberCount} thành viên</span>
                  </div>

                  {group.language && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted">Ngôn ngữ chính:</span>
                      <span className="font-bold text-foreground">{group.language.name}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-muted">Ngày thành lập:</span>
                    <span className="font-bold text-foreground">
                      {new Date(group.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                </div>

                {/* Post Moderation Setting Toggle */}
                {currentUser && (group.creator.id === currentUser.id || group.userContext.role === "owner" || group.userContext.role === "admin") && (
                  <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                    <div className="text-xs">
                      <p className="font-bold text-foreground">Kiểm duyệt bài viết</p>
                      <p className="text-[10px] text-muted">Duyệt bài trước khi công khai</p>
                    </div>
                    <button
                      onClick={handleTogglePostApprovalSetting}
                      className="p-1 rounded-xl hover:bg-muted/10 text-primary transition-colors"
                      title={group.postApprovalRequired ? "Tắt kiểm duyệt bài viết" : "Bật kiểm duyệt bài viết"}
                    >
                      {group.postApprovalRequired ? (
                        <ToggleRight className="w-7 h-7 text-primary" />
                      ) : (
                        <ToggleLeft className="w-7 h-7 text-muted" />
                      )}
                    </button>
                  </div>
                )}

                <div className="pt-3 border-t border-border/60 space-y-3">
                  <p className="text-xs font-bold text-foreground">Người tạo nhóm</p>
                  <Link href={`/profile/${group.creator.id}`} className="flex items-center gap-3 group p-2 rounded-2xl hover:bg-muted/10 transition-colors">
                    <Avatar
                      src={group.creator.avatarUrl ?? undefined}
                      fallback={group.creator.displayName.charAt(0)}
                      size="md"
                    />
                    <div>
                      <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                        {group.creator.displayName}
                      </p>
                      <p className="text-[10px] text-muted">Admin / Creator</p>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Pending Posts Card for Group Admins / Owners */}
              {currentUser && (group.creator.id === currentUser.id || group.userContext.role === "owner" || group.userContext.role === "admin") && (
                <div className="bg-surface rounded-3xl border border-border shadow-xs p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <h3 className="text-sm font-bold text-foreground font-display flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-500" />
                      <span>Bài viết chờ duyệt</span>
                    </h3>
                    {pendingPosts.length > 0 && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-bold">
                        {pendingPosts.length}
                      </span>
                    )}
                  </div>

                  {loadingPendingPosts ? (
                    <div className="py-4 text-center text-xs text-muted flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span>Đang tải bài viết chờ duyệt...</span>
                    </div>
                  ) : pendingPosts.length === 0 ? (
                    <p className="text-xs text-muted text-center py-2">
                      Không có bài viết nào đang chờ duyệt.
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                      {pendingPosts.map((p) => (
                        <div key={p.id} className="p-3 rounded-2xl bg-muted/10 border border-border/60 space-y-2">
                          <div className="flex items-center gap-2.5">
                            <Link href={`/profile/${p.user.id}`}>
                              <Avatar
                                src={p.user.avatarUrl ?? undefined}
                                fallback={p.user.displayName.charAt(0)}
                                size="sm"
                              />
                            </Link>
                            <div className="min-w-0 flex-1">
                              <Link href={`/profile/${p.user.id}`} className="font-bold text-xs text-foreground hover:underline truncate block">
                                {p.user.displayName}
                              </Link>
                              <span className="text-[10px] text-muted">{timeAgo(p.createdAt, t)}</span>
                            </div>
                          </div>

                          {p.content && (
                            <p className="text-xs text-foreground/90 bg-background/50 p-2 rounded-xl border border-border/40 text-[11px] line-clamp-3">
                              {p.content}
                            </p>
                          )}

                          {p.imageUrl && (
                            <img src={p.imageUrl} alt="Pending Attachment" className="w-full h-24 object-cover rounded-xl border border-border/40" />
                          )}

                          <div className="flex items-center gap-2 pt-1">
                            <Button
                              size="sm"
                              onClick={() => handleApprovePendingPost(p.id)}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold h-7 gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Duyệt</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRejectPendingPost(p.id)}
                              className="flex-1 rounded-xl text-xs font-semibold h-7 text-rose-500 border-rose-500/30 hover:bg-rose-500/10 gap-1"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Từ chối</span>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Join Requests Card for Group Admins / Owners */}
              {currentUser && (group.creator.id === currentUser.id || group.userContext.role === "owner" || group.userContext.role === "admin") && (
                <div className="bg-surface rounded-3xl border border-border shadow-xs p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <h3 className="text-sm font-bold text-foreground font-display flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-primary" />
                      <span>Yêu cầu gia nhập</span>
                    </h3>
                    {joinRequests.length > 0 && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                        {joinRequests.length}
                      </span>
                    )}
                  </div>

                  {loadingRequests ? (
                    <div className="py-4 text-center text-xs text-muted flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span>Đang tải...</span>
                    </div>
                  ) : joinRequests.length === 0 ? (
                    <p className="text-xs text-muted text-center py-2">
                      Không có yêu cầu gia nhập nào đang chờ phê duyệt.
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {joinRequests.map((req) => (
                        <div key={req.id} className="p-3 rounded-2xl bg-muted/10 border border-border/60 space-y-2">
                          <div className="flex items-center gap-2.5">
                            <Link href={`/profile/${req.user.id}`}>
                              <Avatar
                                src={req.user.avatarUrl ?? undefined}
                                fallback={req.user.displayName.charAt(0)}
                                size="sm"
                              />
                            </Link>
                            <div className="min-w-0 flex-1">
                              <Link href={`/profile/${req.user.id}`} className="font-bold text-xs text-foreground hover:underline truncate block">
                                {req.user.displayName}
                              </Link>
                              <span className="text-[10px] text-muted">{timeAgo(req.createdAt, t)}</span>
                            </div>
                          </div>

                          {req.message && (
                            <p className="text-xs text-foreground/80 bg-background/50 p-2 rounded-xl border border-border/40 text-[11px]">
                              "{req.message}"
                            </p>
                          )}

                          <div className="flex items-center gap-2 pt-1">
                            <Button
                              size="sm"
                              onClick={() => handleApproveRequest(req)}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold h-7 gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Duyệt</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRejectRequest(req)}
                              className="flex-1 rounded-xl text-xs font-semibold h-7 text-rose-500 border-rose-500/30 hover:bg-rose-500/10 gap-1"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Từ chối</span>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Group Members Sidebar Card - Single Button as requested */}
              <div className="bg-surface rounded-3xl border border-border shadow-xs p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <h3 className="text-sm font-bold text-foreground font-display flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span>Thành viên nhóm</span>
                  </h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                    {group.memberCount}
                  </span>
                </div>

                <p className="text-xs text-muted">
                  Xem danh sách toàn bộ {group.memberCount} thành viên, vai trò người tạo, quản trị viên và các quyền quản lý.
                </p>

                <Link href={`/groups/${group.slug || group.id}/members`}>
                  <Button
                    className="w-full sd-btn-gradient rounded-2xl text-xs font-bold py-2.5 flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Users className="w-4 h-4" />
                    <span>Danh sách thành viên ({group.memberCount})</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-16 text-center bg-surface rounded-3xl border border-border text-rose-500 font-semibold text-sm">
          Không tìm thấy nhóm hoặc nhóm không tồn tại.
        </div>
      )}

      {/* Edit Post Modal */}
      {editingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface border border-border rounded-3xl p-6 w-full max-w-lg space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-sm font-bold text-foreground">Chỉnh sửa bài viết</h3>
              <button onClick={() => setEditingPost(null)} className="text-muted hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <textarea
              value={editDraft}
              onChange={(e) => setEditDraft(e.target.value)}
              rows={4}
              className="w-full p-3 rounded-2xl border border-border bg-muted/10 text-xs text-foreground focus:outline-none focus:border-primary resize-none"
            />

            {editImage ? (
              <div className="relative rounded-2xl overflow-hidden border border-border max-h-52 w-full bg-black/5">
                <img src={editImage} alt="Attachment" className="w-full h-full object-contain max-h-48" />
                <div className="absolute top-2 right-2 flex items-center gap-1.5">
                  <label className="cursor-pointer bg-black/60 hover:bg-black text-white p-1.5 rounded-full transition-colors" title="Đổi ảnh">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditImageChange}
                      className="hidden"
                      disabled={updatingPost}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditImage(null)}
                    disabled={updatingPost}
                    className="bg-black/60 hover:bg-black text-white p-1.5 rounded-full transition-colors"
                    title="Xóa ảnh"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <label className="cursor-pointer inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-foreground transition-colors border border-dashed border-border/80 rounded-2xl px-3.5 py-2 hover:bg-muted/10">
                <ImageIcon className="w-4 h-4 text-primary" />
                <span>Đính kèm / Thêm ảnh bài viết</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleEditImageChange}
                  className="hidden"
                  disabled={updatingPost}
                />
              </label>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setEditingPost(null)} className="rounded-xl text-xs">
                Hủy
              </Button>
              <Button
                size="sm"
                onClick={handleUpdatePost}
                disabled={updatingPost || (!editDraft.trim() && !editImage)}
                className="sd-btn-gradient rounded-xl text-xs font-bold"
              >
                {updatingPost ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Post Dialog */}
      {deletingPostId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface border border-border rounded-3xl p-6 w-full max-w-sm space-y-4 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Xác nhận xóa bài viết</h3>
              <p className="text-xs text-muted mt-1">Hành động này không thể hoàn tác.</p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDeletingPostId(null)} className="rounded-xl text-xs">
                Hủy
              </Button>
              <Button
                size="sm"
                onClick={handleDeletePost}
                disabled={deleting}
                className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold"
              >
                {deleting ? "Đang xóa..." : "Xóa bài viết"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Report Dialog */}
      {reportTarget && (
        <ReportDialog
          open={!!reportTarget}
          onClose={() => setReportTarget(null)}
          targetId={reportTarget.user.id}
          targetName={reportTarget.user.displayName}
          targetType="post"
          targetContentId={reportTarget.id}
          onDone={() => showToast("Đã gửi báo cáo bài viết. Cảm ơn bạn!")}
        />
      )}
    </div>
  );
}
