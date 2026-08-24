"use client";

import * as React from "react";
import { BookOpen, Globe2, Sparkles } from "lucide-react";
import { LanguageFlag, LevelBadge } from "@/lib/languages";
import { UserLanguageItem } from "./AdminUserDetailCard";
import { cn } from "@/lib/utils";

interface AdminUserLanguagesCardProps {
  languages: UserLanguageItem[];
}

export function AdminUserLanguagesCard({ languages = [] }: AdminUserLanguagesCardProps) {
  const nativeLangs = languages.filter((l) => l.role === "native");
  const fluentLangs = languages.filter((l) => l.role === "fluent");
  const learningLangs = languages.filter((l) => l.role === "learning");

  const renderGroup = (
    title: string,
    items: UserLanguageItem[],
    icon: React.ElementType,
    badgeColor: string,
    showLevel = false,
  ) => {
    if (items.length === 0) return null;
    const Icon = icon;

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 text-muted" />
          <span className={cn("text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border", badgeColor)}>
            {title} ({items.length})
          </span>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-muted/10 border border-border/40 text-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <LanguageFlag code={item.language.code} name={item.language.name} className="h-4 w-5 shrink-0 rounded-xs" />
                <span className="font-bold text-foreground truncate">{item.language.name}</span>
              </div>
              {showLevel && item.level && <LevelBadge level={item.level} />}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <section className="rounded-2xl border border-border/80 bg-surface p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
          <Globe2 className="h-4 w-4 text-primary" /> Ngôn ngữ trao đổi
        </h2>
        <span className="text-xs font-semibold text-muted">{languages.length} ngôn ngữ</span>
      </div>

      {languages.length === 0 ? (
        <p className="text-xs text-muted py-3 text-center">Người dùng chưa thêm ngôn ngữ nào.</p>
      ) : (
        <div className="space-y-4">
          {renderGroup("Bản ngữ", nativeLangs, Sparkles, "bg-emerald-500/10 text-emerald-600 border-emerald-500/20")}
          {renderGroup("Thành thạo", fluentLangs, Globe2, "bg-blue-500/10 text-blue-600 border-blue-500/20", true)}
          {renderGroup("Đang học", learningLangs, BookOpen, "bg-purple-500/10 text-purple-600 border-purple-500/20", true)}
        </div>
      )}
    </section>
  );
}
