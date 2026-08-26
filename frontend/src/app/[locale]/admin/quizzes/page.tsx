"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";
import { Plus } from "lucide-react";
import { useQuizzesList } from "@/hooks/useQuizzesList";
import { QuizzesStatsCards } from "@/components/features/admin/quizzes/QuizzesStatsCards";
import { QuizzesFilterBar } from "@/components/features/admin/quizzes/QuizzesFilterBar";
import { QuizzesTable } from "@/components/features/admin/quizzes/QuizzesTable";

export default function AdminQuizzesPage() {
  const {
    quizSets,
    filteredSets,
    loading,
    search,
    setSearch,
    selectedLang,
    setSelectedLang,
    selectedLevel,
    setSelectedLevel,
    deletingId,
    deleteSet,
  } = useQuizzesList();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Quản lý Bộ đề &amp; Quizzes
          </h1>
          <p className="mt-1 text-sm text-muted">
            Quản lý, tạo mới và xuất bản các bộ từ vựng, câu hỏi trắc nghiệm kiểm tra trình độ.
          </p>
        </div>
        <Link
          href="/admin/quizzes/create"
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-xs transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Tạo bộ đề mới
        </Link>
      </div>

      {/* Stats Cards */}
      <QuizzesStatsCards quizSets={quizSets} />

      {/* Filter & Search Bar */}
      <QuizzesFilterBar
        search={search}
        onSearchChange={setSearch}
        selectedLang={selectedLang}
        onLangChange={setSelectedLang}
        selectedLevel={selectedLevel}
        onLevelChange={setSelectedLevel}
      />

      {/* Quiz Sets Table */}
      <QuizzesTable
        sets={filteredSets}
        loading={loading}
        deletingId={deletingId}
        onDelete={deleteSet}
      />
    </div>
  );
}
