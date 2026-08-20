"use client";

import * as React from "react";
import { api } from "@/lib/api";
import { useQuotaGuard } from "@/components/features/pricing/QuotaExceededDialog";
import { useToast } from "@/components/features/TrustDialogs";
import { useTranslations } from "next-intl";

export type MatchResult = {
  user: any;
  score?: any;
  whyMatched?: any;
  liked: boolean;
  conversationId: number | null;
};

export type Topic = { id: number; name: string };
export type SortKey = "best" | "recent";
export type LevelFilter = "all" | "native" | "fluent";
export type DiscoverTab = "suggest" | "all";

export type SuggestionsResponse = {
  items: MatchResult[];
  total: number;
  insufficientPool: boolean;
};

export function useDiscover() {
  const t = useTranslations();
  const [tab, setTab] = React.useState<DiscoverTab>("suggest");
  const [candidates, setCandidates] = React.useState<MatchResult[]>([]);
  const [total, setTotal] = React.useState(0);
  const [insufficientPool, setInsufficientPool] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [topics, setTopics] = React.useState<Topic[]>([]);

  const [allMembers, setAllMembers] = React.useState<MatchResult[]>([]);
  const [allTotal, setAllTotal] = React.useState(0);
  const [allLoaded, setAllLoaded] = React.useState(false);

  const [search, setSearch] = React.useState("");
  const [activeTopics, setActiveTopics] = React.useState<string[]>([]);
  const [onlineOnly, setOnlineOnly] = React.useState(false);
  const [levelFilter, setLevelFilter] = React.useState<LevelFilter>("all");
  const [sort, setSort] = React.useState<SortKey>("best");
  // EP-11 — bộ lọc nâng cao theo múi giờ, chỉ gói Pro dùng được (SRS §3.2).
  // Cấu hình được GIỮ LẠI khi hạ cấp, chỉ ngừng áp dụng (SRS §5.4).
  const [timezoneFilter, setTimezoneFilter] = React.useState("");
  const [mobileFilterOpen, setMobileFilterOpen] = React.useState(false);

  const [modalOpen, setModalOpen] = React.useState(false);
  const [matchedUser, setMatchedUser] = React.useState<any>(null);
  const [matchedConversationId, setMatchedConversationId] = React.useState<number | undefined>();
  const { show: showToast, toast } = useToast();
  const quota = useQuotaGuard();

  React.useEffect(() => {
    fetchCandidates();
    api<Topic[]>("/topics").then(setTopics).catch(console.error);
  }, []);

  const fetchCandidates = async (offset = 0, timezone = timezoneFilter) => {
    if (offset === 0) setLoading(true);
    else setLoadingMore(true);
    try {
      const query = new URLSearchParams({ offset: String(offset) });
      if (timezone) query.set("timezone", timezone);
      const data = await api<SuggestionsResponse>(`/matching/suggestions?${query}`);
      setCandidates((prev) => (offset === 0 ? data.items : [...prev, ...data.items]));
      setTotal(data.total);
      setInsufficientPool(data.insufficientPool);
      setError("");
    } catch (err: any) {
      setError(err.message || t("discover.error_load"));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchMembers = async (offset = 0) => {
    if (offset === 0) setLoading(true);
    else setLoadingMore(true);
    try {
      const data = await api<{ items: MatchResult[]; total: number }>(
        `/matching/members?offset=${offset}`,
      );
      setAllMembers((prev) => (offset === 0 ? data.items : [...prev, ...data.items]));
      setAllTotal(data.total);
      setAllLoaded(true);
      setError("");
    } catch (err: any) {
      setError(err.message || t("discover.error_load_members"));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const switchTab = (next: DiscoverTab) => {
    setTab(next);
    if (next === "all" && !allLoaded) void fetchMembers();
  };

  const handleLike = async (targetId: number) => {
    const source = tab === "suggest" ? candidates : allMembers;
    const setSource = tab === "suggest" ? setCandidates : setAllMembers;
    const candidate = source.find((c) => c.user.id === targetId);
    if (!candidate || candidate.liked) return;
    setSource((prev) => prev.map((c) => (c.user.id === targetId ? { ...c, liked: true } : c)));

    try {
      const result = await api<{ mutual: boolean; conversation: { id: number } | null }>(
        `/matching/like/${targetId}`,
        { method: "POST" },
      );
      setSource((prev) =>
        prev.map((c) =>
          c.user.id === targetId ? { ...c, conversationId: result.conversation?.id ?? null } : c,
        ),
      );
      if (result.mutual) {
        setMatchedUser(candidate.user);
        setMatchedConversationId(result.conversation?.id);
        setModalOpen(true);
      } else {
        showToast(`💜 ${t("discover.liked_toast", { name: candidate.user.displayName })}`);
      }
    } catch (err: any) {
      // US-39 AC1 — chạm hạn mức Like (BR-45): mở hộp thoại giải thích + lối
      // dẫn tới /pricing thay vì chỉ nuốt lỗi vào console.
      quota.capture(err);
      console.error(err);
      setSource((prev) => prev.map((c) => (c.user.id === targetId ? { ...c, liked: false } : c)));
    }
  };

  const handleUnlike = async (targetId: number) => {
    const source = tab === "suggest" ? candidates : allMembers;
    const setSource = tab === "suggest" ? setCandidates : setAllMembers;
    const candidate = source.find((c) => c.user.id === targetId);
    if (!candidate || !candidate.liked) return;
    setSource((prev) => prev.map((c) => (c.user.id === targetId ? { ...c, liked: false, conversationId: null } : c)));

    try {
      await api(`/matching/like/${targetId}`, { method: "DELETE" });
      showToast(`💔 ${t("discover.card_unliked_toast", { name: candidate.user.displayName })}`);
    } catch (err: any) {
      console.error(err);
      setSource((prev) => prev.map((c) => (c.user.id === targetId ? { ...c, liked: true, conversationId: candidate.conversationId } : c)));
    }
  };

  const isOnline = (lastActive?: string | null) =>
    lastActive ? new Date(lastActive).getTime() > Date.now() - 5 * 60 * 1000 : false;

  const resetFilters = () => {
    setSearch("");
    setActiveTopics([]);
    setOnlineOnly(false);
    setLevelFilter("all");
    setTimezoneFilter("");
    void fetchCandidates(0, "");
  };

  /** Bộ lọc nâng cao chạy ở server (BR-46: lọc SAU khi xếp hạng) nên phải tải lại. */
  const applyTimezoneFilter = (timezone: string) => {
    setTimezoneFilter(timezone);
    void fetchCandidates(0, timezone);
  };

  const source = tab === "suggest" ? candidates : allMembers;
  const visible = source
    .filter((c) => {
      if (onlineOnly && !isOnline(c.user.lastActive)) return false;
      if (levelFilter !== "all") {
        const hasRole = c.user.languages?.some((l: any) => l.role === levelFilter);
        if (!hasRole) return false;
      }
      if (activeTopics.length > 0) {
        const theirTopics: string[] = c.user.interests?.map((i: any) => i.topic.name) ?? [];
        if (!activeTopics.some((t) => theirTopics.includes(t))) return false;
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const langNames: string[] = c.user.languages?.map((l: any) => l.language.name.toLowerCase()) ?? [];
        const topicNames: string[] = c.user.interests?.map((i: any) => i.topic.name.toLowerCase()) ?? [];
        const hit =
          c.user.displayName.toLowerCase().includes(q) ||
          langNames.some((n) => n.includes(q)) ||
          topicNames.some((n) => n.includes(q));
        if (!hit) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sort === "recent" || tab === "all") {
        return (
          new Date(b.user.lastActive ?? 0).getTime() - new Date(a.user.lastActive ?? 0).getTime()
        );
      }
      return (b.score?.total ?? 0) - (a.score?.total ?? 0);
    });

  return {
    t,
    tab,
    switchTab,
    candidates,
    total,
    insufficientPool,
    loading,
    loadingMore,
    error,
    topics,
    allMembers,
    allTotal,
    search,
    setSearch,
    activeTopics,
    setActiveTopics,
    onlineOnly,
    setOnlineOnly,
    levelFilter,
    setLevelFilter,
    timezoneFilter,
    setTimezoneFilter,
    applyTimezoneFilter,
    sort,
    setSort,
    mobileFilterOpen,
    setMobileFilterOpen,
    modalOpen,
    setModalOpen,
    matchedUser,
    matchedConversationId,
    toast,
    quotaDialog: quota.dialog,
    handleLike,
    handleUnlike,
    resetFilters,
    fetchCandidates,
    fetchMembers,
    visible,
    source,
  };
}
