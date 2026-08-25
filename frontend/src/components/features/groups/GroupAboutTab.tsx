"use client";

import * as React from "react";
import Link from "next/link";
import {
  Globe,
  Lock,
  Calendar,
  User,
  ShieldAlert,
  BookOpen,
  Sparkles,
  Award,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { GroupItem } from "@/components/features/GroupModals";

interface GroupAboutTabProps {
  group: GroupItem;
}

export function GroupAboutTab({ group }: GroupAboutTabProps) {
  const isPrivate = group.privacy === "private";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left 2 cols: Main About Description & Rules */}
      <div className="lg:col-span-2 space-y-6">
        {/* Main Description */}
        <div className="bg-surface rounded-3xl border border-border p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-foreground font-display flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <span>Giới thiệu về nhóm</span>
          </h2>

          <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap bg-surface-2/50 p-4 rounded-2xl border border-border/50">
            {group.description || "Nhóm chưa có phần mô tả chi tiết."}
          </div>
        </div>

        {/* Group Guidelines / Rules */}
        <div className="bg-surface rounded-3xl border border-border p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-foreground font-display flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <span>Quy tắc cộng đồng trong nhóm</span>
          </h2>

          <div className="space-y-3 text-xs text-foreground/80">
            <div className="p-3 rounded-2xl bg-surface-2/40 border border-border/40 space-y-1">
              <p className="font-bold text-foreground">1. Tôn trọng và văn minh</p>
              <p className="text-muted leading-relaxed">
                Luôn giữ thái độ tôn trọng, hỗ trợ các bạn cùng học và không phân biệt đối xử.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-surface-2/40 border border-border/40 space-y-1">
              <p className="font-bold text-foreground">2. Tập trung vào trao đổi ngôn ngữ</p>
              <p className="text-muted leading-relaxed">
                Chia sẻ các chủ đề học tập, luyện tập phát âm, đặt câu hỏi ngữ pháp hoặc từ vựng.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-surface-2/40 border border-border/40 space-y-1">
              <p className="font-bold text-foreground">3. Không spam hoặc quảng cáo trái phép</p>
              <p className="text-muted leading-relaxed">
                Mọi hành vi spam tin nhắn hoặc đăng bài quảng cáo thương mại sẽ bị loại khỏi nhóm.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right 1 col: Details & Metadata */}
      <div className="space-y-6">
        {/* Privacy & Visibility */}
        <div className="bg-surface rounded-3xl border border-border p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-foreground font-display">
            Quyền riêng tư & Hiển thị
          </h3>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
              {isPrivate ? <Lock className="w-4 h-4 text-rose-500" /> : <Globe className="w-4 h-4 text-primary" />}
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">
                {isPrivate ? "Nhóm Riêng tư" : "Nhóm Công khai"}
              </p>
              <p className="text-xs text-muted leading-relaxed mt-0.5">
                {isPrivate
                  ? "Chỉ thành viên mới có thể xem ai thuộc nhóm và xem những gì họ đăng."
                  : "Bất kỳ ai cũng có thể nhìn thấy mọi người trong nhóm và những gì họ đăng."}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 border-t border-border/60 pt-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Lịch sử nhóm</p>
              <p className="text-xs text-muted leading-relaxed mt-0.5">
                Thành lập vào ngày {new Date(group.createdAt).toLocaleDateString("vi-VN")}
              </p>
            </div>
          </div>
        </div>

        {/* Creator Info */}
        <div className="bg-surface rounded-3xl border border-border p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-foreground font-display">
            Người sáng lập nhóm
          </h3>

          <Link
            href={`/profile/${group.creator.id}`}
            className="flex items-center gap-3 p-3 rounded-2xl bg-surface-2/50 border border-border/50 hover:bg-surface-2 hover:border-border transition-all group"
          >
            <Avatar
              src={group.creator.avatarUrl ?? undefined}
              fallback={group.creator.displayName?.charAt(0) || "U"}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                {group.creator.displayName}
              </p>
              <p className="text-xs text-muted font-medium">Quản trị viên / Creator</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
