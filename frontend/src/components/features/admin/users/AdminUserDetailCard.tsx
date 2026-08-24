"use client";

import * as React from "react";
import { AdminUserProfileCard } from "./AdminUserProfileCard";
import { AdminUserLanguagesCard } from "./AdminUserLanguagesCard";
import { AdminUserInterestsCard } from "./AdminUserInterestsCard";

export type UserLanguageItem = {
  id: number;
  role: "native" | "fluent" | "learning";
  level?: string | null;
  language: {
    id?: number;
    code?: string;
    name: string;
    framework?: string | null;
  };
};

export type UserInterestItem = {
  id: number;
  topic: {
    id: number;
    name: string;
  };
};

export type UserDetail = {
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
  role: string;
  status: "active" | "suspended" | "deleted";
  suspendedUntil?: string | null;
  lastActive?: string | null;
  createdAt: string;
  languages: UserLanguageItem[];
  interests: UserInterestItem[];
  matchPreference?: {
    nativeFirst?: boolean;
    genderPreference?: string | null;
    sameCountry?: boolean;
  } | null;
  _count: {
    reportsReceived: number;
    reportsSent: number;
    savedWords?: number;
    vocabWords?: number;
    matchesAsMember?: number;
    matchesAsCandidate?: number;
  };
};

export function AdminUserDetailCard({ user }: { user: UserDetail }) {
  return (
    <div className="space-y-6">
      <AdminUserProfileCard user={user} />
      <AdminUserLanguagesCard languages={user.languages} />
      <AdminUserInterestsCard
        interests={user.interests}
        availableSlots={user.availableSlots}
        timezone={user.timezone}
      />
    </div>
  );
}
