"use client";

import * as React from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MatchModal } from "@/components/features/MatchModal";
import { useDiscover, SortKey } from "@/hooks/useDiscover";
import { DiscoverFilterPanel } from "@/components/features/discover/DiscoverFilterPanel";
import { DiscoverHeader } from "@/components/features/discover/DiscoverHeader";
import { DiscoverGrid } from "@/components/features/discover/DiscoverGrid";

export default function DiscoverPage() {
  const d = useDiscover();

  if (d.loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-4" />
          <p className="text-muted">{d.t("discover.loading_search")}</p>
        </div>
      </div>
    );
  }

  if (d.error) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="bg-error/10 p-6 rounded-2xl max-w-md text-center">
          <p className="text-error mb-4">{d.error}</p>
          <Button onClick={() => d.fetchCandidates()}>{d.t("common.retry")}</Button>
        </div>
      </div>
    );
  }

  const filterProps = {
    t: d.t,
    levelFilter: d.levelFilter,
    setLevelFilter: d.setLevelFilter,
    topics: d.topics,
    activeTopics: d.activeTopics,
    setActiveTopics: d.setActiveTopics,
    onlineOnly: d.onlineOnly,
    setOnlineOnly: d.setOnlineOnly,
    resetFilters: d.resetFilters,
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:px-8 md:py-6">
      <DiscoverHeader
        t={d.t}
        tab={d.tab}
        switchTab={d.switchTab}
        search={d.search}
        setSearch={d.setSearch}
      />

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar filter (desktop) */}
        <aside className="hidden md:block w-64 shrink-0 space-y-5 sticky top-4">
          <DiscoverFilterPanel {...filterProps} />
          <div className="rounded-2xl p-4 text-white bg-gradient-to-br from-primary to-secondary">
            <div className="text-xl mb-2">💡</div>
            <p className="font-bold text-sm mb-1">{d.t("discover.tip_title")}</p>
            <p className="text-white/80 text-xs leading-relaxed">{d.t("discover.tip_text")}</p>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {/* Mobile filter row */}
          <div className="flex items-center justify-between mb-4 md:hidden">
            <Button variant="ghost" size="sm" onClick={() => d.setMobileFilterOpen((v) => !v)}>
              <SlidersHorizontal className="h-4 w-4 mr-2" /> {d.t("discover.filter_title")}
              {(d.activeTopics.length > 0 || d.onlineOnly || d.levelFilter !== "all") && (
                <span className="ml-2 h-2 w-2 rounded-full bg-primary" />
              )}
            </Button>
            <select
              className="text-sm border border-border rounded-full px-3 py-2 bg-surface text-foreground font-medium focus:outline-none focus:border-primary"
              value={d.sort}
              onChange={(e) => d.setSort(e.target.value as SortKey)}
            >
              <option value="best">{d.t("discover.sort_best")}</option>
              <option value="recent">{d.t("discover.sort_recent")}</option>
            </select>
          </div>
          {d.mobileFilterOpen && <div className="mb-4 md:hidden"><DiscoverFilterPanel {...filterProps} /></div>}

          {/* Result count + sort (desktop) */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted">
              <span className="font-bold text-foreground">{d.visible.length}</span> {d.t("discover.result_count")}
            </p>
            <select
              className="hidden md:block text-sm border border-border rounded-full px-3 py-1.5 bg-surface text-foreground font-medium cursor-pointer focus:outline-none focus:border-primary"
              value={d.sort}
              onChange={(e) => d.setSort(e.target.value as SortKey)}
            >
              <option value="best">{d.t("discover.sort_best")}</option>
              <option value="recent">{d.t("discover.sort_recent")}</option>
            </select>
          </div>

          <DiscoverGrid
            t={d.t}
            visible={d.visible}
            tab={d.tab}
            candidates={d.candidates}
            total={d.total}
            allMembers={d.allMembers}
            allTotal={d.allTotal}
            insufficientPool={d.insufficientPool}
            loadingMore={d.loadingMore}
            source={d.source}
            fetchCandidates={d.fetchCandidates}
            fetchMembers={d.fetchMembers}
            handleLike={d.handleLike}
            handleUnlike={d.handleUnlike}
            resetFilters={d.resetFilters}
          />
        </div>
      </div>

      <MatchModal
        isOpen={d.modalOpen}
        onClose={() => d.setModalOpen(false)}
        partnerName={d.matchedUser?.displayName || ""}
        partnerAvatar={d.matchedUser?.avatarUrl}
        myAvatar={undefined}
        conversationId={d.matchedConversationId}
      />
      {d.toast}
    </div>
  );
}
