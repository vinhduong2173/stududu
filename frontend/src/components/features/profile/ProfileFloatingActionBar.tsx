"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Heart, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileFloatingActionBarProps {
  liked: boolean;
  conversationId: number | null;
  isLikeHovered: boolean;
  setIsLikeHovered: (val: boolean) => void;
  handleLike: () => void;
  handleUnlike: () => void;
  router: any;
  t: any;
  tDisc: any;
}

export function ProfileFloatingActionBar({
  liked,
  conversationId,
  isLikeHovered,
  setIsLikeHovered,
  handleLike,
  handleUnlike,
  router,
  t,
  tDisc,
}: ProfileFloatingActionBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 md:left-[max(0px,calc(50%-36rem))] md:right-[max(0px,calc(50%-36rem))] p-4 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none z-30">
      <div className="flex gap-3 pointer-events-auto max-w-xl mx-auto">
        {liked ? (
          <>
            <div
              className="flex-1 h-13 relative"
              onMouseEnter={() => setIsLikeHovered(true)}
              onMouseLeave={() => setIsLikeHovered(false)}
            >
              <Button
                variant="ghost"
                onClick={handleUnlike}
                className={cn(
                  "w-full h-full rounded-2xl border-2 transition-all duration-150 font-bold cursor-pointer",
                  isLikeHovered
                    ? "border-rose-300 bg-rose-100/80 text-rose-700 shadow-sm"
                    : "border-rose-200 bg-rose-50/90 text-rose-700 shadow-card"
                )}
              >
                <Heart
                  className={cn(
                    "w-5 h-5 mr-2 transition-transform duration-150",
                    isLikeHovered ? "fill-none text-rose-600" : "fill-rose-500 text-rose-500 scale-105"
                  )}
                />
                <span>{isLikeHovered ? tDisc("card_unlike") : tDisc("card_liked")}</span>
              </Button>
            </div>
            <Button
              className="flex-1 h-13 rounded-2xl shadow-card font-bold sd-btn-gradient gap-2 active:scale-95 transition-all cursor-pointer"
              onClick={() => router.push(conversationId ? `/inbox?conversation=${conversationId}` : "/inbox")}
            >
              <MessageCircle className="w-5 h-5" />
              <span>{t("message_btn")}</span>
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            className="flex-1 h-13 rounded-2xl border-2 border-rose-400 bg-white text-rose-600 hover:bg-rose-50 hover:border-rose-500 shadow-card transition-all active:scale-95 font-bold text-sm sm:text-base cursor-pointer"
            onClick={handleLike}
          >
            <Heart className="w-5 h-5 mr-2 fill-none stroke-[2.2] text-rose-500" />
            <span>{tDisc("card_like")}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
