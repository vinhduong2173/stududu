"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { BookOpen, Plus, Search, Filter, CheckCircle2, Clock, Layers, Sparkles } from "lucide-react";

type QuizSet = {
  id: string;
  title: string;
  language: string;
  level: string;
  topic: string;
  wordCount: number;
  status: "published" | "draft";
  updatedAt: string;
};

const INITIAL_QUIZ_SETS: QuizSet[] = [
  {
    id: "qs-1",
    title: "Thời tiết — B1",
    language: "Tiếng Anh",
    level: "B1",
    topic: "Thời tiết",
    wordCount: 45,
    status: "published",
    updatedAt: "2026-08-05",
  },
  {
    id: "qs-2",
    title: "Giao tiếp Công sở — B2",
    language: "Tiếng Anh",
    level: "B2",
    topic: "Công sở",
    wordCount: 60,
    status: "published",
    updatedAt: "2026-08-04",
  },
  {
    id: "qs-3",
    title: "Du lịch & Ẩm thực — N3",
    language: "Tiếng Nhật",
    level: "N3",
    topic: "Du lịch",
    wordCount: 30,
    status: "published",
    updatedAt: "2026-08-02",
  },
  {
    id: "qs-4",
    title: "Từ vựng Khách sạn — A2",
    language: "Tiếng Tây Ban Nha",
    level: "A2",
    topic: "Du lịch",
    wordCount: 25,
    status: "draft",
    updatedAt: "2026-08-01",
  },
];

export default function AdminQuizzesPage() {
  const [quizSets, setQuizSets] = React.useState<QuizSet[]>(INITIAL_QUIZ_SETS);
  const [search, setSearch] = React.useState("");
  const [selectedLang, setSelectedLang] = React.useState("ALL");
  const [selectedLevel, setSelectedLevel] = React.useState("ALL");

  React.useEffect(() => {
    // 1. Đọc dữ liệu từ localStorage
    const savedLocalStr = typeof window !== "undefined" ? localStorage.getItem("stududu_custom_quiz_sets") : null;
    let localSets: QuizSet[] = [];
    if (savedLocalStr) {
      try {
        localSets = JSON.parse(savedLocalStr);
      } catch {
        // ignore
      }
    }

    // 2. Fetch danh sách bộ đề từ API Backend
    import("@/lib/api")
      .then(({ api }) => api<any[]>("/admin/question-sets"))
      .then((data) => {
        if (Array.isArray(data)) {
          const apiSets: QuizSet[] = data.map((item) => ({
            id: String(item.id),
            title: item.title || "Bộ đề mới",
            language: item.language?.name || "Tiếng Anh",
            level: item.targetLevel || "A1",
            topic: item.topic?.name || "Từ vựng",
            wordCount: item._count?.questions || item.questions?.length || 20,
            status: item.publishedAt ? "published" : "draft",
            updatedAt: new Date(item.updatedAt || item.createdAt || Date.now()).toISOString().split("T")[0],
          }));

          const combined = [...localSets];
          for (const apiItem of apiSets) {
            if (!combined.some((c) => c.id === apiItem.id)) {
              combined.push(apiItem);
            }
          }
          setQuizSets(combined.length > 0 ? combined : INITIAL_QUIZ_SETS);
        } else if (localSets.length > 0) {
          setQuizSets([...localSets, ...INITIAL_QUIZ_SETS]);
        }
      })
      .catch(() => {
        if (localSets.length > 0) {
          setQuizSets([...localSets, ...INITIAL_QUIZ_SETS]);
        }
      });
  }, []);

  const filteredSets = quizSets.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || item.topic.toLowerCase().includes(search.toLowerCase());
    const matchesLang = selectedLang === "ALL" || item.language === selectedLang;
    const matchesLevel = selectedLevel === "ALL" || item.level === selectedLevel;
    return matchesSearch && matchesLang && matchesLevel;
  });

  const totalWords = quizSets.reduce((acc, curr) => acc + curr.wordCount, 0);
  const publishedCount = quizSets.filter((s) => s.status === "published").length;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface border border-border/80 rounded-2xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <Layers className="h-6 w-6" />
            </span>
            <h1 className="text-2xl font-bold text-foreground">Quản lý Bộ đề</h1>
          </div>
          <p className="text-sm text-muted mt-1">
            Soạn thảo, quản lý dữ liệu từ vựng và thiết lập thử thách trắc nghiệm tương tác cho học viên.
          </p>
        </div>

        <Link href="/admin/quizzes/create">
          <Button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 py-2.5 rounded-xl shadow-sm">
            <Plus className="h-4 w-4" />
            Tạo bộ đề mới
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface rounded-2xl border border-border/70 p-5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Tổng số bộ đề</p>
            <p className="text-2xl font-extrabold text-foreground mt-1">{quizSets.length}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
            <BookOpen className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-surface rounded-2xl border border-border/70 p-5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Đã xuất bản</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">{publishedCount}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-surface rounded-2xl border border-border/70 p-5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Tổng từ vựng & Quiz</p>
            <p className="text-2xl font-extrabold text-indigo-600 mt-1">{totalWords} từ</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-surface rounded-2xl border border-border p-4 flex flex-col md:flex-row gap-3 items-center justify-between shadow-2xs">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="Tìm theo tên bộ đề, chủ đề..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
          <Filter className="h-4 w-4 text-muted hidden sm:block" />
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            className="px-3 py-2 text-sm bg-background border border-border rounded-xl text-foreground focus:outline-none"
          >
            <option value="ALL">Tất cả Ngôn ngữ</option>
            <option value="Tiếng Anh">Tiếng Anh</option>
            <option value="Tiếng Nhật">Tiếng Nhật</option>
            <option value="Tiếng Tây Ban Nha">Tiếng Tây Ban Nha</option>
          </select>

          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="px-3 py-2 text-sm bg-background border border-border rounded-xl text-foreground focus:outline-none"
          >
            <option value="ALL">Tất cả Trình độ</option>
            <option value="A1">A1</option>
            <option value="A2">A2</option>
            <option value="B1">B1</option>
            <option value="B2">B2</option>
            <option value="N3">N3</option>
          </select>
        </div>
      </div>

      {/* Quiz Sets Table */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-foreground">
            <thead className="bg-muted/10 text-xs font-semibold text-muted uppercase tracking-wider border-b border-border">
              <tr>
                <th className="px-6 py-4">Tên bộ đề</th>
                <th className="px-6 py-4">Ngôn ngữ</th>
                <th className="px-6 py-4">Trình độ</th>
                <th className="px-6 py-4">Số từ / Quiz</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredSets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-muted">
                    Không tìm thấy bộ đề phù hợp.
                  </td>
                </tr>
              ) : (
                filteredSets.map((qs) => (
                  <tr key={qs.id} className="hover:bg-muted/5 transition-colors">
                    <td className="px-6 py-4 font-semibold text-foreground">
                      <div className="flex items-center gap-2.5">
                        <span className="p-2 rounded-lg bg-primary/10 text-primary">
                          <BookOpen className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="font-semibold text-foreground">{qs.title}</p>
                          <p className="text-xs text-muted">Chủ đề: {qs.topic}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium">{qs.language}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-muted/20 text-muted">
                        {qs.level}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-indigo-600">{qs.wordCount} từ</td>
                    <td className="px-6 py-4">
                      {qs.status === "published" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Đã xuất bản
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          <Clock className="h-3.5 w-3.5" />
                          Bản nháp
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/quizzes/create?id=${qs.id}`}
                          className="px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors border border-primary/20"
                        >
                          Chỉnh sửa
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
