"use client";

import * as React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileText,
  UserPlus,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Trash2,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { GroupItem } from "@/components/features/GroupModals";
import { useTranslations, useLocale } from "next-intl";

export type JoinRequest = {
  id: number;
  groupId: number;
  userId: number;
  status: "pending" | "approved" | "rejected";
  message?: string | null;
  createdAt: string;
  user: { id: number; displayName: string; avatarUrl?: string | null };
};

interface GroupModerationTabProps {
  group: GroupItem;
  pendingPosts: any[];
  loadingPendingPosts: boolean;
  joinRequests: JoinRequest[];
  loadingRequests: boolean;
  deletingGroup?: boolean;
  onTogglePostApproval: () => void;
  onApprovePost: (id: number) => void;
  onRejectPost: (id: number) => void;
  onApproveRequest: (req: JoinRequest) => void;
  onRejectRequest: (req: JoinRequest) => void;
  onDeleteGroup: () => void;
}

export function GroupModerationTab({
  group,
  pendingPosts,
  loadingPendingPosts,
  joinRequests,
  loadingRequests,
  deletingGroup,
  onTogglePostApproval,
  onApprovePost,
  onRejectPost,
  onApproveRequest,
  onRejectRequest,
  onDeleteGroup,
}: GroupModerationTabProps) {
  const t = useTranslations("groups");
  const locale = useLocale();

  return (
    <div className="space-y-6">
      {/* Settings Card: Post Approval Toggle */}
      <div className="bg-surface rounded-3xl border border-border p-6 shadow-sm flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-foreground font-display flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span>{t("post_approval_title")}</span>
          </h3>
          <p className="text-xs text-muted mt-0.5">
            {t("post_approval_desc")}
          </p>
        </div>

        <button
          onClick={onTogglePostApproval}
          className="shrink-0 p-1 text-primary hover:opacity-80 transition-opacity cursor-pointer"
          title={group.postApprovalRequired ? t("post_approval_enabled_tip") : t("post_approval_disabled_tip")}
        >
          {group.postApprovalRequired ? (
            <ToggleRight className="w-9 h-9 text-emerald-500 fill-emerald-500/20" />
          ) : (
            <ToggleLeft className="w-9 h-9 text-muted" />
          )}
        </button>
      </div>

      {/* Grid: Pending Posts & Join Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Posts */}
        <div className="bg-surface rounded-3xl border border-border p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/80">
            <h3 className="text-base font-bold text-foreground font-display flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <span>{t("pending_posts_title")}</span>
            </h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {pendingPosts.length}
            </span>
          </div>

          {loadingPendingPosts ? (
            <div className="py-8 text-center text-xs text-muted">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
              {t("loading_posts")}
            </div>
          ) : pendingPosts.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted italic">
              {t("no_pending_posts")}
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {pendingPosts.map((post) => (
                <div
                  key={post.id}
                  className="p-4 rounded-2xl bg-surface-2/40 border border-border/60 space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={post.user.avatarUrl ?? undefined}
                      fallback={post.user.displayName?.charAt(0) || "U"}
                      size="sm"
                    />
                    <div>
                      <p className="text-xs font-bold text-foreground">{post.user.displayName}</p>
                      <p className="text-[10px] text-muted">
                        {new Date(post.createdAt).toLocaleDateString(locale)}
                      </p>
                    </div>
                  </div>

                  {post.content && (
                    <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                      {post.content}
                    </p>
                  )}

                  {post.imageUrl && (
                    <img
                      src={post.imageUrl}
                      alt="Post attachment"
                      className="w-full max-h-48 object-cover rounded-xl border border-border/40"
                    />
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onRejectPost(post.id)}
                      className="text-xs text-rose-500 hover:bg-rose-500/10 gap-1 h-8 px-3 rounded-lg cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>{t("reject")}</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onApprovePost(post.id)}
                      className="sd-btn-gradient text-xs font-bold gap-1 h-8 px-3 rounded-lg text-white cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{t("approve")}</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Join Requests */}
        <div className="bg-surface rounded-3xl border border-border p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/80">
            <h3 className="text-base font-bold text-foreground font-display flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              <span>{t("pending_requests_title")}</span>
            </h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {joinRequests.length}
            </span>
          </div>

          {loadingRequests ? (
            <div className="py-8 text-center text-xs text-muted">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
              {t("loading_requests")}
            </div>
          ) : joinRequests.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted italic">
              {t("no_pending_requests")}
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {joinRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-surface-2/40 border border-border/60"
                >
                  <Link
                    href={`/profile/${req.userId}`}
                    className="flex items-center gap-3 min-w-0 flex-1 group"
                  >
                    <Avatar
                      src={req.user.avatarUrl ?? undefined}
                      fallback={req.user.displayName?.charAt(0) || "U"}
                      size="md"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                        {req.user.displayName}
                      </p>
                      <p className="text-[11px] text-muted">
                        {t("requested_at", { date: new Date(req.createdAt).toLocaleDateString(locale) })}
                      </p>
                    </div>
                  </Link>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onRejectRequest(req)}
                      className="text-xs text-rose-500 hover:bg-rose-500/10 h-8 px-2.5 rounded-lg cursor-pointer"
                    >
                      {t("reject")}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onApproveRequest(req)}
                      className="sd-btn-gradient text-xs font-bold h-8 px-3 rounded-lg text-white cursor-pointer"
                    >
                      {t("approve")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Group Action */}
      <div className="pt-4 flex items-center justify-end">
        <Button
          variant="outline"
          onClick={onDeleteGroup}
          disabled={deletingGroup}
          className="rounded-full text-xs font-bold gap-2 text-rose-500 border-rose-500/30 hover:bg-rose-500/10 hover:border-rose-500 h-10 px-5 cursor-pointer transition-all"
        >
          {deletingGroup ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t("deleting_group")}</span>
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4" />
              <span>{t("delete_group_btn")}</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
