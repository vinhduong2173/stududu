"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { api } from "@/lib/api";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/features/TrustDialogs";
import type { FeedPost } from "@/components/features/PostCard";

export function useUserProfile() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("profile");
  const tDisc = useTranslations("discover");
  const tRoot = useTranslations();
  const id = typeof params.id === "string" ? parseInt(params.id) : 0;

  const [user, setUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [reportOpen, setReportOpen] = React.useState(false);
  const [blockOpen, setBlockOpen] = React.useState(false);
  const [matchOpen, setMatchOpen] = React.useState(false);
  const [endorseOpen, setEndorseOpen] = React.useState(false);
  const [endorseRefresh, setEndorseRefresh] = React.useState(0);
  const [liked, setLiked] = React.useState(false);
  const [conversationId, setConversationId] = React.useState<number | null>(null);
  const [isLikeHovered, setIsLikeHovered] = React.useState(false);
  const [userPosts, setUserPosts] = React.useState<FeedPost[]>([]);
  const [currentUser, setCurrentUser] = React.useState<{ id: number; displayName: string } | null>(null);
  const [reportTarget, setReportTarget] = React.useState<FeedPost | null>(null);
  const { show: showToast, toast } = useToast();

  React.useEffect(() => {
    if (id) fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const [data, relation, postsData, meData] = await Promise.all([
        api<any>(`/users/${id}`),
        api<{ liked: boolean; conversationId: number | null }>(`/matching/relation/${id}`),
        api<FeedPost[]>(`/community/feed?userId=${id}&targetUserId=${id}`).catch(() => []),
        api<any>(`/users/me`).catch(() => null),
      ]);
      setUser(data);
      setLiked(relation.liked);
      setConversationId(relation.conversationId);
      setUserPosts(postsData);
      if (meData) setCurrentUser({ id: meData.id, displayName: meData.displayName });
    } catch (err: any) {
      setError(err.message || t("loading_error_other"));
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      const result = await api<{ mutual: boolean; conversation: { id: number } | null }>(
        `/matching/like/${id}`,
        { method: "POST" },
      );
      setLiked(true);
      setConversationId(result.conversation?.id ?? null);
      if (result.mutual) {
        setMatchOpen(true);
      } else {
        showToast(t("like_success_toast", { name: user.displayName }));
      }
    } catch (err: any) {
      showToast(err.message || tDisc("error_generic") || "Error");
    }
  };

  const handleUnlike = async () => {
    try {
      await api(`/matching/like/${id}`, { method: "DELETE" });
      setLiked(false);
      setConversationId(null);
      showToast(tDisc("card_unliked_toast", { name: user.displayName }) || "Unliked");
    } catch (err: any) {
      showToast(err.message || "Failed to unlike");
    }
  };

  return {
    id,
    router,
    t,
    tDisc,
    tRoot,
    user,
    loading,
    error,
    menuOpen,
    setMenuOpen,
    reportOpen,
    setReportOpen,
    blockOpen,
    setBlockOpen,
    matchOpen,
    setMatchOpen,
    endorseOpen,
    setEndorseOpen,
    endorseRefresh,
    setEndorseRefresh,
    liked,
    conversationId,
    isLikeHovered,
    setIsLikeHovered,
    userPosts,
    setUserPosts,
    currentUser,
    reportTarget,
    setReportTarget,
    showToast,
    toast,
    handleLike,
    handleUnlike,
  };
}
