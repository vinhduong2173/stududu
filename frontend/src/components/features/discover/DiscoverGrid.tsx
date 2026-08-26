"use client";

import * as React from "react";
import { Search, Users, RefreshCw } from "lucide-react";
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
  resetFilters,
}: DiscoverGridProps) {
  if (visible.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-surface rounded-3xl border border-border/80 shadow-card max-w-lg mx-auto my-8">
        <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center text-muted mb-4 border border-border/60">
          {candidates.length === 0 && insufficientPool ? (
            <Users className="w-8 h-8 text-teal-600" />
          ) : (
            <Search className="w-8 h-8 text-slate-400" />
          )}
        </div>
        <h2 className="text-lg sm:text-xl font-extrabold text-foreground font-display mb-2">
          {source.length === 0
            ? tab === "all"
              ? t("discover.empty_no_members")
              : insufficientPool
                ? t("discover.empty_insufficient")
                : t("discover.empty_no_match")
            : t("discover.empty_no_filter")}
        </h2>
        <p className="text-muted text-xs sm:text-sm mb-6 max-w-sm leading-relaxed">
          {source.length === 0
            ? tab === "all"
              ? t("discover.empty_invite")
              : t("discover.empty_suggest_tip")
            : t("discover.empty_filter_tip")}
        </p>
        {source.length === 0 ? (
          <Button
            className="sd-btn-gradient rounded-full font-bold px-6 h-11 gap-2 shadow-card"
            onClick={() => (tab === "suggest" ? fetchCandidates() : fetchMembers())}
          >
            <RefreshCw className="w-4 h-4" />
            <span>{t("discover.refresh_list")}</span>
          </Button>
        ) : (
          <Button variant="outline" className="rounded-full font-bold px-6 h-11 bg-white" onClick={resetFilters}>
            {t("discover.filter_reset")}
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      {/* 4-column responsive grid matching Tandem layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
        {visible.map((c) => (
          <MatchCard
            key={c.user.id}
            user={c.user}
            whyMatched={c.whyMatched}
          />
        ))}
      </div>

      {tab === "suggest" && candidates.length < total && (
        <div className="flex justify-center mt-10">
          <Button variant="outline" className="rounded-full px-8 h-12 font-bold bg-white hover:bg-surface-2 shadow-card" onClick={() => fetchCandidates(candidates.length)} disabled={loadingMore}>
            {loadingMore ? t("discover.loading_more") : t("discover.load_more", { remaining: String(total - candidates.length) })}
          </Button>
        </div>
      )}

      {tab === "all" && allMembers.length < allTotal && (
        <div className="flex justify-center mt-10">
          <Button variant="outline" className="rounded-full px-8 h-12 font-bold bg-white hover:bg-surface-2 shadow-card" onClick={() => fetchMembers(allMembers.length)} disabled={loadingMore}>
            {loadingMore ? t("discover.loading_more") : t("discover.load_more", { remaining: String(allTotal - allMembers.length) })}
          </Button>
        </div>
      )}

      {tab === "suggest" && insufficientPool && (
        <p className="text-center text-xs sm:text-sm text-muted mt-6 font-medium">
          {t("discover.insufficient_pool")}
        </p>
      )}
    </>
  );
}
