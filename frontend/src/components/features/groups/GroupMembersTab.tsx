"use client";

import * as React from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Crown,
  ShieldCheck,
  ShieldOff,
  UserX,
  MoreVertical,
  Loader2,
  MessageCircle,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useTranslations, useLocale } from "next-intl";

export type MemberType = {
  id: number;
  groupId: number;
  userId: number;
  role: "owner" | "admin" | "member";
  status: "active" | "suspended";
  joinedAt: string;
  user: { id: number; displayName: string; avatarUrl?: string | null };
  isCreator: boolean;
};

interface GroupMembersTabProps {
  members: MemberType[];
  loading: boolean;
  isAdmin: boolean;
  onToggleAdminRole?: (m: MemberType) => void;
  onRemoveMember?: (m: MemberType) => void;
}

export function GroupMembersTab({
  members,
  loading,
  isAdmin,
  onToggleAdminRole,
  onRemoveMember,
}: GroupMembersTabProps) {
  const t = useTranslations("groups");
  const locale = useLocale();
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredMembers = React.useMemo(() => {
    if (!searchQuery.trim()) return members;
    const q = searchQuery.trim().toLowerCase();
    return members.filter((m) =>
      m.user.displayName.toLowerCase().includes(q)
    );
  }, [members, searchQuery]);

  const admins = filteredMembers.filter(
    (m) => m.isCreator || m.role === "owner" || m.role === "admin"
  );
  const regularMembers = filteredMembers.filter(
    (m) => !m.isCreator && m.role !== "owner" && m.role !== "admin"
  );

  return (
    <div className="bg-surface rounded-3xl border border-border p-6 shadow-sm space-y-6">
      {/* Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <h2 className="text-lg font-bold text-foreground font-display flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <span>{t("members_in_group")}</span>
          </h2>
          <p className="text-xs text-muted">
            {t("total_members", { count: members.length })}
          </p>
        </div>

        {/* Member search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder={t("search_members_placeholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 rounded-full border border-border bg-surface pl-9.5 pr-3 text-xs sm:text-sm font-medium text-foreground placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-2xs"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-xs text-muted font-medium">{t("loading_members")}</p>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="py-12 text-center text-xs text-muted font-medium">
          {t("no_matching_members", { query: searchQuery })}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Section: Admins & Moderators */}
          {admins.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-muted uppercase tracking-wider">
                {t("admins_and_moderators", { count: admins.length })}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {admins.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-surface-2/40 border border-border/60 hover:border-border transition-all"
                  >
                    <Link
                      href={`/profile/${m.userId}`}
                      className="flex items-center gap-3 min-w-0 flex-1 group"
                    >
                      <Avatar
                        src={m.user.avatarUrl ?? undefined}
                        fallback={m.user.displayName?.charAt(0) || "U"}
                        size="md"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                            {m.user.displayName}
                          </p>
                          {m.isCreator ? (
                            <span title={t("creator_badge")} className="text-amber-500 shrink-0">
                              <Crown className="w-3.5 h-3.5 fill-amber-500" />
                            </span>
                          ) : (
                            <span title={t("admin_badge")} className="text-primary shrink-0">
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted">
                          {m.isCreator ? t("creator_badge") : t("admin_badge")}
                        </p>
                      </div>
                    </Link>

                    <Link
                      href={`/profile/${m.userId}`}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-surface border border-border hover:bg-surface-2 text-foreground transition-all shadow-2xs shrink-0"
                    >
                      {t("view_profile")}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: All Members */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-muted uppercase tracking-wider">
              {t("all_members", { count: regularMembers.length })}
            </h3>

            {regularMembers.length === 0 ? (
              <p className="text-xs text-muted italic">{t("no_regular_members")}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {regularMembers.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-surface-2/40 border border-border/60 hover:border-border transition-all"
                  >
                    <Link
                      href={`/profile/${m.userId}`}
                      className="flex items-center gap-3 min-w-0 flex-1 group"
                    >
                      <Avatar
                        src={m.user.avatarUrl ?? undefined}
                        fallback={m.user.displayName?.charAt(0) || "U"}
                        size="md"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                          {m.user.displayName}
                        </p>
                        <p className="text-[11px] text-muted">
                          {t("joined_date", { date: new Date(m.joinedAt).toLocaleDateString(locale) })}
                        </p>
                      </div>
                    </Link>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Link
                        href={`/profile/${m.userId}`}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-surface border border-border hover:bg-surface-2 text-foreground transition-all shadow-2xs"
                      >
                        {t("view_profile")}
                      </Link>

                      {isAdmin && onToggleAdminRole && (
                        <button
                          onClick={() => onToggleAdminRole(m)}
                          title={t("make_admin")}
                          className="p-1.5 rounded-xl border border-border bg-surface hover:bg-primary/10 hover:border-primary/40 text-muted hover:text-primary transition-all cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4" />
                        </button>
                      )}

                      {isAdmin && onRemoveMember && (
                        <button
                          onClick={() => onRemoveMember(m)}
                          title={t("remove_member")}
                          className="p-1.5 rounded-xl border border-border bg-surface hover:bg-rose-500/10 hover:border-rose-500/40 text-muted hover:text-rose-500 transition-all cursor-pointer"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
