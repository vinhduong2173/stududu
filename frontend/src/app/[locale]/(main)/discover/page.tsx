"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { MatchModal } from "@/components/features/MatchModal";
import { useDiscover } from "@/hooks/useDiscover";
import { DiscoverHeader } from "@/components/features/discover/DiscoverHeader";
import { DiscoverGrid } from "@/components/features/discover/DiscoverGrid";
import { DiscoverFilterModal } from "@/components/features/discover/DiscoverFilterModal";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function DiscoverPage() {
  const d = useDiscover();

  if (d.loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-12">
        <div className="flex flex-col items-center text-center">
          <div className="h-11 w-11 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-4" />
          <p className="text-muted text-sm font-semibold animate-pulse">{d.t("discover.loading_search")}</p>
        </div>
      </div>
    );
  }

  if (d.error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <div className="bg-rose-50 border border-rose-200/90 p-6 sm:p-8 rounded-3xl max-w-md text-center shadow-card">
          <AlertCircle className="w-10 h-10 text-rose-600 mx-auto mb-3" />
          <p className="text-rose-900 mb-5 font-bold text-sm leading-relaxed">{d.error}</p>
          <Button className="sd-btn-gradient rounded-full px-6 font-bold gap-2 shadow-card" onClick={() => d.fetchCandidates()}>
            <RefreshCw className="w-4 h-4" />
            <span>{d.t("common.retry")}</span>
          </Button>
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
        ageRange={d.ageRange}
        setAgeRange={d.setAgeRange}
        genderFilter={d.genderFilter}
        setGenderFilter={d.setGenderFilter}
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
