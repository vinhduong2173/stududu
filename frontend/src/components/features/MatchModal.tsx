"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { useRouter } from "next/navigation";
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
      <div className="bg-surface w-full max-w-sm rounded-3xl shadow-2xl p-8 flex flex-col items-center text-center scale-in-center animate-in zoom-in-95 duration-300">
        
        <div className="flex items-center justify-center -space-x-4 mb-6">
          <Avatar src={myAvatar} fallback="Me" size="xl" className="border-4 border-surface shadow-lg z-10 transform -rotate-6" />
          <Avatar src={partnerAvatar} fallback={partnerName.charAt(0)} size="xl" className="border-4 border-surface shadow-lg z-0 transform rotate-6" />
        </div>

        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
          {t("match_title")}
        </h2>
        <p className="text-muted mb-8">
          {t("match_desc", { name: partnerName })}
        </p>

        <div className="flex flex-col w-full gap-3">
          <Button 
            className="w-full text-base h-14 rounded-2xl" 
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
