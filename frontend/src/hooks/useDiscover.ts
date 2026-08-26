"use client";

import * as React from "react";
import { api } from "@/lib/api";
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
export type AgeRangeFilter = "all" | "16-22" | "23-30" | "31-45" | "45+";
export type GenderFilter = "all" | "male" | "female" | "other";
export type DiscoverTab = "suggest" | "all";

export function calculateAge(dob?: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

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
  const [ageRange, setAgeRange] = React.useState<AgeRangeFilter>("all");
  const [genderFilter, setGenderFilter] = React.useState<GenderFilter>("all");
  const [sort, setSort] = React.useState<SortKey>("best");
  const [filterModalOpen, setFilterModalOpen] = React.useState(false);

  const activeFilterCount =
    (levelFilter !== "all" ? 1 : 0) +
    (ageRange !== "all" ? 1 : 0) +
    (genderFilter !== "all" ? 1 : 0) +
    activeTopics.length +
    (onlineOnly ? 1 : 0);

  const [modalOpen, setModalOpen] = React.useState(false);
  const [matchedUser, setMatchedUser] = React.useState<any>(null);
  const [matchedConversationId, setMatchedConversationId] = React.useState<number | undefined>();
  const { show: showToast, toast } = useToast();

  React.useEffect(() => {
    fetchCandidates();
    api<Topic[]>("/topics").then(setTopics).catch(console.error);
  }, []);

  const fetchCandidates = async (offset = 0) => {
    if (offset === 0) setLoading(true);
    else setLoadingMore(true);
    try {
      const data = await api<SuggestionsResponse>(`/matching/suggestions?offset=${offset}`);
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
        showToast(t("discover.liked_toast", { name: candidate.user.displayName }));
      }
    } catch (err: any) {
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
      showToast(t("discover.card_unliked_toast", { name: candidate.user.displayName }));
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
    setAgeRange("all");
    setGenderFilter("all");
  };

  const source = tab === "suggest" ? candidates : allMembers;
  const visible = source
    .filter((c) => {
      if (onlineOnly && !isOnline(c.user.lastActive)) return false;
      if (levelFilter !== "all") {
        const hasRole = c.user.languages?.some((l: any) => l.role === levelFilter);
        if (!hasRole) return false;
      }
      if (ageRange !== "all") {
        const age = calculateAge(c.user.dob);
        if (age === null) return false;
        if (ageRange === "16-22" && (age < 16 || age > 22)) return false;
        if (ageRange === "23-30" && (age < 23 || age > 30)) return false;
        if (ageRange === "31-45" && (age < 31 || age > 45)) return false;
        if (ageRange === "45+" && age < 45) return false;
      }
      if (genderFilter !== "all") {
        if (!c.user.gender || c.user.gender.toLowerCase() !== genderFilter.toLowerCase()) {
          return false;
        }
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
    ageRange,
    setAgeRange,
    genderFilter,
    setGenderFilter,
    sort,
    setSort,
    filterModalOpen,
    setFilterModalOpen,
    activeFilterCount,
    modalOpen,
    setModalOpen,
    matchedUser,
    matchedConversationId,
    toast,
    handleLike,
    handleUnlike,
    resetFilters,
    fetchCandidates,
    fetchMembers,
    visible,
    source,
  };
}
