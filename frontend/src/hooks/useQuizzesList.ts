"use client";

import * as React from "react";
import { api } from "@/lib/api";
import { getDisplayLanguageName } from "@/lib/quizLanguageLevels";

export type QuizSetItem = {
  id: string;
  title: string;
  language: string;
  level: string;
  topic: string;
  wordCount: number;
  status: "published" | "draft";
  updatedAt: string;
};

interface ApiQuestionSetItem {
  id: number | string;
  title?: string;
  language?: { name: string };
  level?: string;
  targetLevel?: string;
  topic?: { name: string };
  questionCount?: number;
  _count?: { questions: number };
  questions?: unknown[];
  status?: string;
  publishedAt?: string;
  updatedAt?: string;
  createdAt?: string;
}

export function useQuizzesList() {
  const [quizSets, setQuizSets] = React.useState<QuizSetItem[]>([]);
  const [search, setSearch] = React.useState("");
  const [selectedLang, setSelectedLang] = React.useState("ALL");
  const [selectedLevel, setSelectedLevel] = React.useState("ALL");
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const fetchSets = React.useCallback(async () => {
    setLoading(true);
    let localSets: QuizSetItem[] = [];
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("stududu_custom_quiz_sets");
      if (saved) {
        try {
          localSets = JSON.parse(saved);
        } catch {
          // ignore error
        }
      }
    }

    try {
      const data = await api<ApiQuestionSetItem[]>("/admin/question-sets");
      const mapped: QuizSetItem[] = (data || []).map((item) => ({
        id: String(item.id),
        title: item.title || "Bộ đề mới",
        language: getDisplayLanguageName(item.language?.name),
        level: item.level || item.targetLevel || "A1",
        topic: item.topic?.name || "Từ vựng",
        wordCount: item.questionCount || item._count?.questions || item.questions?.length || 20,
        status: item.status === "published" || item.publishedAt ? "published" : "draft",
        updatedAt: new Date(item.updatedAt || item.createdAt || Date.now()).toISOString().split("T")[0],
      }));

      const combined = [...mapped];
      for (const loc of localSets) {
        if (!combined.some((c) => c.id === loc.id)) {
          combined.push(loc);
        }
      }
      setQuizSets(combined);
    } catch {
      setQuizSets(localSets);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let ignore = false;
    async function loadData() {
      let localSets: QuizSetItem[] = [];
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("stududu_custom_quiz_sets");
        if (saved) {
          try {
            localSets = JSON.parse(saved);
          } catch {
            // ignore error
          }
        }
      }

      try {
        const data = await api<ApiQuestionSetItem[]>("/admin/question-sets");
        if (ignore) return;
        const mapped: QuizSetItem[] = (data || []).map((item) => ({
          id: String(item.id),
          title: item.title || "Bộ đề mới",
          language: getDisplayLanguageName(item.language?.name),
          level: item.level || item.targetLevel || "A1",
          topic: item.topic?.name || "Từ vựng",
          wordCount: item.questionCount || item._count?.questions || item.questions?.length || 20,
          status: item.status === "published" || item.publishedAt ? "published" : "draft",
          updatedAt: new Date(item.updatedAt || item.createdAt || Date.now()).toISOString().split("T")[0],
        }));

        const combined = [...mapped];
        for (const loc of localSets) {
          if (!combined.some((c) => c.id === loc.id)) {
            combined.push(loc);
          }
        }
        setQuizSets(combined);
      } catch {
        if (!ignore) setQuizSets(localSets);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void loadData();
    return () => {
      ignore = true;
    };
  }, []);

  const deleteSet = async (id: string, title: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bộ đề "${title}" không?`)) return;
    setDeletingId(id);
    try {
      if (!isNaN(Number(id))) {
        await api(`/admin/question-sets/${id}`, { method: "DELETE" });
      }
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("stududu_custom_quiz_sets");
        if (saved) {
          try {
            const parsed: QuizSetItem[] = JSON.parse(saved);
            localStorage.setItem("stududu_custom_quiz_sets", JSON.stringify(parsed.filter((s) => s.id !== id)));
          } catch {
            // ignore
          }
        }
      }
      setQuizSets((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Không xóa được bộ đề");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredSets = React.useMemo(() => {
    return quizSets.filter((qs) => {
      const matchSearch =
        qs.title.toLowerCase().includes(search.toLowerCase()) ||
        qs.topic.toLowerCase().includes(search.toLowerCase());
      const matchLang = selectedLang === "ALL" || qs.language.toLowerCase().includes(selectedLang.toLowerCase());
      const matchLevel = selectedLevel === "ALL" || qs.level === selectedLevel;
      return matchSearch && matchLang && matchLevel;
    });
  }, [quizSets, search, selectedLang, selectedLevel]);

  return {
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
    refresh: fetchSets,
  };
}
