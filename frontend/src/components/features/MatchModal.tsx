"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export interface MatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  myAvatar?: string;
  partnerAvatar?: string;
  partnerName: string;
  /** id hội thoại vừa tạo khi mutual — để "Nhắn tin ngay" mở đúng phòng chat */
  conversationId?: number;
}

export function MatchModal({ isOpen, onClose, myAvatar, partnerAvatar, partnerName, conversationId }: MatchModalProps) {
  const router = useRouter();
  const t = useTranslations("discover");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface w-full max-w-sm rounded-2xl border border-border shadow-elevated p-8 flex flex-col items-center text-center scale-in-center animate-in zoom-in-95 duration-300">
        
        <div className="flex items-center justify-center -space-x-4 mb-6">
          <Avatar src={myAvatar} fallback="Me" size="xl" className="border-4 border-surface shadow-md z-10 transform -rotate-6" />
          <Avatar src={partnerAvatar} fallback={partnerName.charAt(0)} size="xl" className="border-4 border-surface shadow-md z-0 transform rotate-6" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground font-display mb-2 tracking-tight">
          {t("match_title")}
        </h2>
        <p className="text-xs sm:text-sm text-muted mb-6 leading-relaxed">
          {t("match_desc", { name: partnerName })}
        </p>

        <div className="flex flex-col w-full gap-2.5">
          <Button 
            className="w-full text-sm font-bold h-12 rounded-full sd-btn-gradient" 
            onClick={() => {
              onClose();
              router.push(conversationId ? `/inbox?conversation=${conversationId}` : "/inbox");
            }}
          >
            {t("match_chat_now")}
          </Button>
          <Button 
            variant="ghost" 
            className="w-full h-12" 
            onClick={onClose}
          >
            {t("match_continue")}
          </Button>
        </div>
      </div>
    </div>
  );
}
