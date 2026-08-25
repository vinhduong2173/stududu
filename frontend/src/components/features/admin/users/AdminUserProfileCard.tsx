"use client";

import * as React from "react";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { UserDetail } from "./AdminUserDetailCard";
import { Calendar, Globe, MapPin, Shield, Target, User, Clock } from "lucide-react";

export const STATUS_LABEL: Record<UserDetail["status"], { label: string; className: string }> = {
  active: { label: "Đang hoạt động", className: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" },
  suspended: { label: "Đang bị khóa", className: "bg-amber-500/10 text-amber-600 border border-amber-500/20" },
  deleted: { label: "Đã xóa", className: "bg-rose-500/10 text-rose-600 border border-rose-500/20" },
};

function calculateAge(dobStr?: string | null): string {
  if (!dobStr) return "";
  const dob = new Date(dobStr);
  const diff = Date.now() - dob.getTime();
  const ageDate = new Date(diff);
  const age = Math.abs(ageDate.getUTCFullYear() - 1970);
  return `${age} tuổi`;
}

export function AdminUserProfileCard({ user }: { user: UserDetail }) {
  const statusInfo = STATUS_LABEL[user.status] ?? STATUS_LABEL.active;
  const age = calculateAge(user.dob);

  return (
    <section className="rounded-2xl border border-border/80 bg-surface p-6 shadow-xs space-y-5">
      {/* Header Info */}
      <div className="flex items-start gap-4">
        <Avatar src={user.avatarUrl ?? undefined} fallback={user.displayName.charAt(0)} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-lg font-bold text-foreground truncate">{user.displayName}</p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase">
              {user.role}
            </span>
          </div>
          <p className="text-xs text-muted truncate">{user.email}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", statusInfo.className)}>
              {statusInfo.label}
              {user.status === "suspended" && user.suspendedUntil && ` đến ${new Date(user.suspendedUntil).toLocaleDateString("vi-VN")}`}
            </span>
          </div>
        </div>
      </div>

      {/* Demographics & Location Grid */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/60 text-xs">
        <div className="p-2.5 rounded-xl bg-muted/10 border border-border/40 space-y-1">
          <span className="text-muted flex items-center gap-1.5 font-semibold">
            <MapPin className="h-3.5 w-3.5 text-primary" /> Đến từ / Vị trí
          </span>
          <p className="font-bold text-foreground">
            {user.country || user.city ? [user.city, user.country].filter(Boolean).join(", ") : "Chưa cập nhật"}
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-muted/10 border border-border/40 space-y-1">
          <span className="text-muted flex items-center gap-1.5 font-semibold">
            <User className="h-3.5 w-3.5 text-primary" /> Giới tính & Tuổi
          </span>
          <p className="font-bold text-foreground">
            {[user.gender, age].filter(Boolean).join(" · ") || "Chưa cập nhật"}
          </p>
        </div>
      </div>

      {/* Learning Intent & Bio */}
      {user.intent && (
        <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-1 text-xs">
          <span className="font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
            <Target className="h-3.5 w-3.5" /> Mục tiêu học tập
          </span>
          <p className="text-foreground font-medium">{user.intent}</p>
        </div>
      )}

      {user.bio && (
        <div className="space-y-1 text-xs">
          <span className="font-bold text-muted uppercase tracking-wider text-[11px]">Giới thiệu bản thân</span>
          <p className="whitespace-pre-wrap text-foreground font-medium bg-muted/10 p-3 rounded-xl border border-border/40">{user.bio}</p>
        </div>
      )}

      {/* System & Activity Stats */}
      <dl className="grid grid-cols-2 gap-2 text-xs border-t border-border/60 pt-3">
        <div className="flex justify-between py-1 border-b border-border/40">
          <dt className="text-muted">Tham gia</dt>
          <dd className="font-bold text-foreground">{new Date(user.createdAt).toLocaleDateString("vi-VN")}</dd>
        </div>
        <div className="flex justify-between py-1 border-b border-border/40">
          <dt className="text-muted">Hoạt động gần nhất</dt>
          <dd className="font-bold text-foreground">{user.lastActive ? new Date(user.lastActive).toLocaleDateString("vi-VN") : "—"}</dd>
        </div>
        <div className="flex justify-between py-1">
          <dt className="text-muted">Bị báo cáo</dt>
          <dd className="font-bold text-rose-600">{user._count.reportsReceived} lần</dd>
        </div>
        <div className="flex justify-between py-1">
          <dt className="text-muted">Đã báo cáo</dt>
          <dd className="font-bold text-foreground">{user._count.reportsSent} lần</dd>
        </div>
      </dl>
    </section>
  );
}
