"use client";

import * as React from "react";
import { useRouter } from "@/i18n/routing";
import { api } from "@/lib/api";
import { VocabRow } from "@/hooks/useQuizCreateWizard";
import {
  LANGUAGE_LEVELS_MAP,
  getLangCode,
  translateTopicName,
  matchLanguageToDb,
} from "@/lib/quizLanguageLevels";

interface ApiQuestionItem {
  id: number;
  term?: string;
  prompt?: string;
  options?: string[];
  answerIndex?: number;
  explanation?: string;
}

interface ApiSetDetail {
  id: number;
  title: string;
  language?: { id?: number; code?: string; name: string };
  topic?: { id?: number; name: string };
  level?: string;
  description?: string;
  timePerQuestionSec?: number;
  maxAttempts?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  status?: string;
  questions?: ApiQuestionItem[];
}

interface LanguageItem {
  id: number;
  code?: string;
  name?: string;
}

interface TopicItem {
  id: number;
  name: string;
}

function normalizeLanguageName(rawName: string): string {
  const lower = (rawName || "").toLowerCase();
  if (lower.includes("anh") || lower.includes("en")) return "Tiếng Anh";
  if (lower.includes("nhật") || lower.includes("ja")) return "Tiếng Nhật";
  if (lower.includes("trung") || lower.includes("zh")) return "Tiếng Trung";
  if (lower.includes("hàn") || lower.includes("ko")) return "Tiếng Hàn";
  if (lower.includes("pháp") || lower.includes("fr")) return "Tiếng Pháp";
  if (lower.includes("đức") || lower.includes("de")) return "Tiếng Đức";
  if (lower.includes("tây ban nha") || lower.includes("es")) return "Tiếng Tây Ban Nha";
  return rawName || "Tiếng Anh";
}

