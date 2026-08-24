"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";
import { Avatar } from "@/components/ui/Avatar";
import {
  ArrowLeft,
  CalendarClock,
  Flag,
  Globe,
  MoreHorizontal,
  Phone,
  ShieldBan,
  UserRound,
  Video,
} from "lucide-react";
import { Conversation, isOnline } from "@/hooks/useChatInbox";

interface ChatHeaderProps {
  t: any;
  selected: Conversation;
  setSelectedId: (id: number | null) => void;
  startCall: (conversationId: number, partner: { id: number; displayName: string; avatarUrl?: string | null }, kind?: "audio" | "video") => void;
  callBusy: boolean;
  setScheduleOpen: (open: boolean) => void;
  setTranslationOpen: (open: boolean) => void;
  menuOpen: boolean;
  setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setReportOpen: (open: boolean) => void;
  setBlockOpen: (open: boolean) => void;
}

export function ChatHeader({
  t,
  selected,
  setSelectedId,
  startCall,
  callBusy,
  setScheduleOpen,
  setTranslationOpen,
  menuOpen,
  setMenuOpen,
  setReportOpen,
  setBlockOpen,
}: ChatHeaderProps) {
  const online = isOnline(selected.partner.lastActive);

  return (
    <div className="p-4 bg-surface flex items-center justify-between gap-3 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setSelectedId(null)}
          className="md:hidden text-muted hover:text-foreground p-1"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="relative shrink-0">
          <Avatar src={selected.partner.avatarUrl ?? undefined} fallback={selected.partner.displayName} size="md" />
          {online && (
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-success ring-2 ring-surface" />
          )}
        </div>
        <div className="min-w-0">
          <h2 className="font-bold text-sm text-foreground truncate">{selected.partner.displayName}</h2>
          <p className="text-xs text-muted truncate">
            {online ? t("chat.status_online") : t("chat.status_offline")}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() =>
            startCall(selected.id, {
              id: selected.partner.id,
              displayName: selected.partner.displayName,
              avatarUrl: selected.partner.avatarUrl,
            }, "audio")
          }
          disabled={callBusy}
          className="p-2 text-muted hover:text-primary hover:bg-primary/10 rounded-full transition-colors disabled:opacity-50"
          title={t("call.start_audio")}
        >
          <Phone className="h-5 w-5" />
        </button>

        <button
          onClick={() =>
            startCall(selected.id, {
              id: selected.partner.id,
              displayName: selected.partner.displayName,
              avatarUrl: selected.partner.avatarUrl,
            }, "video")
          }
          disabled={callBusy}
          className="p-2 text-muted hover:text-primary hover:bg-primary/10 rounded-full transition-colors disabled:opacity-50"
          title={t("call.start_video")}
        >
          <Video className="h-5 w-5" />
        </button>

        <button
          onClick={() => setScheduleOpen(true)}
          className="p-2 text-muted hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
          title={t("chat.schedule_chat")}
        >
          <CalendarClock className="h-5 w-5" />
        </button>

        <button
          onClick={() => setTranslationOpen(true)}
          className="p-2 text-muted hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
          title={t("chat.translation_modal_title")}
        >
          <Globe className="h-5 w-5" />
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="p-2 text-muted hover:text-foreground rounded-full hover:bg-muted/10"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-border bg-surface shadow-xl z-20 py-2">
              <Link
                href={`/profile/${selected.partner.id}`}
                className="w-full text-left px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted/10 flex items-center gap-2"
              >
                <UserRound className="h-4 w-4 text-muted" /> {t("chat.menu_profile")}
              </Link>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setReportOpen(true);
                }}
                className="w-full text-left px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted/10 flex items-center gap-2"
              >
                <Flag className="h-4 w-4 text-warning" /> {t("chat.menu_report")}
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setBlockOpen(true);
                }}
                className="w-full text-left px-4 py-2 text-xs font-semibold text-error hover:bg-error/10 flex items-center gap-2"
              >
                <ShieldBan className="h-4 w-4" /> {t("chat.menu_block")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
