"use client";

import * as React from "react";
import { MatchModal } from "@/components/features/MatchModal";
import { ReportDialog, BlockDialog } from "@/components/features/TrustDialogs";
import { EndorseModal } from "@/components/features/Endorsements";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
  OtherUserProfileHeader,
  OtherUserSidebar,
  UserProfilePostsFeed,
  ProfileFloatingActionBar,
} from "@/components/features/profile";

export default function ProfilePage() {
  const p = useUserProfile();

  if (p.loading) {
    return (
      <div className="flex min-h-[60vh] justify-center items-center p-12">
        <div className="animate-spin h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full" />
      </div>
    );
  }

  if (p.error || !p.user) {
    return (
      <div className="p-12 text-center text-rose-700 font-semibold text-sm">
        {p.error || p.t("user_not_found")}
      </div>
    );
  }

  return (
    <div className="w-full pb-28">
      {/* Dialogs */}
      <MatchModal
        isOpen={p.matchOpen}
        onClose={() => {
          p.setMatchOpen(false);
          p.router.push("/discover");
        }}
        partnerName={p.user.displayName}
        partnerAvatar={p.user.avatarUrl}
        conversationId={p.conversationId ?? undefined}
      />

      <EndorseModal
        open={p.endorseOpen}
        onClose={() => p.setEndorseOpen(false)}
        targetId={p.id}
        targetName={p.user.displayName}
        onDone={() => {
          p.setEndorseRefresh((v) => v + 1);
          p.showToast(p.t("endorse_success_toast"));
        }}
      />

      <ReportDialog
        open={p.reportOpen}
        onClose={() => p.setReportOpen(false)}
        targetId={p.id}
        targetName={p.user.displayName}
        onDone={() => p.showToast(p.t("report_success_toast"))}
      />

      <BlockDialog
        open={p.blockOpen}
        onClose={() => p.setBlockOpen(false)}
        targetId={p.id}
        targetName={p.user.displayName}
        onDone={() => {
          p.showToast(p.t("block_success_toast", { name: p.user.displayName }));
          p.router.push("/discover");
        }}
      />

      {p.reportTarget && (
        <ReportDialog
          open={!!p.reportTarget}
          onClose={() => p.setReportTarget(null)}
          targetId={p.reportTarget.id}
          targetName={p.reportTarget.user.displayName}
          onDone={() => p.showToast(p.t("report_success_toast"))}
        />
      )}

      {p.toast}

      {/* Header Banner & Centered Info */}
      <OtherUserProfileHeader
        user={p.user}
        liked={p.liked}
        conversationId={p.conversationId}
        menuOpen={p.menuOpen}
        setMenuOpen={p.setMenuOpen}
        setReportOpen={p.setReportOpen}
        setBlockOpen={p.setBlockOpen}
        setEndorseOpen={p.setEndorseOpen}
        handleLike={p.handleLike}
        router={p.router}
        t={p.t}
        tDisc={p.tDisc}
        tRoot={p.tRoot}
      />

      {/* Grid Layout Container */}
      <div className="w-full max-w-6xl 2xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column — Trust, Bio, Languages, Availability, Interests */}
          <div className="lg:col-span-5">
            <OtherUserSidebar
              user={p.user}
              conversationId={p.conversationId}
              endorseRefresh={p.endorseRefresh}
              setEndorseOpen={p.setEndorseOpen}
              t={p.t}
              tRoot={p.tRoot}
            />
          </div>

          {/* Right Column — Community Posts Feed */}
          <div className="lg:col-span-7 space-y-6">
            <UserProfilePostsFeed
              userPosts={p.userPosts}
              setUserPosts={p.setUserPosts}
              currentUser={p.currentUser}
              setReportTarget={p.setReportTarget}
              userName={p.user.displayName}
              t={p.t}
            />
          </div>
        </div>
      </div>

      {/* Bottom Floating Bar */}
      <ProfileFloatingActionBar
        liked={p.liked}
        conversationId={p.conversationId}
        isLikeHovered={p.isLikeHovered}
        setIsLikeHovered={p.setIsLikeHovered}
        handleLike={p.handleLike}
        handleUnlike={p.handleUnlike}
        router={p.router}
        t={p.t}
        tDisc={p.tDisc}
      />
    </div>
  );
}
