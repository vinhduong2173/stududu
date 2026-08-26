"use client";

import * as React from "react";
import Link from "next/link";
import {
  X,
  Users,
  Lock,
  Globe,
  Plus,
  Sparkles,
  Check,
  UserPlus,
  LogOut,
  Send,
  MessageSquare,
  Image as ImageIcon,
  ShieldAlert,
  Loader2,
  ChevronRight,
  BookOpen,
  ExternalLink,
  Eye,
  Heart,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useTranslations, useLocale } from "next-intl";
import { getLanguageInfo, LanguageFlag } from "@/lib/languages";

export type GroupItem = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  privacy: "public" | "private";
  postApprovalRequired?: boolean;
  creator: { id: number; displayName: string; avatarUrl?: string | null };
  language?: { id: number; code: string; name: string } | null;
  topic?: { id: number; name: string } | null;
  createdAt: string;
  memberCount: number;
  postCount?: number;
  userContext: {
    isMember: boolean;
    role?: "owner" | "admin" | "member" | null;
    hasPendingRequest: boolean;
  };
};

type GroupPost = {
  id: number;
  type: string;
  content?: string | null;
  imageUrl?: string | null;
  createdAt: string;
  user: { id: number; displayName: string; avatarUrl?: string | null };
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
};

/* ==========================================================================
   1. CREATE GROUP MODAL
   ========================================================================== */

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newGroup: GroupItem) => void;
}

