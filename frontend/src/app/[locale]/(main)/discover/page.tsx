"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { MatchModal } from "@/components/features/MatchModal";
import { useDiscover } from "@/hooks/useDiscover";
import { DiscoverHeader } from "@/components/features/discover/DiscoverHeader";
import { DiscoverGrid } from "@/components/features/discover/DiscoverGrid";
import { DiscoverFilterModal } from "@/components/features/discover/DiscoverFilterModal";

export default function DiscoverPage() {
  const d = useDiscover();

  if (d.loading) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-10 w-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-4" />
          <p className="text-muted text-sm font-medium">{d.t("discover.loading_search")}</p>
        </div>
      </div>
    );
  }

  if (d.error) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="bg-error/10 p-6 rounded-2xl max-w-md text-center">
          <p className="text-error mb-4 font-semibold text-sm">{d.error}</p>
          <Button onClick={() => d.fetchCandidates()}>{d.t("common.retry")}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1760px] mx-auto p-4 sm:p-8 lg:p-10">
      {/* Header & Tabs */}
      <DiscoverHeader
        t={d.t}
        tab={d.tab}
        switchTab={d.switchTab}
        search={d.search}
        setSearch={d.setSearch}
        activeFilterCount={d.activeFilterCount}
        onOpenFilter={() => d.setFilterModalOpen(true)}
      />

      {/* Grid of Partner Cards (Full Width) */}
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
        resetFilters={d.resetFilters}
      />

      {/* Filter Modal Popup */}
      <DiscoverFilterModal
        t={d.t}
        isOpen={d.filterModalOpen}
        onClose={() => d.setFilterModalOpen(false)}
        levelFilter={d.levelFilter}
        setLevelFilter={d.setLevelFilter}
        topics={d.topics}
        activeTopics={d.activeTopics}
        setActiveTopics={d.setActiveTopics}
        onlineOnly={d.onlineOnly}
        setOnlineOnly={d.setOnlineOnly}
        sort={d.sort}
        setSort={d.setSort}
        resetFilters={d.resetFilters}
        resultCount={d.visible.length}
      />

      <MatchModal
        isOpen={d.modalOpen}
        onClose={() => d.setModalOpen(false)}
        partnerName={d.matchedUser?.displayName || ""}
        partnerAvatar={d.matchedUser?.avatarUrl}
        conversationId={d.matchedConversationId}
      />
      {d.toast}
    </div>
  );
}
