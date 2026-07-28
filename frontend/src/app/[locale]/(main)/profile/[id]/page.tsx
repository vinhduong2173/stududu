"use client";

import { useParams } from "next/navigation";
import { ProfileView } from "@/components/features/ProfileView";

export default function ProfilePage() {
  const params = useParams();
  const rawId = params.id;

  if (rawId === "me") {
    return <ProfileView isOwnProfile />;
  }

  const numericId = typeof rawId === "string" ? parseInt(rawId, 10) : 0;
  return <ProfileView userId={isNaN(numericId) || numericId <= 0 ? "me" : numericId} />;
}
