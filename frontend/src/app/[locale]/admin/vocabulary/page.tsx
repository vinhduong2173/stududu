"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
import { useAdminVocabulary } from "@/hooks/useAdminVocabulary";
import { AdminVocabularyHeader } from "@/components/features/admin/vocabulary/AdminVocabularyHeader";
import { AdminVocabularyTable } from "@/components/features/admin/vocabulary/AdminVocabularyTable";
import { AdminVocabularyPagination } from "@/components/features/admin/vocabulary/AdminVocabularyPagination";

export default function AdminVocabularyPage() {
  const v = useAdminVocabulary();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <AdminVocabularyHeader
        data={v.data}
        languages={v.languages}
        loading={v.loading}
        search={v.search}
        setSearch={v.setSearch}
        selectedLanguageId={v.selectedLanguageId}
        setSelectedLanguageId={v.setSelectedLanguageId}
        setPage={v.setPage}
        onRefresh={() => v.fetchWords(v.page, v.search, v.selectedLanguageId)}
        onSearchSubmit={v.handleSearchSubmit}
      />

      {v.error && (
        <div className="flex items-center justify-between rounded-2xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{v.error}</span>
          </div>
          <button
            onClick={() => v.fetchWords(v.page, v.search, v.selectedLanguageId)}
            className="rounded-xl bg-rose-100 px-3 py-1 text-xs font-semibold hover:bg-rose-200 transition-colors"
          >
            Thử lại
          </button>
        </div>
      )}

      <AdminVocabularyTable data={v.data} loading={v.loading} onDelete={v.deleteWord} />

      {v.data && (
        <AdminVocabularyPagination
          data={v.data}
          page={v.page}
          setPage={v.setPage}
        />
      )}
    </div>
  );
}
