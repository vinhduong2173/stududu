"use client";

import * as React from "react";
import Link from "next/link";
import {
  Flag,
  Heart,
  Users,
  Image as ImageIcon,
  X,
  MessageSquare,
  MoreVertical,
  Edit,
  Trash2,
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Check,
  Sparkles,
  Trophy,
  HelpCircle,
  UserPlus,
  ArrowRight,
  Languages,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { ReportDialog, useToast } from "@/components/features/TrustDialogs";
import { ChallengeBoard } from "@/components/features/ChallengeBoard";
import { cn } from "@/lib/utils";
import { useTranslations, useLocale } from "next-intl";

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

type DailyWord = {
  index: number;
  term: string;
  partOfSpeech: string;
  phonetic: string;
  definition: string;
  example: string;
  isSaved: boolean;
  languageId?: number;
};

type DailyWordsResponse = {
  language: { code: string; name: string };
  total: number;
  words: DailyWord[];
};

type LanguageGroupItem = {
  id: string;
  name: string;
  langCode: string;
  members: number;
  description: string;
  bgColor: string;
  textColor: string;
};

function getSuggestedGroups(t: any): LanguageGroupItem[] {
  return [
    {
      id: "en-learners",
      name: "English Learners",
      langCode: "EN",
      members: 4210,
      description: t("community.group_en_desc"),
      bgColor: "bg-blue-100 dark:bg-blue-950/40",
      textColor: "text-blue-600 dark:text-blue-400",
    },
    {
      id: "ja-group",
      name: "日本語 Group",
      langCode: "日",
      members: 1670,
      description: t("community.group_ja_desc"),
      bgColor: "bg-pink-100 dark:bg-pink-950/40",
      textColor: "text-pink-600 dark:text-pink-400",
    },
    {
      id: "ko-study",
      name: "한국어 스터디",
      langCode: "韓",
      members: 980,
      description: t("community.group_ko_desc"),
      bgColor: "bg-purple-100 dark:bg-purple-950/40",
      textColor: "text-purple-600 dark:text-purple-400",
    },
    {
      id: "fr-practice",
      name: "French Practice",
      langCode: "FR",
      members: 750,
      description: t("community.group_fr_desc"),
      bgColor: "bg-amber-100 dark:bg-amber-950/40",
      textColor: "text-amber-600 dark:text-amber-400",
    },
  ];
}

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
  const locale = useLocale();
  const { show: showToast, toast } = useToast();

  // Navigation tab state
  const [activeTab, setActiveTab] = React.useState<
    "feed" | "challenges" | "groups" | "events"
  >("feed");

  // Feed posts state
  const [posts, setPosts] = React.useState<FeedPost[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [reportTarget, setReportTarget] = React.useState<FeedPost | null>(null);
  const [draft, setDraft] = React.useState("");
  const [image, setImage] = React.useState<string | null>(null);
  const [posting, setPosting] = React.useState(false);

  // Post Translation state
  const [translatedPosts, setTranslatedPosts] = React.useState<Record<number, string>>({});
  const [translatingPostId, setTranslatingPostId] = React.useState<number | null>(null);
  const [showTranslation, setShowTranslation] = React.useState<Record<number, boolean>>({});

  const handleTranslatePost = async (p: FeedPost) => {
    if (showTranslation[p.id]) {
      setShowTranslation((prev) => ({ ...prev, [p.id]: false }));
      return;
    }
    if (translatedPosts[p.id]) {
      setShowTranslation((prev) => ({ ...prev, [p.id]: true }));
      return;
    }

    const textToTranslate =
      p.type === "user_post" && p.content
        ? p.content
        : p.word
        ? `${p.word.term} (${p.word.language.name})`
        : p.contentRef || "";

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

  // Daily New Vocabulary state
  const [dailyWordsData, setDailyWordsData] = React.useState<DailyWordsResponse | null>(null);
  const [vocabIndex, setVocabIndex] = React.useState(0);
  const [savingVocab, setSavingVocab] = React.useState(false);

  // Group join toggle state
  const [joinedGroups, setJoinedGroups] = React.useState<Record<string, boolean>>({});

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
    // Load community feed
    api<FeedPost[]>("/community/feed")
      .then(setPosts)
      .catch(console.error)
      .finally(() => setLoading(false));

    // Load current user info
    api<{ id: number; displayName: string }>("/users/me")
      .then(setCurrentUser)
      .catch(console.error);

    // Load Daily Vocabulary words
    api<DailyWordsResponse>("/vocabulary/daily-words")
      .then(setDailyWordsData)
      .catch((err) => console.error("Error loading daily words:", err));
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast(t("community.image_size_error"));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

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

  const handleAddTopicChip = (chipLabel: string) => {
    const prefix = `[${chipLabel}] `;
    if (draft.startsWith(prefix)) return;
    setDraft((prev) => (prev ? `${prefix}${prev}` : prefix));
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
      showToast(err.message || t("community.comment_error"));
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

  const toggleLike = async (post: FeedPost) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, likedByMe: !p.likedByMe, likeCount: p.likeCount + (p.likedByMe ? -1 : 1) }
          : p
      )
    );
    try {
      await api(`/community/posts/${post.id}/like`, {
        method: post.likedByMe ? "DELETE" : "POST",
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Daily Vocabulary Navigation & Save Handlers
  const currentWord = dailyWordsData && dailyWordsData.words.length > 0
    ? dailyWordsData.words[vocabIndex % dailyWordsData.words.length]
    : null;

  const handleNextVocab = () => {
    if (!dailyWordsData || dailyWordsData.words.length === 0) return;
    setVocabIndex((prev) => (prev + 1) % dailyWordsData.words.length);
  };

  const handlePrevVocab = () => {
    if (!dailyWordsData || dailyWordsData.words.length === 0) return;
    setVocabIndex((prev) => (prev - 1 + dailyWordsData.words.length) % dailyWordsData.words.length);
  };

  const handleSaveCurrentVocab = async () => {
    if (!currentWord) return;
    setSavingVocab(true);
    try {
      await api("/vocabulary/save-word", {
        method: "POST",
        body: {
          term: currentWord.term,
          languageId: currentWord.languageId,
          phonetic: currentWord.phonetic,
          partOfSpeech: currentWord.partOfSpeech,
          definition: currentWord.definition,
          example: currentWord.example,
          source: "manual",
        },
      });
      showToast(`✅ ${t("vocabulary.save_success", { term: currentWord.term })}`);
      setDailyWordsData((prev) => {
        if (!prev) return prev;
        const updatedWords = [...prev.words];
        updatedWords[vocabIndex] = { ...updatedWords[vocabIndex], isSaved: true };
        return { ...prev, words: updatedWords };
      });
    } catch (err: any) {
      showToast(err.message || "Không thể lưu từ vựng");
    } finally {
      setSavingVocab(false);
    }
  };

  const toggleGroupJoin = (groupId: string, groupName: string) => {
    setJoinedGroups((prev) => {
      const nextState = !prev[groupId];
      if (nextState) {
        showToast(`✅ Đã tham gia ${groupName}`);
      } else {
        showToast(`Đã rời ${groupName}`);
      }
      return { ...prev, [groupId]: nextState };
    });
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
            {currentUser && (c.userId === currentUser.id || postOwnerId === currentUser.id) && (
              <>
                {!isReply && <span>•</span>}
                <button
                  onClick={() => handleDeleteComment(c.postId, c.id)}
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
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 pb-24">
      {/* Header Section */}
      <div className="mb-6">
        <div className="sd-eyebrow mb-1">
          <Trophy className="w-3.5 h-3.5 text-primary" />
          <span>{t("community.eyebrow") || "CỘNG ĐỒNG STUDUDU"}</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground font-display flex items-center gap-2.5">
          {t("community.title")}
        </h1>
        <p className="text-muted text-sm mt-1">
          {t("community.page_subtitle") || "Chia sẻ hành trình, tìm bạn luyện tập và tham gia sự kiện."}
        </p>
      </div>

      {/* 3 Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_360px] gap-6 xl:gap-8 items-start">
        
        {/* LEFT COLUMN: Sidebar Navigation */}
        <aside className="bg-surface rounded-2xl border border-border shadow-sm p-2 sticky top-20">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("feed")}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left",
                activeTab === "feed"
                  ? "bg-primary/10 text-primary shadow-xs font-bold"
                  : "text-muted hover:text-foreground hover:bg-muted/10"
              )}
            >
              <MessageSquare className="w-4 h-4" />
              <span>{t("community.tab_feed") || "Bảng tin"}</span>
            </button>

            <button
              onClick={() => setActiveTab("challenges")}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left",
                activeTab === "challenges"
                  ? "bg-primary/10 text-primary shadow-xs font-bold"
                  : "text-muted hover:text-foreground hover:bg-muted/10"
              )}
            >
              <Trophy className="w-4 h-4" />
              <span>{t("challenge.title")}</span>
            </button>

            <button
              onClick={() => setActiveTab("groups")}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left",
                activeTab === "groups"
                  ? "bg-primary/10 text-primary shadow-xs font-bold"
                  : "text-muted hover:text-foreground hover:bg-muted/10"
              )}
            >
              <Users className="w-4 h-4" />
              <span>{t("community.tab_groups") || "Nhóm ngôn ngữ"}</span>
            </button>

            <button
              onClick={() => setActiveTab("events")}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left",
                activeTab === "events"
                  ? "bg-primary/10 text-primary shadow-xs font-bold"
                  : "text-muted hover:text-foreground hover:bg-muted/10"
              )}
            >
              <Calendar className="w-4 h-4" />
              <span>{t("community.tab_events") || "Sự kiện"}</span>
            </button>
          </nav>
        </aside>

        {/* MIDDLE COLUMN: Main Content Area */}
        <main className="space-y-6">
          {activeTab === "feed" && (
            <>
              {/* Post Composer Card */}
              <div className="bg-surface rounded-2xl border border-border shadow-sm p-4">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  maxLength={500}
                  placeholder={t("community.post_placeholder")}
                  className="w-full rounded-xl border border-border bg-muted/5 p-3 text-sm focus:outline-none focus:border-primary transition-all resize-none h-22"
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

                {/* Topic Quick Chips */}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleAddTopicChip(t("community.tag_partner") || "Tìm đối tác")}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
                  >
                    <span>🔤</span>
                    <span>{t("community.tag_partner") || "Tìm đối tác"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddTopicChip(t("community.tag_milestone") || "Khoe thành tích")}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-secondary/20 bg-secondary/5 text-secondary hover:bg-secondary/10 transition-colors"
                  >
                    <span>🎉</span>
                    <span>{t("community.tag_milestone") || "Khoe thành tích"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddTopicChip(t("community.tag_question") || "Hỏi luyện tập")}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-warning/30 bg-warning/5 text-warning hover:bg-warning/10 transition-colors"
                  >
                    <span>❓</span>
                    <span>{t("community.tag_question") || "Hỏi luyện tập"}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <label
                      className="cursor-pointer flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted text-muted hover:text-primary transition-colors"
                      title={t("community.add_image")}
                    >
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
                  <Button size="sm" onClick={handlePost} disabled={(!draft.trim() && !image) || posting} className="rounded-full px-5">
                    {posting ? t("common.loading") : t("community.post_button")}
                  </Button>
                </div>
              </div>

              {/* Feed Posts List */}
              {loading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-28 rounded-2xl bg-muted/10 animate-pulse" />
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center bg-surface rounded-2xl border border-border p-6">
                  <div className="text-5xl mb-3">🌱</div>
                  <h3 className="text-lg font-bold text-foreground mb-1">{t("community.empty_feed")}</h3>
                  <p className="text-muted text-xs max-w-xs">{t("community.empty_feed_hint")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((p) => (
                    <div key={p.id} className="bg-surface rounded-2xl border border-border shadow-sm p-4 transition-all">
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
                              {postText(p, t)}
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
                                      {t("community.edit")}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setDeletingPostId(p.id);
                                        setActiveMenuPostId(null);
                                      }}
                                      className="w-full text-left px-3 py-2 text-xs font-semibold text-error hover:bg-error/5 flex items-center gap-1.5 transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      {t("community.delete_post")}
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {p.type === "user_post" && p.content && (
                            <p className="text-sm text-foreground leading-relaxed mt-1.5 whitespace-pre-wrap break-words">
                              {p.content}
                            </p>
                          )}

                          {/* FB/X Style: See Translation Link right below post content */}
                          <button
                            onClick={() => handleTranslatePost(p)}
                            disabled={translatingPostId === p.id}
                            className="mt-1 text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 transition-colors"
                          >
                            <Languages className="w-3.5 h-3.5" />
                            <span>
                              {translatingPostId === p.id
                                ? "..."
                                : showTranslation[p.id]
                                ? t("community.hide_translation") || "Ẩn bản dịch"
                                : t("community.see_translation") || "Xem bản dịch"}
                            </span>
                          </button>

                          {/* Inline Post Translation Box */}
                          {showTranslation[p.id] && translatedPosts[p.id] && (
                            <div className="mt-2 p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs leading-relaxed text-foreground animate-fade-in">
                              <div className="flex items-center justify-between text-[11px] font-bold text-primary mb-1">
                                <span className="flex items-center gap-1.5">
                                  <Languages className="w-3.5 h-3.5" />
                                  {t("community.translation_title") || "Bản dịch tự động"}
                                </span>
                                <button
                                  onClick={() => setShowTranslation((prev) => ({ ...prev, [p.id]: false }))}
                                  className="text-muted hover:text-foreground text-[10px]"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <p className="whitespace-pre-wrap mt-0.5">{translatedPosts[p.id]}</p>
                            </div>
                          )}

                          {p.imageUrl && (
                            <div className="mt-3 rounded-xl overflow-hidden border border-border/50 w-full max-w-2xl bg-muted/5 inline-block">
                              <img
                                src={p.imageUrl}
                                alt="Đính kèm"
                                className="w-full h-auto object-contain max-h-[500px]"
                              />
                            </div>
                          )}

                          <div className="flex items-center gap-3 mt-3 flex-wrap">
                            <span className="text-xs text-muted">{timeAgo(p.createdAt, t)}</span>
                            <button
                              onClick={() => toggleLike(p)}
                              className={cn(
                                "flex items-center gap-1 text-xs font-semibold rounded-full px-2.5 py-1 border transition-all",
                                p.likedByMe
                                  ? "border-error/40 bg-error/5 text-error"
                                  : "border-border text-muted hover:border-error/40 hover:text-error"
                              )}
                            >
                              <Heart className={cn("w-3.5 h-3.5", p.likedByMe && "fill-error")} />
                              {p.likeCount > 0 ? p.likeCount : t("community.like")}
                            </button>
                            <button
                              onClick={() => handleToggleComments(p.id)}
                              className={cn(
                                "flex items-center gap-1 text-xs font-semibold rounded-full px-2.5 py-1 border transition-all",
                                expandedPostId === p.id
                                  ? "border-primary/40 bg-primary/5 text-primary"
                                  : "border-border text-muted hover:border-primary/40 hover:text-primary"
                              )}
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              {p.commentCount > 0 ? p.commentCount : t("community.comment_placeholder").replace("...", "")}
                            </button>
                            <button
                              onClick={() => setReportTarget(p)}
                              className="flex items-center gap-1 text-xs font-semibold rounded-full px-2.5 py-1 border border-border text-muted hover:border-warning hover:text-warning transition-all"
                              title={t("community.report")}
                            >
                              <Flag className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Comments section */}
                          {expandedPostId === p.id && (
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
                                        {renderCommentItem(parentComment, false, p.user.id)}
                                        {comments
                                          .filter((reply) => reply.parentId === parentComment.id)
                                          .map((replyComment) => renderCommentItem(replyComment, true, p.user.id))}
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
                                      handleAddComment(p.id);
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
                                  onClick={() => handleAddComment(p.id)}
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
                  ))}
                </div>
              )}
            </>
          )}

          {/* CHALLENGES TAB — thi đấu trả lời bộ đề, BXH chỉ trong phạm vi thử thách */}
          {activeTab === "challenges" && (
            <div className="space-y-4">
              <div className="bg-surface rounded-2xl border border-border shadow-sm p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground font-display">
                      {t("challenge.title")}
                    </h2>
                    <p className="text-xs text-muted">{t("challenge.subtitle")}</p>
                  </div>
                </div>
              </div>
              <ChallengeBoard />
            </div>
          )}

          {/* GROUPS TAB VIEW (PREVIEW) */}
          {activeTab === "groups" && (
            <div className="space-y-4">
              <div className="bg-surface rounded-2xl border border-border shadow-sm p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground font-display">{t("community.groups_title") || "Nhóm ngôn ngữ"}</h2>
                    <p className="text-xs text-muted">
                      {t("community.groups_coming_soon")}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  {getSuggestedGroups(t).map((g) => {
                    const isJoined = !!joinedGroups[g.id];
                    return (
                      <div key={g.id} className="bg-muted/10 rounded-2xl border border-border/70 p-4 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className={cn("text-xs font-bold px-2.5 py-1 rounded-lg", g.bgColor, g.textColor)}>
                              [{g.langCode}] {g.name}
                            </span>
                            <span className="text-[11px] text-muted font-medium">
                              {t("community.members_count", { count: g.members })}
                            </span>
                          </div>
                          <p className="text-xs text-foreground/80 leading-relaxed mb-4">{g.description}</p>
                        </div>
                        <Button
                          size="sm"
                          variant={isJoined ? "outline" : "default"}
                          onClick={() => toggleGroupJoin(g.id, g.name)}
                          className={cn("w-full rounded-xl text-xs font-semibold gap-1.5", isJoined && "bg-success/10 text-success border-success/30 hover:bg-success/20")}
                        >
                          {isJoined ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              {t("community.joined_group")}
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-3.5 h-3.5" />
                              {t("community.join_group")}
                            </>
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* EVENTS TAB VIEW (PREVIEW) */}
          {activeTab === "events" && (
            <div className="space-y-4">
              <div className="bg-surface rounded-2xl border border-border shadow-sm p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground font-display">{t("community.events_title") || "Sự kiện & Bài thi thử sức"}</h2>
                    <p className="text-xs text-muted">
                      {t("community.events_coming_soon")}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mt-6">
                  <div className="bg-muted/10 rounded-2xl border border-border/70 p-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">{t("community.status_upcoming")}</span>
                        <span className="text-xs text-muted">{t("community.event1_time")}</span>
                      </div>
                      <h4 className="text-sm font-bold text-foreground">{t("community.event1_title")}</h4>
                      <p className="text-xs text-muted mt-0.5">{t("community.event1_desc")}</p>
                    </div>
                    <Button size="sm" className="rounded-xl text-xs flex-shrink-0" onClick={() => showToast(t("community.event_toast_notice"))}>
                      {t("community.event1_btn")}
                    </Button>
                  </div>

                  <div className="bg-muted/10 rounded-2xl border border-border/70 p-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-pink-100 text-pink-600">JLPT N3</span>
                        <span className="text-xs text-muted">{t("community.event2_time")}</span>
                      </div>
                      <h4 className="text-sm font-bold text-foreground">{t("community.event2_title")}</h4>
                      <p className="text-xs text-muted mt-0.5">{t("community.event2_desc")}</p>
                    </div>
                    <Button size="sm" variant="outline" className="rounded-xl text-xs flex-shrink-0" onClick={() => showToast(t("community.event_toast_notice"))}>
                      {t("community.event2_btn")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* RIGHT COLUMN: Right Rail Widgets */}
        <aside className="space-y-6 sticky top-20">
          
          {/* WIDGET 1: TỪ VỰNG MỚI HÔM NAY (Daily New Vocabulary) */}
          <div className="bg-surface rounded-2xl border border-border shadow-sm p-4 overflow-hidden relative">
            <div className="flex items-center justify-between mb-3 border-b border-border/50 pb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <BookOpen className="w-4 h-4 text-primary" />
                <span className="tracking-wide uppercase text-[11px]">
                  {t("community.daily_vocab_title")}
                </span>
              </div>
              {dailyWordsData && dailyWordsData.words.length > 0 && (
                <span className="text-xs font-semibold text-muted bg-muted/20 px-2 py-0.5 rounded-full">
                  {vocabIndex + 1} / {dailyWordsData.words.length}
                </span>
              )}
            </div>

            {currentWord ? (
              <div className="bg-gradient-to-br from-primary/5 via-pink-500/5 to-warning/5 rounded-xl p-4 border border-primary/10">
                {/* Word Term */}
                <h3 className="text-2xl font-bold font-display text-foreground tracking-tight">
                  {currentWord.term}
                </h3>

                {/* Part of speech & IPA Phonetic */}
                <div className="flex items-center gap-2 mt-1 text-xs text-secondary font-semibold">
                  <span>{currentWord.partOfSpeech}</span>
                  {currentWord.phonetic && <span>· {currentWord.phonetic}</span>}
                </div>

                {/* Definition / Meaning */}
                <p className="text-sm font-semibold text-foreground/90 mt-3 leading-snug">
                  {currentWord.definition}
                </p>

                {/* Example sentence */}
                {currentWord.example && (
                  <p className="text-xs italic text-muted mt-2 leading-relaxed bg-surface/60 p-2.5 rounded-lg border border-border/50">
                    {currentWord.example}
                  </p>
                )}

                {/* Action controls */}
                <div className="flex items-center justify-between gap-2 mt-4 pt-2">
                  <button
                    onClick={handlePrevVocab}
                    className="p-2 rounded-xl border border-border bg-surface text-muted hover:text-foreground hover:bg-muted/10 transition-colors"
                    title={t("community.prev_word") || "Từ trước"}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <Button
                    size="sm"
                    variant={currentWord.isSaved ? "outline" : "default"}
                    onClick={handleSaveCurrentVocab}
                    disabled={savingVocab || currentWord.isSaved}
                    className={cn(
                      "flex-1 rounded-xl text-xs font-semibold gap-1.5 shadow-xs",
                      currentWord.isSaved && "bg-success/10 text-success border-success/30 hover:bg-success/20"
                    )}
                  >
                    {currentWord.isSaved ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        {t("community.saved_word")}
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-3.5 h-3.5" />
                        {t("community.save_word")}
                      </>
                    )}
                  </Button>

                  <Button
                    size="sm"
                    onClick={handleNextVocab}
                    className="sd-btn-gradient rounded-xl text-xs font-semibold gap-1"
                  >
                    <span>{t("community.next_word")}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-muted">
                {t("common.loading")}
              </div>
            )}
          </div>

          {/* WIDGET 2: NHÓM NGÔN NGỮ GỢI Ý (Suggested Language Groups) */}
          <div className="bg-surface rounded-2xl border border-border shadow-sm p-4">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wide mb-3 flex items-center justify-between">
              <span>{t("community.suggested_groups")}</span>
            </h3>

            <div className="space-y-3">
              {getSuggestedGroups(t).map((g) => {
                const isJoined = !!joinedGroups[g.id];
                return (
                  <div key={g.id} className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-muted/10 transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0", g.bgColor, g.textColor)}>
                        {g.langCode}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-foreground truncate">{g.name}</h4>
                        <p className="text-[10px] text-muted truncate">
                          {t("community.members_count", { count: g.members })}
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant={isJoined ? "outline" : "secondary"}
                      onClick={() => toggleGroupJoin(g.id, g.name)}
                      className={cn(
                        "rounded-xl text-[11px] h-7 px-3 flex-shrink-0 font-semibold",
                        isJoined && "bg-success/10 text-success border-success/30 hover:bg-success/20"
                      )}
                    >
                      {isJoined ? t("community.joined_group") : t("community.join_group")}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

        </aside>

      </div>

      {/* Report dialog */}
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

      {/* Confirm Delete Post Modal */}
      {deletingPostId && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl max-w-sm w-full p-6 shadow-xl animate-scale-in">
            <h3 className="text-base font-bold text-foreground mb-2">{t("community.delete_post")}</h3>
            <p className="text-xs text-muted mb-6">{t("community.confirm_delete")}</p>
            <div className="flex gap-2 justify-end">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDeletingPostId(null)}
                disabled={deleting}
                className="rounded-full text-xs"
              >
                {t("community.confirm_no")}
              </Button>
              <Button
                size="sm"
                onClick={() => handleDeletePost(deletingPostId)}
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
      {editingPost && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl max-w-md w-full p-6 shadow-xl animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-foreground">{t("community.edit")}</h3>
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
              placeholder={t("community.post_placeholder")}
              rows={4}
              disabled={updatingPost}
              className="w-full rounded-2xl border border-border bg-muted/5 p-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none transition-all"
            />

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
                  setEditingPost(null);
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

      {toast}
    </div>
  );
}
