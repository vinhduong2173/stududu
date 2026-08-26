"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";
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
  Plus,
  Eye,
  Globe,
  Lock,
  Volume2,
  Search,
  Shield,
  FileText,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { ReportDialog, useToast } from "@/components/features/TrustDialogs";
import {
  CreateGroupModal,
  GroupItem,
} from "@/components/features/GroupModals";
import { GroupListItem } from "@/components/features/GroupListItem";
import { ChallengeBoard } from "@/components/features/ChallengeBoard";
import { EventTestCard, TestSetItem } from "@/components/features/EventTestCard";
import { DailyVocabCard } from "@/components/features/community/DailyVocabCard";
import { LearnerSet } from "@/lib/questionSets";
import { getLanguageInfo } from "@/lib/languages";
import { cn } from "@/lib/utils";
import { useTranslations, useLocale } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";

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
  audioUrl?: string | null;
  isSaved: boolean;
  languageId?: number;
};

type DailyWordsResponse = {
  language: { code: string; name: string };
  nativeLanguage?: string;
  learningLanguages?: { code: string; name: string }[];
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
  if (diffMin < 60) return t("community.time_minutes_ago", { count: diffMin, m: diffMin });
  const h = Math.floor(diffMin / 60);
  if (h < 24) return t("community.time_hours_ago", { count: h, h: h });
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

export default function CommunityPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { show: showToast, toast } = useToast();

  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  // Navigation tab state
  const [activeTab, setActiveTab] = React.useState<
    "feed" | "challenges" | "groups" | "events"
  >("feed");

  React.useEffect(() => {
    if (tabParam === "events" || tabParam === "feed" || tabParam === "groups") {
      setActiveTab(tabParam as any);
    }
  }, [tabParam]);

  // Groups state
  const [realGroups, setRealGroups] = React.useState<GroupItem[]>([]);
  const [groupSearchQuery, setGroupSearchQuery] = React.useState("");
  const [loadingGroups, setLoadingGroups] = React.useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = React.useState(false);

  const filteredGroups = React.useMemo(() => {
    if (!groupSearchQuery.trim()) return realGroups;
    const q = groupSearchQuery.trim().toLowerCase();
    return realGroups.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        (g.description && g.description.toLowerCase().includes(q)) ||
        (g.language?.name && g.language.name.toLowerCase().includes(q)) ||
        (g.creator?.displayName && g.creator.displayName.toLowerCase().includes(q))
    );
  }, [realGroups, groupSearchQuery]);

  // Default sample test sets matching mockup design
  const DEFAULT_EVENT_TESTS: TestSetItem[] = [
    {
      id: 1,
      title: "Bão tố Từ vựng: Thời tiết",
      languageCode: "en",
      languageName: "English",
      countryCode: "GB",
      framework: "CEFR",
      level: "B1",
      questionCount: 8,
      timePerQuestion: "15s/câu",
      takerCount: 342,
      status: "not_started",
      expiryText: "Còn 2 ngày",
    },
    {
      id: 2,
      title: "Từ điển Văn phòng",
      languageCode: "en",
      languageName: "English",
      countryCode: "GB",
      framework: "CEFR",
      level: "B2",
      questionCount: 15,
      timePerQuestion: "12s/câu",
      takerCount: 518,
      status: "completed",
      score: 1320,
      correctCount: 15,
      totalCount: 15,
      expiryText: "Đã kết thúc",
    },
    {
      id: 3,
      title: "Hiragana Cơ bản",
      languageCode: "ja",
      languageName: "Tiếng Nhật",
      countryCode: "JP",
      framework: "CEFR",
      level: "A1",
      questionCount: 10,
      timePerQuestion: "20s/câu",
      takerCount: 187,
      status: "in_progress",
      currentQuestion: 4,
      totalCount: 10,
      expiryText: "Còn 4 ngày",
    },
    {
      id: 4,
      title: "Bão tố Từ vựng: Ẩm thực & Thức ăn",
      languageCode: "en",
      languageName: "English",
      countryCode: "GB",
      framework: "CEFR",
      level: "B1",
      questionCount: 20,
      timePerQuestion: "15s/câu",
      takerCount: 420,
      status: "not_started",
      expiryText: "Còn 5 ngày",
    },
  ];

  // Test sets state for Events tab
  const [eventTests, setEventTests] = React.useState<TestSetItem[]>([]);

  const fetchEventTests = React.useCallback(async () => {
    // 1. Read custom quiz sets created by Admin in /admin/quizzes/create or edit
    const savedLocalStr = typeof window !== "undefined" ? localStorage.getItem("stududu_custom_quiz_sets") : null;
    let localTestItems: TestSetItem[] = [];
    if (savedLocalStr) {
      try {
        const parsed = JSON.parse(savedLocalStr);
        if (Array.isArray(parsed)) {
          const now = new Date();
          localTestItems = parsed.map((item: any, idx: number) => {
            let isExpired = false;
            let isNotStarted = false;
            let diffDays: number | null = null;
            let expiryText = "Không giới hạn";

            if (item.startsAt && new Date(item.startsAt) > now) {
              isNotStarted = true;
              expiryText = "Sắp mở";
            } else if (item.endsAt) {
              const endsDate = new Date(item.endsAt);
              if (endsDate < now) {
                isExpired = true;
                expiryText = "Đã kết thúc";
              } else {
                diffDays = Math.ceil((endsDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                expiryText = diffDays > 0 ? `Còn ${diffDays} ngày` : "Hết hạn hôm nay";
              }
            }

            const timeSec = item.timePerQuestionSec || 15;

            return {
              id: isNaN(Number(item.id)) ? 9000 + idx : Number(item.id),
              title: item.title,
              languageCode: item.language?.toLowerCase().includes("nhật") ? "ja" : "en",
              languageName: item.language || "English",
              countryCode: item.language?.toLowerCase().includes("nhật") ? "JP" : "GB",
              framework: "CEFR",
              level: item.level || "A1",
              questionCount: item.wordCount || 20,
              timePerQuestionSec: timeSec,
              timePerQuestion: `${timeSec}s/câu`,
              takerCount: item.takerCount ?? 0,
              status: "not_started" as const,
              diffDays,
              expiryText,
              isExpired,
              isNotStarted,
            };
          });
        }
      } catch {
        // ignore
      }
    }

    // 2. Fetch published question sets from Backend API
    try {
      const sets = await api<LearnerSet[]>("/question-sets");
      const apiMapped: TestSetItem[] = Array.isArray(sets)
        ? sets.map((s: any) => {
            const hasAttempt = !!s.lastAttempt;
            const isFinished = hasAttempt && !!s.lastAttempt?.finishedAt;
            let status: "not_started" | "completed" | "in_progress" = "not_started";
            if (isFinished) status = "completed";
            else if (hasAttempt) status = "in_progress";
            const totalCount = s.lastAttempt?.totalCount || s.questionCount || 20;
            const correctCount = s.lastAttempt?.correctCount ?? 0;
            const calculatedScore = totalCount > 0 ? Math.round((correctCount / totalCount) * 1000) : 0;
            const attemptScore = s.lastAttempt?.score ?? s.score ?? calculatedScore;

            return {
              id: s.id,
              title: s.title,
              languageCode: s.language?.code || "en",
              languageName: s.language?.name || "English",
              framework: s.framework,
              level: s.level,
              questionCount: s.questionCount || s._count?.questions || 20,
              timePerQuestionSec: s.timePerQuestionSec || 15,
              timePerQuestion: s.timePerQuestion || `${s.timePerQuestionSec || 15}s/câu`,
              takerCount: s.takerCount ?? 0,
              status,
              score: isFinished ? attemptScore : undefined,
              correctCount: isFinished ? correctCount : undefined,
              totalCount,
              currentQuestion: hasAttempt && !isFinished ? 1 : undefined,
              diffDays: s.diffDays ?? null,
              expiryText: s.expiryText,
              isExpired: !!s.isExpired,
              isLimitReached: !!s.isLimitReached,
              isNotStarted: !!s.isNotStarted,
            };
          })
        : [];

      const combined = [...apiMapped];
      for (const localItem of localTestItems) {
        const matchIndex = combined.findIndex(
          (c) => c.id === localItem.id || c.title.toLowerCase() === localItem.title.toLowerCase()
        );
        if (matchIndex >= 0) {
          combined[matchIndex] = { ...combined[matchIndex], ...localItem };
        } else {
          combined.push(localItem);
        }
      }
      setEventTests(combined);
    } catch {
      setEventTests(localTestItems);
    }
  }, []);

  React.useEffect(() => {
    void fetchEventTests();
  }, [fetchEventTests, activeTab]);

  const fetchRealGroups = React.useCallback(async () => {
    setLoadingGroups(true);
    try {
      const res = await api<{ data: GroupItem[] }>("/groups");
      setRealGroups(res.data || []);
    } catch (err) {
      console.error("Error fetching groups:", err);
    } finally {
      setLoadingGroups(false);
    }
  }, []);

  React.useEffect(() => {
    if (activeTab === "groups") {
      fetchRealGroups();
    }
  }, [activeTab, fetchRealGroups]);

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
        body: { text: textToTranslate, target: locale || "en", source: "auto" },
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
  const [dailyTargetLang, setDailyTargetLang] = React.useState<string | null>(null);

  const fetchDailyWords = React.useCallback(
    (target?: string) => {
      const query = new URLSearchParams();
      if (target) query.set("target", target);

      api<DailyWordsResponse>(`/vocabulary/daily-words${query.toString() ? `?${query.toString()}` : ""}`)
        .then((data) => {
          setDailyWordsData(data);
          setVocabIndex(0);
          if (data?.language?.code && !target) {
            setDailyTargetLang(data.language.code);
          }
        })
        .catch((err) => console.error("Error loading daily words:", err));
    },
    []
  );

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
  const [currentUser, setCurrentUser] = React.useState<{ id: number; displayName: string; avatarUrl?: string | null } | null>(null);
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
    api<{ id: number; displayName: string; avatarUrl?: string | null }>("/users/me")
      .then(setCurrentUser)
      .catch(console.error);

    // Load Daily Vocabulary words
    fetchDailyWords();
  }, [fetchDailyWords]);

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
      showToast("Đã đăng bài chia sẻ");
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
      showToast("Đã xóa bài viết");
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
      showToast("Đã cập nhật bài viết");
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
      showToast("Đã xóa bình luận");
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

  // Daily Vocabulary Navigation, Audio & Save Handlers
  const currentWord = dailyWordsData && dailyWordsData.words.length > 0
    ? dailyWordsData.words[vocabIndex % dailyWordsData.words.length]
    : null;

  const handlePlayAudio = (word: DailyWord, langCode = "en") => {
    if (word.audioUrl) {
      const audio = new Audio(word.audioUrl);
      audio.play().catch(() => speakFallback(word.term, langCode));
    } else {
      speakFallback(word.term, langCode);
    }
  };

  const speakFallback = (text: string, langCode: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    window.speechSynthesis.speak(utterance);
  };

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
      showToast(t("vocabulary.save_success", { term: currentWord.term }));
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
        showToast(`Đã tham gia ${groupName}`);
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
    <div className="w-full flex min-h-[calc(100vh-4rem)]">
      {/* LEFT COLUMN: Facebook-style full-height sticky taskbar */}
      <aside className="w-64 xl:w-72 2xl:w-80 shrink-0 h-[calc(100vh-4rem)] sticky top-0 border-r border-border/80 bg-surface/90 backdrop-blur-sm p-3.5 flex flex-col justify-between overflow-y-auto z-10">
        <div className="space-y-1">
          {/* User Profile Shortcut */}
          {currentUser && (
            <Link
              href="/profile/me"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-foreground hover:bg-surface-2 transition-colors mb-2 group"
            >
              <Avatar
                src={currentUser.avatarUrl ?? undefined}
                fallback={currentUser.displayName?.charAt(0) ?? "?"}
                size="sm"
                className="h-8 w-8 text-xs shrink-0"
              />
              <span className="truncate group-hover:text-primary transition-colors">
                {currentUser.displayName}
              </span>
            </Link>
          )}

          <button
            onClick={() => setActiveTab("feed")}
            className={cn(
              "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer",
              activeTab === "feed"
                ? "bg-primary text-white shadow-xs"
                : "text-muted hover:text-foreground hover:bg-surface-2"
            )}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span>{t("community.tab_feed") || "Bảng tin"}</span>
          </button>

          <button
            onClick={() => setActiveTab("groups")}
            className={cn(
              "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer",
              activeTab === "groups"
                ? "bg-primary text-white shadow-xs"
                : "text-muted hover:text-foreground hover:bg-surface-2"
            )}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>{t("community.tab_groups") || "Nhóm ngôn ngữ"}</span>
          </button>

          <button
            onClick={() => setActiveTab("events")}
            className={cn(
              "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer",
              activeTab === "events"
                ? "bg-primary text-white shadow-xs"
                : "text-muted hover:text-foreground hover:bg-surface-2"
            )}
          >
            <Calendar className="w-4 h-4 shrink-0" />
            <span>{t("community.tab_events") || "Sự kiện"}</span>
          </button>

          <div className="border-t border-border/60 my-3 pt-3 space-y-1">
            <Link
              href="/about"
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-muted hover:text-foreground hover:bg-surface-2 transition-colors text-left"
            >
              <Globe className="w-4 h-4 shrink-0 text-teal-600 dark:text-teal-400" />
              <span>{t("about.title")}</span>
            </Link>

            <Link
              href="/guidelines"
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-muted hover:text-foreground hover:bg-surface-2 transition-colors text-left"
            >
              <Shield className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>{t("guidelines.title")}</span>
            </Link>

            <Link
              href="/terms"
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-muted hover:text-foreground hover:bg-surface-2 transition-colors text-left"
            >
              <FileText className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
              <span>{t("terms.title")}</span>
            </Link>

            <Link
              href="/privacy"
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-muted hover:text-foreground hover:bg-surface-2 transition-colors text-left"
            >
              <Lock className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{t("privacy.title")}</span>
            </Link>
          </div>
        </div>

        {/* Minimal Copyright at Bottom */}
        <div className="px-3 pt-4 text-[11px] text-muted/50 border-t border-border/40">
          <p>Stududu © 2026</p>
        </div>
      </aside>

      {/* CENTER & RIGHT CONTENT AREA */}
      <div className="flex-1 min-w-0 flex justify-center py-6 px-4 sm:px-6 lg:px-8 pb-16">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px] gap-6 xl:gap-8 items-start">
          
          {/* MIDDLE COLUMN: Main Content Area */}
          <main className="space-y-5 min-w-0">
          {/* Header Section inside middle column */}
          <div className="px-1 py-1 mb-1">
            <h1 className="text-xl md:text-2xl font-bold text-foreground font-display flex items-center gap-2 tracking-tight">
              {t("community.title")}
            </h1>
            <p className="text-muted text-xs md:text-sm mt-0.5">
              {t("community.page_subtitle") || "Chia sẻ hành trình, tìm bạn luyện tập và tham gia sự kiện."}
            </p>
          </div>

          {activeTab === "feed" && (
            <>
              {/* Post Composer Card */}
              <div className="bg-surface rounded-2xl border border-border/80 shadow-card p-5">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  maxLength={500}
                  placeholder={t("community.post_placeholder")}
                  className="w-full rounded-xl border border-border/80 bg-surface-2/60 p-3.5 text-sm text-foreground placeholder:text-muted/70 focus:outline-none focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none h-24 shadow-xs"
                />

                {image && (
                  <div className="relative mt-3 w-32 h-32 rounded-xl overflow-hidden border border-border/80 bg-muted/5 group shadow-xs">
                    <img src={image} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setImage(null)}
                      className="absolute top-1 right-1 p-1 bg-foreground/80 hover:bg-foreground text-surface rounded-full transition-colors shadow-sm cursor-pointer"
                      type="button"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/60">
                  <div className="flex items-center gap-2">
                    <label
                      className="cursor-pointer flex items-center justify-center w-8 h-8 rounded-full hover:bg-surface-2 text-muted hover:text-primary transition-colors"
                      title={t("community.add_image")}
                    >
                      <ImageIcon className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        disabled={posting}
                      />
                    </label>
                    <span className="text-xs text-muted/80">{draft.length}/500</span>
                  </div>
                  <Button size="sm" onClick={handlePost} disabled={(!draft.trim() && !image) || posting} className="rounded-full px-5 font-bold shadow-xs">
                    {posting ? t("common.loading") : t("community.post_button")}
                  </Button>
                </div>
              </div>

              {/* Feed Posts List */}
              {loading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-28 rounded-2xl bg-surface border border-border/80 animate-pulse" />
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <div className="bg-surface rounded-2xl border border-border/80 shadow-card p-12 text-center">
                  <MessageSquare className="w-12 h-12 text-muted mx-auto mb-3 opacity-60" />
                  <p className="text-foreground font-semibold text-sm">{t("community.empty_feed")}</p>
                  <p className="text-xs text-muted mt-1">{t("community.empty_feed_hint")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((p) => (
                    <div
                      key={p.id}
                      className="bg-surface rounded-2xl border border-border/80 shadow-card p-5 transition-all hover:border-primary/20"
                    >
                      <div className="flex items-start gap-3">
                        <Link href={`/profile/${p.user.id}`} className="shrink-0">
                          <Avatar
                            src={p.user.avatarUrl ?? undefined}
                            fallback={p.user.displayName.charAt(0)}
                            size="md"
                          />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Link
                                href={`/profile/${p.user.id}`}
                                className="font-bold text-sm text-foreground hover:underline"
                              >
                                {p.user.displayName}
                              </Link>
                              <span className="text-xs text-muted">{postText(p, t)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-muted">{timeAgo(p.createdAt, t)}</span>
                              {currentUser && currentUser.id === p.user.id && (
                                <div className="relative">
                                  <button
                                    onClick={() => toggleMenu(p.id)}
                                    className="p-1 rounded-full text-muted hover:text-foreground hover:bg-muted/10 transition-colors"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </button>
                                  {activeMenuPostId === p.id && (
                                    <>
                                      <div
                                        className="fixed inset-0 z-20"
                                        onClick={() => setActiveMenuPostId(null)}
                                      />
                                      <div className="absolute right-0 top-6 z-30 bg-surface border border-border rounded-xl shadow-lg py-1 w-32 animate-fade-in">
                                        <button
                                          onClick={() => {
                                            setActiveMenuPostId(null);
                                            setEditingPost(p);
                                            setEditDraft(p.content || "");
                                            setEditImage(p.imageUrl || null);
                                          }}
                                          className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-muted/10 flex items-center gap-2"
                                        >
                                          <Edit className="w-3.5 h-3.5" />
                                          {t("community.edit")}
                                        </button>
                                        <button
                                          onClick={() => {
                                            setActiveMenuPostId(null);
                                            setDeletingPostId(p.id);
                                          }}
                                          className="w-full text-left px-3 py-1.5 text-xs text-error hover:bg-error/5 flex items-center gap-2 font-medium"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                          {t("community.delete")}
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Post Text Content */}
                          {p.type === "user_post" && p.content && (
                            <div className="mt-2.5">
                              <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
                                {p.content}
                              </p>
                              {showTranslation[p.id] && translatedPosts[p.id] && (
                                <div className="mt-2 p-3 bg-muted/10 rounded-xl border border-border/60 text-xs text-foreground animate-fade-in">
                                  <div className="flex items-center gap-1.5 text-[10px] text-muted font-bold mb-1 uppercase tracking-wider">
                                    <Languages className="w-3 h-3 text-primary" />
                                    <span>{t("community.translation_title")}</span>
                                  </div>
                                  <p className="whitespace-pre-wrap">{translatedPosts[p.id]}</p>
                                </div>
                              )}
                              <button
                                onClick={() => handleTranslatePost(p)}
                                disabled={translatingPostId === p.id}
                                className="inline-flex items-center gap-1 mt-1 text-[11px] text-primary hover:underline font-semibold"
                              >
                                <Languages className="w-3 h-3" />
                                <span>
                                  {translatingPostId === p.id
                                    ? t("common.loading")
                                    : showTranslation[p.id]
                                    ? t("community.hide_translation")
                                    : t("community.see_translation")}
                                </span>
                              </button>
                            </div>
                          )}

                          {/* Post Image */}
                          {p.imageUrl && (
                            <div className="mt-3 rounded-xl overflow-hidden border border-border/60 bg-muted/5 max-h-96">
                              <img
                                src={p.imageUrl}
                                alt="Post attachment"
                                className="w-full h-auto object-cover max-h-96 hover:scale-[1.01] transition-transform"
                              />
                            </div>
                          )}

                          {/* Word preview card */}
                          {p.type === "word_public" && p.word && (
                            <div className="mt-3 p-3.5 bg-surface-2 rounded-xl border border-border/80 flex items-center justify-between">
                              <div>
                                <p className="font-bold text-sm text-foreground">{p.word.term}</p>
                                <p className="text-xs text-muted">{p.word.language.name}</p>
                              </div>
                              <Link
                                href={`/vocabulary?search=${encodeURIComponent(p.word.term)}`}
                                className="text-xs text-primary font-bold hover:underline"
                              >
                                Xem từ vựng →
                              </Link>
                            </div>
                          )}

                          {/* Post Actions: Like, Comment, Report */}
                          <div className="flex items-center gap-4 mt-3 pt-2 text-xs text-muted">
                            <button
                              onClick={() => toggleLike(p)}
                              className={cn(
                                "flex items-center gap-1.5 hover:text-error transition-colors",
                                p.likedByMe && "text-error font-bold"
                              )}
                            >
                              <Heart className={cn("w-4 h-4", p.likedByMe && "fill-error")} />
                              <span>{p.likeCount > 0 ? p.likeCount : t("community.like")}</span>
                            </button>

                            <button
                              onClick={() => handleToggleComments(p.id)}
                              className={cn(
                                "flex items-center gap-1.5 hover:text-foreground transition-colors",
                                expandedPostId === p.id && "text-primary font-bold"
                              )}
                            >
                              <MessageSquare className="w-4 h-4" />
                              <span>
                                {p.commentCount > 0
                                  ? `${p.commentCount} ${t("community.comment_placeholder").toLowerCase().replace("...", "")}`
                                  : t("community.comment_placeholder").toLowerCase().replace("...", "")}
                              </span>
                            </button>

                            <button
                              onClick={() => setReportTarget(p)}
                              className="flex items-center gap-1.5 hover:text-error transition-colors ml-auto text-muted/60 hover:text-muted"
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

          {/* GROUPS TAB VIEW */}
          {activeTab === "groups" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground font-display">
                      {t("groups.groups_title")}
                    </h2>
                    <p className="text-xs text-muted">
                      {t("groups.groups_subtitle")}
                    </p>
                  </div>
                </div>

                {/* Search Bar & Create Button */}
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                    <input
                      type="text"
                      placeholder={t("groups.search_placeholder")}
                      value={groupSearchQuery}
                      onChange={(e) => setGroupSearchQuery(e.target.value)}
                      className="w-full h-10 rounded-full border border-border bg-surface pl-9.5 pr-3 text-xs sm:text-sm font-medium text-foreground placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-2xs"
                    />
                  </div>

                  <Button
                    onClick={() => setShowCreateGroupModal(true)}
                    className="sd-btn-gradient rounded-full text-xs sm:text-sm font-bold gap-1.5 shadow-xs shrink-0 h-10 px-4 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t("groups.create_group")}</span>
                  </Button>
                </div>
              </div>

              {loadingGroups ? (
                <div className="py-12 text-center text-xs text-muted font-medium">
                  {t("groups.loading_groups")}
                </div>
              ) : filteredGroups.length === 0 ? (
                realGroups.length === 0 ? (
                  <div className="py-12 text-center space-y-3 bg-muted/5 rounded-2xl border border-dashed border-border/70 p-6">
                    <Users className="w-10 h-10 text-muted mx-auto" />
                    <p className="text-xs font-semibold text-muted">{t("groups.empty_groups_title")}</p>
                    <Button
                      size="sm"
                      onClick={() => setShowCreateGroupModal(true)}
                      className="sd-btn-gradient rounded-full text-xs font-bold gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t("groups.create_first_group")}</span>
                    </Button>
                  </div>
                ) : (
                  <div className="py-10 text-center space-y-2 bg-surface rounded-2xl border border-dashed border-border/70 p-6">
                    <Search className="w-8 h-8 text-muted mx-auto opacity-60" />
                    <p className="text-xs font-semibold text-muted">
                      {t("groups.empty_search_title", { query: groupSearchQuery })}
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setGroupSearchQuery("")}
                      className="text-xs text-primary font-bold cursor-pointer"
                    >
                      {t("groups.clear_search")}
                    </Button>
                  </div>
                )
              ) : (
                <div className="space-y-2.5 sm:space-y-3">
                  {filteredGroups.map((g) => (
                    <GroupListItem
                      key={g.id}
                      group={g}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* EVENTS TAB VIEW — Danh sách bài test từ Admin */}
          {activeTab === "events" && (
            <div className="space-y-4">
              <div className="bg-surface rounded-2xl border border-border shadow-sm p-6">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground font-display">
                      {t("community.events_title") || "Events & Exam Competitions"}
                    </h2>
                    <p className="text-xs text-muted">
                      {t("community.events_coming_soon") ||
                        "Events is where Admins will host exams and competitions for users to practice together."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Grid / List of test set cards matching mockup */}
              <div className="space-y-4">
                {eventTests.map((item) => (
                  <EventTestCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}
        </main>

          {/* RIGHT COLUMN: Right Rail Widgets */}
          <aside className="space-y-6 sticky top-6 hidden lg:block">
            <DailyVocabCard
              dailyWordsData={dailyWordsData}
              vocabIndex={vocabIndex}
              savingVocab={savingVocab}
              dailyTargetLang={dailyTargetLang}
              onTargetLangChange={(code) => {
                setDailyTargetLang(code);
                fetchDailyWords(code);
              }}
              onPrev={handlePrevVocab}
              onNext={handleNextVocab}
              onSave={handleSaveCurrentVocab}
              onPlayAudio={handlePlayAudio}
            />
          </aside>

        </div>
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
                    className="absolute top-1.5 right-1.5 bg-background/80 backdrop-blur-sm text-foreground p-1 rounded-full hover:bg-background transition-all shadow-sm cursor-pointer"
                    title={t("community.delete_image")}
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

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        onSuccess={(newGroup) => {
          fetchRealGroups();
          router.push(`/groups/${newGroup.id}`);
        }}
      />

      {toast}
    </div>
  );
}
