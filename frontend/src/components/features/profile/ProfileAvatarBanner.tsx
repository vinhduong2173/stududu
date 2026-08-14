"use client";

import * as React from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Camera, Trash2 } from "lucide-react";

interface ProfileAvatarBannerProps {
  t: any;
  displayName: string;
  avatarUrl: string;
  setAvatarUrl: (url: string) => void;
  avatarInputRef: React.RefObject<HTMLInputElement | null>;
  onPickAvatar: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ProfileAvatarBanner({
  t,
  displayName,
  avatarUrl,
  setAvatarUrl,
  avatarInputRef,
  onPickAvatar,
}: ProfileAvatarBannerProps) {
  return (
    <div className="bg-surface rounded-3xl border border-border shadow-sm overflow-hidden mb-6">
      <div className="sd-cover relative h-32 md:h-44">
        <div className="pointer-events-none absolute -top-16 -right-10 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-8 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
      </div>
      <div className="px-6 pb-6">
        <div className="flex items-end gap-4 -mt-12">
          <div className="relative inline-block">
            <div className="rounded-full ring-4 ring-surface bg-surface">
              <Avatar
                src={avatarUrl || undefined}
                fallback={displayName.charAt(0) || "?"}
                size="xl"
                className="shadow-lg"
              />
            </div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-md ring-2 ring-surface hover:bg-primary-hover transition-colors"
              title={t("change_avatar")}
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <div className="pb-1 min-w-0">
            <h2 className="font-display text-xl font-extrabold tracking-tight text-foreground truncate">
              {displayName || t("your_name")}
            </h2>
            <p className="text-sm text-muted">{t("this_is_you")}</p>
          </div>
          {avatarUrl && (
            <button
              type="button"
              onClick={() => setAvatarUrl("")}
              className="ml-auto pb-1 flex items-center gap-1 text-xs font-medium text-muted hover:text-error transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" /> {t("delete_image")}
            </button>
          )}
        </div>
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onPickAvatar}
        />
      </div>
    </div>
  );
}