export function CreateGroupModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateGroupModalProps) {
  const t = useTranslations("groups");
  const locale = useLocale();

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [privacy, setPrivacy] = React.useState<"public" | "private">("public");
  const [languageId, setLanguageId] = React.useState<string>("");
  const [availableLanguages, setAvailableLanguages] = React.useState<
    { id: number; code: string; name: string }[]
  >([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      api<{ id: number; code: string; name: string }[]>("/languages")
        .then((res) => {
          if (Array.isArray(res)) setAvailableLanguages(res);
        })
        .catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(t("error_name_required"));
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await api<GroupItem>("/groups", {
        method: "POST",
        body: {
          name: name.trim(),
          description: description.trim() || undefined,
          privacy,
          languageId: languageId ? parseInt(languageId, 10) : undefined,
        },
      });
      onSuccess(res);
      onClose();
      // Reset form
      setName("");
      setDescription("");
      setPrivacy("public");
      setLanguageId("");
    } catch (err: any) {
      setError(err?.message || t("error_create_failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-surface border border-border/80 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="relative p-6 border-b border-border/60 bg-gradient-to-r from-primary/10 via-pink-500/5 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary font-bold shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground font-display">
                {t("modal_create_title")}
              </h2>
              <p className="text-xs text-muted">
                {t("modal_create_subtitle")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-muted/20 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Group Name */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              {t("name_label")} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("name_placeholder")}
              maxLength={100}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-2xs"
              required
            />
          </div>

          {/* Language Selection Dropdown */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              {t("language_focus_label")}
            </label>
            <p className="text-[11px] text-muted mb-2">
              {t("language_focus_desc")}
            </p>
            <select
              value={languageId}
              onChange={(e) => setLanguageId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm font-medium text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-2xs"
            >
              <option value="">{t("select_language")}</option>
              {availableLanguages.map((lang) => {
                const info = getLanguageInfo(lang.code, lang.name, locale);
                return (
                  <option key={lang.id} value={lang.id}>
                    {info.flagEmoji} {info.displayName} ({info.nativeName})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              {t("desc_label")}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("desc_placeholder")}
              rows={3}
              maxLength={1000}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none shadow-2xs"
            />
          </div>

          {/* Privacy Choice */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              {t("privacy_label")}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPrivacy("public")}
                className={cn(
                  "p-3.5 rounded-2xl border text-left transition-all flex flex-col gap-1.5 cursor-pointer shadow-2xs",
                  privacy === "public"
                    ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                    : "border-border bg-white hover:border-border/80"
                )}
              >
                <div className="flex items-center gap-2 font-bold text-xs text-foreground">
                  <Globe className="w-4 h-4 text-primary" />
                  <span>{t("public")}</span>
                </div>
                <span className="text-[11px] text-muted leading-tight">
                  {t("public_desc")}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPrivacy("private")}
                className={cn(
                  "p-3.5 rounded-2xl border text-left transition-all flex flex-col gap-1.5 cursor-pointer shadow-2xs",
                  privacy === "private"
                    ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                    : "border-border bg-white hover:border-border/80"
                )}
              >
                <div className="flex items-center gap-2 font-bold text-xs text-foreground">
                  <Lock className="w-4 h-4 text-pink-500" />
                  <span>{t("private")}</span>
                </div>
                <span className="text-[11px] text-muted leading-tight">
                  {t("private_desc")}
                </span>
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl text-xs"
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="sd-btn-gradient rounded-xl text-xs font-bold gap-2 cursor-pointer shadow-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t("creating")}</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>{t("create_btn")}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ==========================================================================
   2. GROUP DETAIL MODAL (VIEW GROUP DETAILS & POSTS)
   ========================================================================== */

interface GroupDetailModalProps {
  groupIdOrSlug: number | string | null;
  onClose: () => void;
  onGroupUpdated?: () => void;
}

export function GroupDetailModal({
  groupIdOrSlug,
  onClose,
  onGroupUpdated,
}: GroupDetailModalProps) {
  const t = useTranslations("groups");
  const locale = useLocale();

  const [group, setGroup] = React.useState<GroupItem | null>(null);
  const [posts, setPosts] = React.useState<GroupPost[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [postDraft, setPostDraft] = React.useState("");
  const [posting, setPosting] = React.useState(false);

  // Fetch Group details and Group posts
  const fetchDetails = React.useCallback(async () => {
    if (!groupIdOrSlug) return;
    setLoading(true);
    try {
      const groupRes = await api<GroupItem>(`/groups/${groupIdOrSlug}`);
      setGroup(groupRes);

      // Fetch group posts
      try {
        const postsRes = await api<GroupPost[]>(`/groups/${groupRes.id}/posts`);
        setPosts(postsRes);
      } catch {
        setPosts([]);
      }
    } catch (err) {
      console.error("Error fetching group details:", err);
    } finally {
      setLoading(false);
    }
  }, [groupIdOrSlug]);

  React.useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  if (!groupIdOrSlug) return null;

  // Handle Join Group
  const handleJoin = async () => {
    if (!group) return;
    setActionLoading(true);
    try {
      await api(`/groups/${group.id}/join`, { method: "POST", body: {} });
      await fetchDetails();
      onGroupUpdated?.();
    } catch (err: any) {
      alert(err?.message || "Failed to join group");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Leave Group
  const handleLeave = async () => {
    if (!group) return;
    if (!confirm(t("leave_confirm"))) return;
    setActionLoading(true);
    try {
      await api(`/groups/${group.id}/leave`, { method: "POST" });
      await fetchDetails();
      onGroupUpdated?.();
    } catch (err: any) {
      alert(err?.message || "Failed to leave group");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Post Creation inside Group
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group || !postDraft.trim()) return;
    setPosting(true);
    try {
      await api(`/groups/${group.id}/posts`, {
        method: "POST",
        body: { content: postDraft.trim() },
      });
      setPostDraft("");
      // Refresh posts
      const postsRes = await api<GroupPost[]>(`/groups/${group.id}/posts`);
      setPosts(postsRes);
    } catch (err: any) {
      alert(err?.message || "Failed to post");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-surface border border-border/80 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-xs font-semibold text-muted">{t("loading_groups")}</p>
          </div>
        ) : group ? (
          <div className="flex flex-col h-full overflow-y-auto">
            {/* Group Banner / Cover */}
            <div className="relative h-44 w-full bg-gradient-to-r from-primary/30 via-pink-500/20 to-warning/30 overflow-hidden">
              {group.coverUrl && (
                <img
                  src={group.coverUrl}
                  alt={group.name}
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-surface/80 hover:bg-surface text-foreground shadow-md backdrop-blur-xs transition-colors z-10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Group Avatar & Badges */}
              <div className="absolute bottom-4 left-6 flex items-end gap-4">
                <div className="w-20 h-20 rounded-2xl border-4 border-surface shadow-xl bg-surface overflow-hidden flex items-center justify-center text-primary font-bold text-2xl font-display">
                  {group.avatarUrl ? (
                    <img
                      src={group.avatarUrl}
                      alt={group.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    group.name.charAt(0).toUpperCase()
                  )}
                </div>
              </div>
            </div>

            {/* Header Content */}
            <div className="p-6 pt-2 space-y-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-xl font-bold text-foreground font-display flex items-center gap-2">
                    <span>{group.name}</span>
                    {group.privacy === "private" ? (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-pink-500/10 text-pink-500 font-semibold border border-pink-500/20 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        {t("private")}
                      </span>
                    ) : (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold border border-primary/20 flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {t("public")}
                      </span>
                    )}
                  </h2>

                  <div className="flex items-center gap-3 text-xs text-muted mt-1.5 font-medium flex-wrap">
                    <span className="flex items-center gap-1 font-semibold text-foreground/80">
                      <Users className="w-3.5 h-3.5 text-primary" />
                      {t("members_count", { count: group.memberCount })}
                    </span>
                    {group.language && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                        <LanguageFlag code={group.language.code} className="w-3.5 h-3.5" />
                        {getLanguageInfo(group.language.code, group.language.name, locale).displayName}
                      </span>
                    )}
                    <span>· {t("created_by", { name: group.creator.displayName })}</span>
                  </div>
                </div>

                {/* Join / Leave & View Group Buttons */}
                <div className="flex items-center gap-2">
                  <Link
                    href={`/groups/${group.id}`}
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{t("view_page")}</span>
                  </Link>

                  {group.userContext.isMember ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleLeave}
                      disabled={actionLoading}
                      className="rounded-xl text-xs font-semibold gap-1.5 text-rose-500 border-rose-500/30 hover:bg-rose-500/10 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{t("leave")}</span>
                    </Button>
                  ) : group.userContext.hasPendingRequest ? (
                    <Button
                      size="sm"
                      disabled
                      className="rounded-xl text-xs font-semibold gap-1.5 bg-warning/20 text-warning border border-warning/30"
                    >
                      <span>{t("request_pending")}</span>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleJoin}
                      disabled={actionLoading}
                      className="sd-btn-gradient rounded-xl text-xs font-bold gap-1.5 shadow-sm cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{t("join")}</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Group Description */}
              {group.description && (
                <div className="bg-muted/10 p-4 rounded-2xl border border-border/60 text-xs text-foreground/90 leading-relaxed">
                  {group.description}
                </div>
              )}

              {/* Group Posts Section */}
              <div className="space-y-4 pt-2 border-t border-border/60">
                <h3 className="text-sm font-bold text-foreground flex items-center justify-between">
                  <span>{t("posts_title", { count: posts.length })}</span>
                </h3>

                {/* Create Post Input (only if member) */}
                {group.userContext.isMember && (
                  <form
                    onSubmit={handleCreatePost}
                    className="p-3 bg-muted/10 rounded-2xl border border-border/60 space-y-2"
                  >
                    <textarea
                      value={postDraft}
                      onChange={(e) => setPostDraft(e.target.value)}
                      placeholder={t("write_post_placeholder")}
                      rows={2}
                      className="w-full text-xs bg-transparent text-foreground placeholder:text-muted focus:outline-none resize-none"
                    />
                    <div className="flex items-center justify-end">
                      <Button
                        type="submit"
                        size="sm"
                        disabled={posting || !postDraft.trim()}
                        className="sd-btn-gradient rounded-xl text-xs h-8 px-4 font-semibold gap-1.5"
                      >
                        {posting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span>{t("post_btn")}</span>
                      </Button>
                    </div>
                  </form>
                )}

                {/* Group Feed Posts List */}
                {posts.length === 0 ? (
                  <div className="p-8 text-center bg-muted/5 rounded-2xl border border-dashed border-border text-xs text-muted">
                    {t("empty_posts")}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {posts.map((p) => (
                      <div
                        key={p.id}
                        className="p-4 rounded-2xl bg-surface border border-border/70 space-y-2 shadow-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            src={p.user.avatarUrl || undefined}
                            fallback={p.user.displayName.charAt(0).toUpperCase()}
                            size="sm"
                          />
                          <div>
                            <p className="text-xs font-bold text-foreground leading-none">
                              {p.user.displayName}
                            </p>
                            <p className="text-[10px] text-muted mt-0.5">
                              {new Date(p.createdAt).toLocaleDateString(locale)}
                            </p>
                          </div>
                        </div>

                        {p.content && (
                          <p className="text-xs text-foreground/90 leading-relaxed">
                            {p.content}
                          </p>
                        )}

                        {p.imageUrl && (
                          <div className="mt-2 rounded-xl overflow-hidden border border-border/50 max-h-60">
                            <img
                              src={p.imageUrl}
                              alt="Post attachment"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-rose-500">
            {t("error_create_failed")}
          </div>
        )}
      </div>
    </div>
  );
}
