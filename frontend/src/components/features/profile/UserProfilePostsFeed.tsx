"use client";

import * as React from "react";
import { MessageSquare, FileText } from "lucide-react";
import { PostCard, FeedPost } from "@/components/features/PostCard";

interface UserProfilePostsFeedProps {
  userPosts: FeedPost[];
  setUserPosts: React.Dispatch<React.SetStateAction<FeedPost[]>>;
  currentUser: { id: number; displayName: string } | null;
  setReportTarget: (post: FeedPost | null) => void;
  userName: string;
  t: any;
}

export function UserProfilePostsFeed({
  userPosts,
  setUserPosts,
  currentUser,
  setReportTarget,
  userName,
  t,
}: UserProfilePostsFeedProps) {
  return (
    <div className="bg-surface rounded-3xl p-6 shadow-card border border-border">
      <h2 className="text-base sm:text-lg font-extrabold font-display text-foreground mb-4 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <span>{t("posts_title")}</span>
        </span>
        <span className="text-xs text-muted font-semibold bg-surface-2 px-2.5 py-0.5 rounded-full">
          {t("posts_count", { count: userPosts.length })}
        </span>
      </h2>

      {userPosts.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-2xl bg-surface-2/40 px-4">
          <FileText className="w-10 h-10 text-muted mx-auto mb-2 opacity-50" />
          <p className="text-xs sm:text-sm font-semibold text-foreground">
            {t("no_posts_other", { name: userName })}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {userPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={currentUser}
              onPostUpdated={(updated) =>
                setUserPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
              }
              onPostDeleted={(postId) =>
                setUserPosts((prev) => prev.filter((p) => p.id !== postId))
              }
              onReportPost={(p) => setReportTarget(p)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
