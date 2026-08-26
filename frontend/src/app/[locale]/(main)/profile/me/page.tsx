"use client";

import * as React from "react";
import { FileText, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { useTranslations } from "next-intl";
import { PostCard, FeedPost } from "@/components/features/PostCard";
import { ReportDialog, useToast } from "@/components/features/TrustDialogs";
import { ProfileHeader } from "@/components/features/profile/ProfileHeader";
import { ProfileSidebar } from "@/components/features/profile/ProfileSidebar";
import { ProfilePostComposer } from "@/components/features/profile/ProfilePostComposer";

type Me = {
  id: number;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  intent?: string | null;
  gender?: string | null;
  dob?: string | null;
  city?: string | null;
  country?: string | null;
  timezone?: string | null;
  availableSlots?: string[];
  languages: { id: number; role: string; level?: string | null; language: { id?: number; code?: string; name: string } }[];
  interests: { id: number; topic: { name: string } }[];
  matchPreference?: { languageFocus?: string | null; levelDesired?: string | null } | null;
};

export default function MyProfilePage() {
  const t = useTranslations("profile");
  const tRoot = useTranslations();
  const [me, setMe] = React.useState<Me | null>(null);
  const [error, setError] = React.useState("");
  const [myPosts, setMyPosts] = React.useState<FeedPost[]>([]);
  const [reportTarget, setReportTarget] = React.useState<FeedPost | null>(null);
  const composerInputRef = React.useRef<HTMLTextAreaElement | null>(null);
  const { show: showToast, toast } = useToast();

  React.useEffect(() => {
    api<Me>("/users/me")
      .then((data) => {
        setMe(data);
        api<FeedPost[]>(`/community/feed?userId=${data.id}&targetUserId=${data.id}`)
          .then(setMyPosts)
          .catch(() => {});
      })
      .catch((err) => setError(err.message || t("loading_error")));
  }, [t]);

  const handleFocusComposer = () => {
    composerInputRef.current?.focus();
    composerInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  if (error) return <div className="p-8 text-center text-error">{error}</div>;
  if (!me)
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );

  return (
    <div className="w-full pb-24">
      {/* Profile Header (Full-width World Map Banner, Centered Avatar & Info) */}
      <ProfileHeader me={me} t={t} />

      {/* Grid Layout Container — Sidebar (Left) & Feed (Right) */}
      <div className="w-full max-w-6xl 2xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column — Sidebar (Trust signals, Bio, Languages, Availability, Interests) */}
          <div className="lg:col-span-5">
            <ProfileSidebar me={me} t={t} tRoot={tRoot} />
          </div>

          {/* Right Column — Posts Feed & Composer */}
          <div className="lg:col-span-7 space-y-6">
            {/* Post Creation Composer */}
            <ProfilePostComposer
              me={me}
              onPostCreated={(newPost) => setMyPosts((prev) => [newPost, ...prev])}
              showToast={showToast}
              textareaRef={composerInputRef}
            />

            {/* User Posts Feed */}
            <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <span>{t("posts_title")}</span>
                </span>
                <span className="text-xs text-muted font-normal">{t("posts_count", { count: myPosts.length })}</span>
              </h2>

              {myPosts.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-border rounded-2xl bg-surface-2/40">
                  <FileText className="w-10 h-10 text-muted mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-semibold text-foreground">{t("no_posts_me")}</p>
                  <p className="text-xs text-muted mt-1">{t("create_post_hint")}</p>
                  <Button
                    size="sm"
                    className="mt-4 rounded-xl cursor-pointer"
                    onClick={handleFocusComposer}
                  >
                    {t("create_post_btn")}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {myPosts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      currentUser={{ id: me.id, displayName: me.displayName }}
                      onPostUpdated={(updated) =>
                        setMyPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
                      }
                      onPostDeleted={(postId) =>
                        setMyPosts((prev) => prev.filter((p) => p.id !== postId))
                      }
                      onReportPost={(p) => setReportTarget(p)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {reportTarget && (
        <ReportDialog
          open
          onClose={() => setReportTarget(null)}
          targetId={reportTarget.user.id}
          targetName={`Bài viết của ${reportTarget.user.displayName}`}
          targetType="post"
          targetContentId={reportTarget.id}
          onDone={() => showToast(t("report_success"))}
        />
      )}
      {toast}
    </div>
  );
}
