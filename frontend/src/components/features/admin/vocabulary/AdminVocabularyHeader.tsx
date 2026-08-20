"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { BookOpen, RefreshCw, Search } from "lucide-react";
import { AdminLanguage, SavedWordsResponse } from "@/hooks/useAdminVocabulary";
import { cn } from "@/lib/utils";

interface AdminVocabularyHeaderProps {
  data: SavedWordsResponse | null;
  languages: AdminLanguage[];
  loading: boolean;
  search: string;
  setSearch: (s: string) => void;
  selectedLanguageId: string;
  setSelectedLanguageId: (id: string) => void;
  setPage: (p: number) => void;
  onRefresh: () => void;
  onSearchSubmit: (e: React.FormEvent) => void;
}

export function AdminVocabularyHeader({
  data,
  languages,
  loading,
  search,
  setSearch,
  selectedLanguageId,
  setSelectedLanguageId,
  setPage,
  onRefresh,
  onSearchSubmit,
}: AdminVocabularyHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Từ vựng đã lưu
            </h1>
            {data && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                {data.total} từ trong thư viện
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted">
            Theo dõi các từ mới được người học lưu lại trong quá trình trò chuyện & học tập.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          className="self-start sm:self-auto gap-2"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> Làm mới
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface rounded-2xl border border-border/80 shadow-xs p-4 flex flex-col md:flex-row gap-3 justify-between items-center">
        <form onSubmit={onSearchSubmit} className="flex gap-2 w-full md:w-80">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <Input
              placeholder="Tìm theo từ hoặc định nghĩa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 text-sm"
            />
          </div>
          <Button type="submit" size="sm" variant="secondary" className="h-10 px-4 font-semibold">
            Tìm
          </Button>
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-semibold text-muted shrink-0">Ngôn ngữ:</span>
          <select
            value={selectedLanguageId}
            onChange={(e) => {
              setSelectedLanguageId(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-xl border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground outline-none focus:border-primary w-full md:w-48"
          >
            <option value="">Tất cả ngôn ngữ</option>
            {languages.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