export function useQuizEdit(setId: string) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  // Form State
  const [title, setTitle] = React.useState("");
  const [language, setLanguage] = React.useState("Tiếng Anh");
  const [level, setLevel] = React.useState("A1");
  const [topic, setTopic] = React.useState("Giáo dục");
  const [description, setDescription] = React.useState("");
  const [timePerQuestionSec, setTimePerQuestionSec] = React.useState<number>(15);
  const [maxAttempts, setMaxAttempts] = React.useState<number>(0);
  const [startsAt, setStartsAt] = React.useState<string>("");
  const [endsAt, setEndsAt] = React.useState<string>("");
  const [rows, setRows] = React.useState<VocabRow[]>([]);
  const [deletedIds, setDeletedIds] = React.useState<number[]>([]);

  // Topics state
  const [showTopicModal, setShowTopicModal] = React.useState(false);
  const [newTopicName, setNewTopicName] = React.useState("");
  const [topicsList, setTopicsList] = React.useState<string[]>([
    "Thời tiết",
    "Kinh tế",
    "Du lịch",
    "Công nghệ",
    "Giao tiếp hàng ngày",
    "Công sở",
    "Ẩm thực",
    "Phương tiện",
    "Gia đình",
    "Mua sắm",
    "Sức khỏe",
    "Giáo dục",
  ]);

  React.useEffect(() => {
    let ignore = false;
    async function loadSet() {
      setLoading(true);
      try {
        let setDetail: ApiSetDetail | null = null;
        if (!isNaN(Number(setId))) {
          try {
            setDetail = await api<ApiSetDetail>(`/admin/question-sets/${setId}`);
          } catch {
            // fallback
          }
        }

        if (!setDetail && typeof window !== "undefined") {
          const localStr = localStorage.getItem("stududu_custom_quiz_sets");
          if (localStr) {
            const list = JSON.parse(localStr);
            const found = list.find((item: { id: string; title?: string }) => 
              String(item.id) === String(setId)
            );
            if (found) {
              setDetail = {
                id: Number(found.id) || 1,
                title: found.title,
                language: { name: found.language },
                level: found.level,
                topic: { name: found.topic },
                description: found.description || "",
                timePerQuestionSec: found.timePerQuestionSec || 15,
                maxAttempts: found.maxAttempts || 0,
                startsAt: found.startsAt || null,
                endsAt: found.endsAt || null,
                questions: [],
              };
            }
          }
        }

        if (ignore || !setDetail) return;

        setTitle(setDetail.title || "Bộ đề");
        const normLang = normalizeLanguageName(setDetail.language?.name || "Tiếng Anh");
        setLanguage(normLang);
        setLevel(setDetail.level || "A1");
        
        const topName = setDetail.topic?.name || "Giáo dục";
        setTopic(topName);
        setTopicsList((prev) => (prev.includes(topName) ? prev : [...prev, topName]));

        setDescription(setDetail.description || "");
        setTimePerQuestionSec(setDetail.timePerQuestionSec || 15);
        setMaxAttempts(setDetail.maxAttempts || 0);

        if (setDetail.startsAt) {
          setStartsAt(setDetail.startsAt.split("T")[0]);
        }
        if (setDetail.endsAt) {
          setEndsAt(setDetail.endsAt.split("T")[0]);
        }

        if (setDetail.questions && setDetail.questions.length > 0) {
          const mappedRows: VocabRow[] = setDetail.questions.map((q, idx) => {
            const rawOpts = q.options && q.options.length > 0 ? q.options : ["A", "B", "C", "D"];
            const ansIdx = q.answerIndex ?? 0;
            
            // Pad to 4 options for internal state if fewer
            const opts = [...rawOpts];
            const hiddenOpts = [false, false, false, false];
            while (opts.length < 4) {
              opts.push(`Đáp án ${opts.length + 1}`);
            }
            for (let i = rawOpts.length; i < 4; i++) {
              hiddenOpts[i] = true;
            }

            return {
              id: q.id,
              word: q.term || q.prompt || `Câu hỏi #${idx + 1}`,
              phonetic: "",
              meaning: rawOpts[ansIdx] || "",
              type: "Danh từ",
              example: "",
              distractors: rawOpts.filter((_, i) => i !== ansIdx),
              options: opts,
              hiddenOptions: hiddenOpts,
              correctIndex: ansIdx,
              status: "valid",
            };
          });
          setRows(mappedRows);
        }
      } catch (err) {
        console.error("Error loading quiz set:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void loadSet();
    return () => {
      ignore = true;
    };
  }, [setId]);

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    const config = LANGUAGE_LEVELS_MAP[newLang];
    if (config?.levels[0]) {
      setLevel(config.levels[0].value);
    }
  };

  const handleAddTopic = () => {
    if (newTopicName.trim()) {
      const tName = newTopicName.trim();
      setTopicsList((prev) => [...prev, tName]);
      setTopic(tName);
      setNewTopicName("");
      setShowTopicModal(false);
    }
  };

  const handleUpdateRow = (index: number, updated: Partial<VocabRow>) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...updated } : row))
    );
  };

  const handleDeleteRow = (index: number) => {
    const target = rows[index];
    if (target && target.id > 0) {
      setDeletedIds((prev) => [...prev, target.id]);
    }
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: -Date.now(),
        word: "Câu hỏi mới",
        phonetic: "",
        meaning: "Đáp án 1",
        type: "Danh từ",
        example: "",
        distractors: ["Đáp án 2", "Đáp án 3", "Đáp án 4"],
        options: ["Đáp án 1", "Đáp án 2", "Đáp án 3", "Đáp án 4"],
        correctIndex: 0,
        status: "valid",
      },
    ]);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert("Vui lòng nhập tiêu đề bộ đề");
      return;
    }
    if (rows.length === 0) {
      alert("Bộ đề cần có ít nhất 1 câu hỏi");
      return;
    }

    setSaving(true);
    try {
      if (!isNaN(Number(setId))) {
        const [languages, topics] = await Promise.all([
          api<LanguageItem[]>("/admin/languages").catch(() => []),
          api<TopicItem[]>("/admin/vocab-topics").catch(() => []),
        ]);

        const langObj = matchLanguageToDb(language, languages);

        let topicObj = topics.find(
          (t) => t.name?.toLowerCase().includes((topic || "").toLowerCase())
        );
        if (!topicObj && topic) {
          try {
            topicObj = await api<TopicItem>("/admin/vocab-topics", {
              method: "POST",
              body: { name: topic },
            });
          } catch {
            topicObj = topics[0] || { id: 1, name: topic };
          }
        }

        const frameworkConfig = LANGUAGE_LEVELS_MAP[language];
        const framework = frameworkConfig?.framework || "CEFR";

        await api(`/admin/question-sets/${setId}`, {
          method: "PATCH",
          body: {
            languageId: langObj?.id,
            topicId: topicObj?.id,
            framework,
            level,
            title,
            description,
            timePerQuestionSec,
            maxAttempts: maxAttempts > 0 ? maxAttempts : null,
            startsAt: startsAt ? new Date(`${startsAt}T00:00:00`).toISOString() : null,
            endsAt: endsAt ? new Date(`${endsAt}T23:59:59`).toISOString() : null,
          },
        });

        // Delete removed questions
        for (const delId of deletedIds) {
          try {
            await api(`/admin/questions/${delId}`, { method: "DELETE" });
          } catch {
            // ignore
          }
        }

        // Update questions
        for (const r of rows) {
          const allOpts =
            r.options && r.options.length === 4
              ? r.options
              : [r.meaning, ...r.distractors.slice(0, 3)];
          const hidden = r.hiddenOptions || [false, false, false, false];
          const origCorrectIdx = r.correctIndex !== undefined ? r.correctIndex : 0;

          // Filter to only visible options
          const visibleOpts: string[] = [];
          let newAnswerIndex = 0;
          allOpts.forEach((opt, i) => {
            if (!hidden[i]) {
              if (i === origCorrectIdx) {
                newAnswerIndex = visibleOpts.length;
              }
              visibleOpts.push(opt);
            }
          });

          const promptText = r.word;

          if (r.id > 0) {
            try {
              await api(`/admin/questions/${r.id}`, {
                method: "PATCH",
                body: {
                  term: r.word,
                  prompt: promptText,
                  options: visibleOpts,
                  answerIndex: newAnswerIndex,
                  explanation: `Đáp án chính xác: "${visibleOpts[newAnswerIndex]}".`,
                },
              });
            } catch {
              // ignore
            }
          } else {
            try {
              await api(`/admin/question-sets/${setId}/questions`, {
                method: "POST",
                body: {
                  type: "vocabulary",
                  term: r.word,
                  passage: null,
                  prompt: promptText,
                  options: visibleOpts,
                  answerIndex: newAnswerIndex,
                  explanation: `Đáp án chính xác: "${visibleOpts[newAnswerIndex]}".`,
                },
              });
            } catch {
              // ignore
            }
          }
        }
      }

      // Update localStorage sync
      if (typeof window !== "undefined") {
        const localStr = localStorage.getItem("stududu_custom_quiz_sets");
        if (localStr) {
          try {
            const list = JSON.parse(localStr);
            const idx = list.findIndex((item: { id: string }) => String(item.id) === String(setId));
            if (idx >= 0) {
              list[idx] = {
                ...list[idx],
                title,
                language,
                level,
                topic,
                description,
                timePerQuestionSec,
                maxAttempts,
                startsAt,
                endsAt,
                wordCount: rows.length,
                updatedAt: new Date().toISOString().split("T")[0],
              };
              localStorage.setItem("stududu_custom_quiz_sets", JSON.stringify(list));
            }
          } catch {
            // ignore
          }
        }
      }

      alert("Lưu thay đổi thành công!");
      router.push("/admin/quizzes");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đã có lỗi xảy ra";
      alert(`Lỗi khi lưu bộ đề: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  return {
    loading,
    saving,
    title,
    setTitle,
    language,
    setLanguage: handleLanguageChange,
    level,
    setLevel,
    topic,
    setTopic,
    topicsList,
    showTopicModal,
    setShowTopicModal,
    newTopicName,
    setNewTopicName,
    handleAddTopic,
    description,
    setDescription,
    timePerQuestionSec,
    setTimePerQuestionSec,
    maxAttempts,
    setMaxAttempts,
    startsAt,
    setStartsAt,
    endsAt,
    setEndsAt,
    rows,
    handleUpdateRow,
    handleDeleteRow,
    handleAddRow,
    handleSave,
  };
}
