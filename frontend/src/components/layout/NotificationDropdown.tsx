"use client";

import * as React from "react";
import { Bell } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

export function getNotificationMessage(n: any, t: any) {
  if (!n) return "";
  const name = n.sender?.displayName || t("notifications.someone");

  const quotes: string[] = [];
  if (n.message) {
    const re = /"([^"]+)"/g;
    let m;
    while ((m = re.exec(n.message)) !== null) {
      quotes.push(m[1]);
    }
  }

  const group = quotes[0] || "";
  const reason = quotes[1] || quotes[0] || "";

  switch (n.type) {
    case "follow":
      return t("notifications.follow_message", { name });
    case "new_post":
      return t("notifications.new_post_message", { name });
    case "like":
      return t("notifications.like_message", { name });
    case "match":
      return t("notifications.match_message", { name });
    case "group_join_approved":
      return t("notifications.group_join_approved", { group });
    case "group_join_rejected":
      return t("notifications.group_join_rejected", { group });
    case "group_post_approved":
      return t("notifications.group_post_approved", { group });
    case "group_post_rejected":
      return t("notifications.group_post_rejected", { group });
    case "pending_join_request":
      return t("notifications.pending_join_request", { name, group });
    case "pending_group_post":
      return t("notifications.pending_group_post", { name, group });
    case "group_member_kicked":
      return t("notifications.group_member_kicked", { group });
    case "group_member_muted":
      return t("notifications.group_member_muted", { group });
    case "group_member_report":
      return t("notifications.group_member_report", { group, reason });
    case "group_post_report":
      return t("notifications.group_post_report", { group, reason });
    case "schedule_reminder":
      return t("notifications.schedule_reminder");
    default:
      return n.message;
  }
}

interface NotificationDropdownProps {
  notifications: any[];
  notificationsOpen: boolean;
  setNotificationsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onCloseOtherMenus: () => void;
  onMarkAllAsRead: () => void;
  onNotificationClick: (n: any) => void;
  t: any;
  locale: string;
}

export function NotificationDropdown({
  notifications,
  notificationsOpen,
  setNotificationsOpen,
  onCloseOtherMenus,
  onMarkAllAsRead,
  onNotificationClick,
  t,
  locale,
}: NotificationDropdownProps) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  const timeAgo = (iso: string) => {
    const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (isNaN(diffMin) || diffMin < 1) return t("community.time_just_now");
    if (diffMin < 60) return t("community.time_minutes_ago", { count: diffMin });
    const h = Math.floor(diffMin / 60);
    if (h < 24) return t("community.time_hours_ago", { count: h });
    return new Date(iso).toLocaleDateString(locale, {
      day: "2-digit",
      month: "2-digit",
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setNotificationsOpen((v) => !v);
          onCloseOtherMenus();
        }}
        className="relative p-2 text-muted hover:text-primary transition-colors rounded-full hover:bg-muted/10 focus-visible:outline-none"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white ring-2 ring-surface">
            {unreadCount}
          </span>
        )}
      </button>
      {notificationsOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setNotificationsOpen(false)} />
          <div className="absolute right-0 top-12 z-20 w-80 rounded-2xl border border-border bg-surface shadow-xl py-3 animate-in fade-in zoom-in-95 duration-150 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between px-4 pb-2 border-b border-border mb-2">
              <span className="font-bold text-sm text-foreground">{t("notifications.title")}</span>
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  {t("notifications.mark_all_read")}
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-muted">
                {t("notifications.empty")}
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => onNotificationClick(n)}
                    className={cn(
                      "w-full flex items-start gap-3 px-4 py-2.5 text-left text-xs transition-colors hover:bg-muted/10",
                      !n.read && "bg-primary/5 font-medium"
                    )}
                  >
                    <Avatar
                      src={n.sender?.avatarUrl ?? undefined}
                      fallback={n.sender?.displayName?.charAt(0) ?? "?"}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground leading-relaxed break-words">
                        {getNotificationMessage(n, t)}
                      </p>
                      <span className="text-[10px] text-muted mt-1 block">
                        {timeAgo(n.createdAt)}
                      </span>
                    </div>
                    {!n.read && (
                      <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
