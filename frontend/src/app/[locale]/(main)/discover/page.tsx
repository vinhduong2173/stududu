"use client";

import * as React from "react";
import { MatchCard } from "@/components/features/MatchCard";
import { MatchModal } from "@/components/features/MatchModal";
import { useToast } from "@/components/features/TrustDialogs";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { getTopicTranslation } from "@/lib/i18nHelper";

type MatchResult = {
  user: any;
  score?: any; // chỉ có ở tab gợi ý
  whyMatched?: any;
  liked: boolean;
  conversationId: number | null;
};

type Topic = { id: number; name: string };

type SortKey = "best" | "recent";
type LevelFilter = "all" | "native" | "fluent";

type SuggestionsResponse = {
  items: MatchResult[];
  total: number;
  insufficientPool: boolean;
};

type DiscoverTab = "suggest" | "all";

export default function DiscoverPage() {
  const t = useTranslations();
  const [tab, setTab] = React.useState<DiscoverTab>("suggest");
  const [candidates, setCandidates] = React.useState<MatchResult[]>([]);
  const [total, setTotal] = React.useState(0);
  const [insufficientPool, setInsufficientPool] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [topics, setTopics] = React.useState<Topic[]>([]);

  // Tab "Tất cả thành viên" — không cần bù trừ ngôn ngữ
  const [allMembers, setAllMembers] = React.useState<MatchResult[]>([]);
  const [allTotal, setAllTotal] = React.useState(0);
  const [allLoaded, setAllLoaded] = React.useState(false);

  // Bộ lọc (client-side trên danh sách gợi ý đã cá nhân hóa)
  const [search, setSearch] = React.useState("");
  const [activeTopics, setActiveTopics] = React.useState<string[]>([]);
  const [onlineOnly, setOnlineOnly] = React.useState(false);
  const [levelFilter, setLevelFilter] = React.useState<LevelFilter>("all");
  const [sort, setSort] = React.useState<SortKey>("best");
  const [mobileFilterOpen, setMobileFilterOpen] = React.useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = React.useState(false);
  const [matchedUser, setMatchedUser] = React.useState<any>(null);
  const [matchedConversationId, setMatchedConversationId] = React.useState<number | undefined>();
  const { show: showToast, toast } = useToast();

  React.useEffect(() => {
    fetchCandidates();
    api<Topic[]>("/topics").then(setTopics).catch(console.error);
  }, []);

  // FS-08 — backend trả 6–10 gợi ý/lần, phân trang bằng ?offset=
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

  // Logic mới: thích là mở hội thoại ngay, card vẫn ở lại với nút "Đã thích"
  // Tải danh sách tất cả thành viên (lười — khi mở tab lần đầu)
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
  };

  // Áp bộ lọc + sắp xếp (nguồn theo tab đang mở)
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

  const filterPanel = (
    <div className="rounded-2xl border border-border bg-surface shadow-sm p-5">
      <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
        <SlidersHorizontal className="h-5 w-5 text-primary" /> {t("discover.filter_title")}
      </h2>

      <div className="space-y-5">
        <div>
          <label className="text-xs font-bold text-muted uppercase tracking-wide mb-2 block">
            {t("discover.filter_level_label")}
          </label>
          <select
            className="w-full rounded-xl border-2 border-border bg-surface px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors font-medium"
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as LevelFilter)}
          >
            <option value="all">{t("discover.filter_level_all")}</option>
            <option value="native">{t("discover.filter_level_native")}</option>
            <option value="fluent">{t("discover.filter_level_fluent")}</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-muted uppercase tracking-wide mb-2 block">
            {t("discover.filter_interests")}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {topics.map((topic) => (
              <button
                key={topic.id}
                onClick={() =>
                  setActiveTopics((prev) =>
                    prev.includes(topic.name)
                      ? prev.filter((t) => t !== topic.name)
                      : [...prev, topic.name],
                  )
                }
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold border transition-all",
                  activeTopics.includes(topic.name)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-surface text-muted hover:border-primary/50 hover:text-foreground",
                )}
              >
                {getTopicTranslation(topic.name, t)}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              checked={onlineOnly}
              onChange={(e) => setOnlineOnly(e.target.checked)}
              className="sr-only"
            />
            <div
              className={cn(
                "w-10 h-6 rounded-full border-2 transition-all",
                onlineOnly ? "bg-success border-success" : "bg-muted/20 border-border",
              )}
            >
              <div
                className={cn(
                  "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                  onlineOnly && "translate-x-4",
                )}
              />
            </div>
          </div>
          <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
            {t("discover.filter_online")}
          </span>
        </label>

        <Button variant="ghost" size="sm" className="w-full" onClick={resetFilters}>
          {t("discover.filter_reset")}
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-4" />
          <p className="text-muted">{t("discover.loading_search")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="bg-error/10 p-6 rounded-2xl max-w-md text-center">
          <p className="text-error mb-4">{error}</p>
          <Button onClick={() => fetchCandidates()}>{t("common.retry")}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      {/* Hero header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-secondary" />
          <span className="text-sm font-semibold text-secondary uppercase tracking-wide">
            {t("discover.hero_label")}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-foreground">{t("discover.title")}</h1>
        <p className="text-muted mt-1">{t("discover.subtitle")}</p>
      </div>

      {/* Tabs: Đối tác phù hợp / Tất cả thành viên */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => switchTab("suggest")}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-semibold border-2 transition-all",
            tab === "suggest"
              ? "border-primary bg-primary/10 text-primary shadow-sm"
              : "border-border bg-surface text-muted hover:border-primary/40",
          )}
        >
          🔄 {t("discover.tab_suggest")}
        </button>
        <button
          onClick={() => switchTab("all")}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-semibold border-2 transition-all",
            tab === "all"
              ? "border-primary bg-primary/10 text-primary shadow-sm"
              : "border-border bg-surface text-muted hover:border-primary/40",
          )}
        >
          👥 {t("discover.tab_all")}
        </button>
      </div>

      {/* Search bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted pointer-events-none" />
        <input
          type="text"
          placeholder={t("discover.search_placeholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-12 rounded-full border-2 border-border bg-surface pl-12 pr-4 text-sm focus:outline-none focus:border-primary transition-colors shadow-sm"
        />
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar filter (desktop) */}
        <aside className="hidden md:block w-64 shrink-0 space-y-5">
          {filterPanel}
          <div className="rounded-2xl p-4 text-white bg-gradient-to-br from-primary to-secondary">
            <div className="text-xl mb-2">💡</div>
            <p className="font-bold text-sm mb-1">{t("discover.tip_title")}</p>
            <p className="text-white/80 text-xs leading-relaxed">
              {t("discover.tip_text")}
            </p>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {/* Mobile filter row */}
          <div className="flex items-center justify-between mb-4 md:hidden">
            <Button variant="ghost" size="sm" onClick={() => setMobileFilterOpen((v) => !v)}>
              <SlidersHorizontal className="h-4 w-4 mr-2" /> {t("discover.filter_title")}
              {(activeTopics.length > 0 || onlineOnly || levelFilter !== "all") && (
                <span className="ml-2 h-2 w-2 rounded-full bg-primary" />
              )}
            </Button>
            <select
              className="text-sm border border-border rounded-full px-3 py-2 bg-surface text-foreground font-medium focus:outline-none focus:border-primary"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
            >
              <option value="best">{t("discover.sort_best")}</option>
              <option value="recent">{t("discover.sort_recent")}</option>
            </select>
          </div>
          {mobileFilterOpen && <div className="mb-4 md:hidden">{filterPanel}</div>}

          {/* Result count + sort (desktop) */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted">
              <span className="font-bold text-foreground">{visible.length}</span> {t("discover.result_count")}
            </p>
            <select
              className="hidden md:block text-sm border border-border rounded-full px-3 py-1.5 bg-surface text-foreground font-medium cursor-pointer focus:outline-none focus:border-primary"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
            >
              <option value="best">{t("discover.sort_best")}</option>
              <option value="recent">{t("discover.sort_recent")}</option>
            </select>
          </div>

          {visible.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {visible.map((c) => (
                  <MatchCard
                    key={c.user.id}
                    user={c.user}
                    whyMatched={c.whyMatched}
                    liked={c.liked}
                    onLike={() => handleLike(c.user.id)}
                    onUnlike={() => handleUnlike(c.user.id)}
                  />
                ))}
              </div>
              {/* FS-08: phân trang "xem thêm" (theo tab) */}
              {tab === "suggest" && candidates.length < total && (
                <div className="flex justify-center mt-8">
                  <Button variant="ghost" onClick={() => fetchCandidates(candidates.length)} disabled={loadingMore}>
                    {loadingMore ? t("discover.loading_more") : t("discover.load_more", { remaining: String(total - candidates.length) })}
                  </Button>
                </div>
              )}
              {tab === "all" && allMembers.length < allTotal && (
                <div className="flex justify-center mt-8">
                  <Button variant="ghost" onClick={() => fetchMembers(allMembers.length)} disabled={loadingMore}>
                    {loadingMore ? t("discover.loading_more") : t("discover.load_more", { remaining: String(allTotal - allMembers.length) })}
                  </Button>
                </div>
              )}
              {tab === "suggest" && insufficientPool && (
                <p className="text-center text-sm text-muted mt-6">
                  🌱 {t("discover.insufficient_pool")}
                </p>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-6xl mb-4">{candidates.length === 0 && insufficientPool ? "🌱" : "🔍"}</div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                {source.length === 0
                  ? tab === "all"
                    ? t("discover.empty_no_members")
                    : insufficientPool
                      ? t("discover.empty_insufficient")
                      : t("discover.empty_no_match")
                  : t("discover.empty_no_filter")}
              </h2>
              <p className="text-muted text-sm mb-6 max-w-sm">
                {source.length === 0
                  ? tab === "all"
                    ? t("discover.empty_invite")
                    : t("discover.empty_suggest_tip")
                  : t("discover.empty_filter_tip")}
              </p>
              {source.length === 0 ? (
                <Button
                  variant="secondary"
                  onClick={() => (tab === "suggest" ? fetchCandidates() : fetchMembers())}
                >
                  {t("discover.refresh_list")}
                </Button>
              ) : (
                <Button variant="secondary" onClick={resetFilters}>{t("discover.filter_reset")}</Button>
              )}
            </div>
          )}
        </div>
      </div>

      <MatchModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        partnerName={matchedUser?.displayName || ""}
        partnerAvatar={matchedUser?.avatarUrl}
        myAvatar={undefined}
        conversationId={matchedConversationId}
      />
      {toast}
    </div>
  );
}
