"use client";

import * as React from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Conversation, isOnline, previewText } from "@/hooks/useChatInbox";

interface ConversationListSidebarProps {
  t: any;
  me: any;
  conversations: Conversation[];
  selectedId: number | null;
  setSelectedId: (id: number) => void;
  search: string;
  setSearch: (val: string) => void;
  loadingList: boolean;
}

export function ConversationListSidebar({
  t,
  me,
  conversations,
  selectedId,
  setSelectedId,
  search,
  setSearch,
  loadingList,
}: ConversationListSidebarProps) {
  const filtered = conversations.filter((c) =>
    c.partner.displayName.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <aside
      className={cn(
        "w-full md:w-80 lg:w-96 border-r border-border bg-surface flex flex-col shrink-0",
        selectedId ? "hidden md:flex" : "flex",
      )}
    >
      <div className="p-4 border-b border-border">
        <h1 className="font-display text-xl font-extrabold tracking-tight text-foreground mb-3">
          {t("chat.title")}
        </h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder={t("chat.search_placeholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full border border-border bg-background pl-9 pr-4 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-border/50">
        {loadingList ? (
          <div className="p-8 text-center text-sm text-muted">{t("chat.loading_conversations")}</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted">
            {search ? t("chat.no_result") : t("chat.no_conversations")}
          </div>
        ) : (
          filtered.map((c) => {
            const active = c.id === selectedId;
            const online = isOnline(c.partner.lastActive);
            const isMine = c.lastMessage?.senderId === me?.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={cn(
                  "w-full p-4 flex items-center gap-3 text-left transition-colors hover:bg-muted/10 relative",
                  active && "bg-primary/5 border-l-4 border-primary pl-3",
                )}
              >
                <div className="relative shrink-0">
                  <Avatar src={c.partner.avatarUrl ?? undefined} fallback={c.partner.displayName} size="md" />
                  {online && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-success ring-2 ring-surface" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-sm text-foreground truncate">{c.partner.displayName}</span>
                    {c.lastMessage && (
                      <span className="text-[10px] text-muted shrink-0">
                        {new Date(c.lastMessage.sentAt).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                  <p className={cn("text-xs truncate", c.unreadCount > 0 ? "font-bold text-foreground" : "text-muted")}>
                    {previewText(c.lastMessage, isMine, t)}
                  </p>
                </div>

                {c.unreadCount > 0 && (
                  <span className="h-5 min-w-[20px] rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center px-1.5 shrink-0">
                    {c.unreadCount}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
