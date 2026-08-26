"use client";

import * as React from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, MessageCircle, Heart, Award, MoreHorizontal, Flag, ShieldBan, MapPin } from "lucide-react";
import { ageFromDob } from "@/lib/utils";
import { getGenderTranslation } from "@/lib/i18nHelper";
import { WorldMapBanner } from "./WorldMapBanner";

interface OtherUserProfileHeaderProps {
  user: any;
  liked: boolean;
  conversationId: number | null;
  menuOpen: boolean;
  setMenuOpen: (val: boolean) => void;
  setReportOpen: (val: boolean) => void;
  setBlockOpen: (val: boolean) => void;
  setEndorseOpen: (val: boolean) => void;
  handleLike: () => void;
  router: any;
  t: any;
  tDisc: any;
  tRoot: any;
}

export function OtherUserProfileHeader({
  user,
  liked,
  conversationId,
  menuOpen,
  setMenuOpen,
  setReportOpen,
  setBlockOpen,
  setEndorseOpen,
  handleLike,
  router,
  t,
  tDisc,
  tRoot,
}: OtherUserProfileHeaderProps) {
  const isOnline = user.lastActive ? new Date(user.lastActive).getTime() > Date.now() - 5 * 60 * 1000 : false;

  return (
    <div className="w-full bg-surface border-b border-border shadow-xs mb-8 relative">
      <WorldMapBanner />

      {/* Floating Back Button */}
      <button
        onClick={() => router.back()}
        className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 p-2.5 rounded-full bg-surface/90 hover:bg-surface text-foreground shadow-md border border-border/80 transition-all cursor-pointer hover:scale-105 active:scale-95"
        title="Quay lại"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Centered Avatar & Profile Info */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 text-center">
        <div className="-mt-14 sm:-mt-16 md:-mt-20 flex justify-center relative z-10">
          <Avatar
            src={user.avatarUrl}
            fallback={user.displayName?.charAt(0) || "U"}
            size="2xl"
            online={isOnline}
            className="shadow-xl ring-4 ring-white"
          />
        </div>

        <div className="mt-3.5 space-y-1">
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {user.displayName}
            {ageFromDob(user.dob) !== null && (
              <span className="font-medium text-muted">, {ageFromDob(user.dob)}</span>
            )}
          </h1>

          <p className="text-xs sm:text-sm text-muted flex items-center justify-center gap-1.5 flex-wrap">
            <span className={`inline-block h-2 w-2 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
            <span>{isOnline ? tDisc("card_online") : tDisc("card_recent")}</span>
            {user.city && (
              <span className="inline-flex items-center gap-0.5">
                · <MapPin className="w-3.5 h-3.5 text-muted/70" /> {[user.city, user.country].filter(Boolean).join(", ")}
              </span>
            )}
            {user.gender && <span>· {getGenderTranslation(user.gender, tRoot)}</span>}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-2.5 sm:gap-3 mt-4 flex-wrap">
          {liked ? (
            <Button
              size="sm"
              onClick={() => router.push(conversationId ? `/inbox?conversation=${conversationId}` : "/inbox")}
              className="rounded-full px-6 shadow-card font-bold sd-btn-gradient gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{t("message_btn") || "Nhắn tin"}</span>
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleLike}
              className="rounded-full px-6 shadow-card font-bold bg-rose-500 hover:bg-rose-600 text-white gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <Heart className="w-4 h-4 fill-current" />
              <span>{tDisc("card_like") || "Thích"}</span>
            </Button>
          )}

          {conversationId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEndorseOpen(true)}
              className="rounded-full px-4 font-bold bg-white hover:bg-surface-2 gap-1.5 shadow-2xs cursor-pointer"
            >
              <Award className="w-4 h-4 text-primary" />
              <span>{t("endorse_btn")}</span>
            </Button>
          )}

          {/* More Menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2.5 rounded-full border border-border bg-white text-muted hover:text-foreground hover:bg-surface-2 transition-colors cursor-pointer shadow-2xs"
              title="Thao tác khác"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 bottom-full sm:bottom-auto sm:top-full mb-2 sm:mb-0 sm:mt-2 z-30 w-44 rounded-2xl border border-border bg-surface shadow-xl py-1 text-xs text-left">
                  <button
                    onClick={() => { setMenuOpen(false); setReportOpen(true); }}
                    className="w-full flex items-center gap-2 px-3.5 py-2.5 text-left text-foreground hover:bg-surface-2 font-medium cursor-pointer"
                  >
                    <Flag className="w-3.5 h-3.5 text-amber-500" />
                    <span>{t("report")}</span>
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); setBlockOpen(true); }}
                    className="w-full flex items-center gap-2 px-3.5 py-2.5 text-left text-error hover:bg-rose-50 font-medium cursor-pointer"
                  >
                    <ShieldBan className="w-3.5 h-3.5" />
                    <span>{t("block")}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
