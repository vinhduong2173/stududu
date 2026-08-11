"use client";

import * as React from "react";
import { MatchCard } from "@/components/features/MatchCard";
import { Button } from "@/components/ui/Button";
import { DiscoverTab, MatchResult } from "@/hooks/useDiscover";

interface DiscoverGridProps {
  t: any;
  visible: MatchResult[];
  tab: DiscoverTab;
  candidates: MatchResult[];
  total: number;
  allMembers: MatchResult[];
  allTotal: number;
  insufficientPool: boolean;
  loadingMore: boolean;
  source: MatchResult[];
  fetchCandidates: (offset?: number) => void;
  fetchMembers: (offset?: number) => void;
  handleLike: (targetId: number) => void;
  handleUnlike: (targetId: number) => void;
  resetFilters: () => void;
}

export function DiscoverGrid({
  t,
  visible,
  tab,
  candidates,
  total,
  allMembers,
  allTotal,
  insufficientPool,
  loadingMore,
  source,
  fetchCandidates,
  fetchMembers,
  handleLike,
  handleUnlike,
  resetFilters,
}: DiscoverGridProps) {
  if (visible.length === 0) {
    return (
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
    );
  }

  return (
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
  );
}
