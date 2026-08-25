"use client";

import * as React from "react";
import { api } from "@/lib/api";

export type WordSaver = {
  user: {
    id: number;
    displayName: string;
    email: string;
    avatarUrl?: string | null;
  };
  createdAt: string;
  source: string;
  personalNote?: string | null;
};

export type SavedWordItem = {
  id: number;
  term: string;
  language: { id: number; code: string; name: string };
  definition?: string | null;
  partOfSpeech?: string | null;
  phonetic?: string | null;
  example?: string | null;
  saveCount: number;
  isPublic: boolean;
  createdAt: string;
  savedBy: WordSaver[];
};

export type SavedWordsResponse = {
  items: SavedWordItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type AdminLanguage = {
  id: number;
  code: string;
  name: string;
};

export function useAdminVocabulary() {
  const [data, setData] = React.useState<SavedWordsResponse | null>(null);
  const [languages, setLanguages] = React.useState<AdminLanguage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [selectedLanguageId, setSelectedLanguageId] = React.useState<string>("");

  const fetchWords = React.useCallback(async (p = 1, s = search, langId = selectedLanguageId) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(p));
      params.set("limit", "10");
      if (s.trim()) params.set("search", s.trim());
      if (langId) params.set("languageId", langId);

      const [res, langs] = await Promise.all([
        api<SavedWordsResponse>(`/admin/words?${params.toString()}`),
        languages.length === 0 ? api<AdminLanguage[]>("/admin/languages").catch(() => []) : Promise.resolve(languages),
      ]);

      setData(res);
      if (langs.length > 0) setLanguages(langs);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Không thể tải danh sách từ vựng.");
    } finally {
      setLoading(false);
    }
  }, [languages, search, selectedLanguageId]);

  React.useEffect(() => {
    fetchWords(page, search, selectedLanguageId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, selectedLanguageId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchWords(1, search, selectedLanguageId);
  };

  const deleteWord = async (id: number) => {
    try {
      await api(`/admin/words/${id}`, { method: "DELETE" });
      await fetchWords(page, search, selectedLanguageId);
      return true;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  return {
    data,
    languages,
    loading,
    error,
    page,
    setPage,
    search,
    setSearch,
    selectedLanguageId,
    setSelectedLanguageId,
    fetchWords,
    handleSearchSubmit,
    deleteWord,
  };
}
