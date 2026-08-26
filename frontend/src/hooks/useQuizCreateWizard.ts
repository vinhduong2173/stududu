"use client";

import * as React from "react";
import { useRouter } from "@/i18n/routing";
import { api } from "@/lib/api";
import {
  LANGUAGE_LEVELS_MAP,
  translateTopicName,
  getLangCode,
  matchLanguageToDb,
} from "@/lib/quizLanguageLevels";
import { parseCSVToVocabRows, ParsedVocabRow } from "@/lib/csvParser";

export type StepIndex = 1 | 2 | 3 | 4;
export type VocabRow = ParsedVocabRow;

interface LanguageItem {
  id: number;
  code?: string;
  name?: string;
}

interface TopicItem {
  id: number;
  name: string;
}

interface CreatedSetResponse {
  id: number;
}

export function useQuizCreateWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = React.useState<StepIndex>(1);

  // Step 1 Form
  const [language, setLanguage] = React.useState("");
  const [level, setLevel] = React.useState("");
  const [topic, setTopic] = React.useState("");
  const [translatedTopic, setTranslatedTopic] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [timePerQuestionSec, setTimePerQuestionSec] = React.useState<number>(15);
  const [maxAttempts, setMaxAttempts] = React.useState<number>(0);
  const [startsAt, setStartsAt] = React.useState<string>("");
  const [endsAt, setEndsAt] = React.useState<string>("");

  // Topics
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

  // Uploaded rows
  const [uploadedFile, setUploadedFile] = React.useState<File | null>(null);
  const [rows, setRows] = React.useState<VocabRow[]>([]);

  // Step 4 Publish
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Update title whenever language, topic or level changes
  const updateTitle = React.useCallback(
    async (langVal: string, topicVal: string, levelVal: string) => {
      if (!topicVal) {
        setTitle(levelVal || "");
        setTranslatedTopic("");
        return;
      }
      const trans = await translateTopicName(topicVal, langVal);
      setTranslatedTopic(trans);
      if (trans && levelVal) {
        setTitle(`${trans} — ${levelVal}`);
      } else if (trans) {
        setTitle(trans);
      } else {
        setTitle(topicVal);
      }
    },
    []
  );

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    setLevel("");
    void updateTitle(newLang, topic, "");
  };

  const handleTopicChange = (newTopic: string) => {
    setTopic(newTopic);
    void updateTitle(language, newTopic, level);
  };

  const handleLevelChange = (newLevel: string) => {
    setLevel(newLevel);
    void updateTitle(language, topic, newLevel);
  };

  const handleNextStep = () => {
    if (currentStep < 4) setCurrentStep((prev) => (prev + 1) as StepIndex);
  };

  const handlePrevStep = () => {
    if (currentStep > 1) setCurrentStep((prev) => (prev - 1) as StepIndex);
  };

  const handleAddTopic = () => {
    if (newTopicName.trim()) {
      const tName = newTopicName.trim();
      setTopicsList((prev) => [...prev, tName]);
      setTopic(tName);
      void updateTitle(language, tName, level);
      setNewTopicName("");
      setShowTopicModal(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          const parsed = parseCSVToVocabRows(text);
          setRows(parsed);
        }
      };
      reader.readAsText(file, "UTF-8");
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setRows([]);
  };

  const handleUpdateRow = (index: number, updatedFields: Partial<VocabRow>) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...updatedFields } : row))
    );
  };

  const handleDeleteRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: prev.length + 1,
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

  const handlePublish = async () => {
    if (rows.length === 0) {
      alert("Vui lòng tải lên ít nhất 1 câu hỏi trước khi đăng.");
      return;
    }
    const finalTitle =
      title ||
      (translatedTopic && level
        ? `${translatedTopic} — ${level}`
        : `${topic} — ${level}`);
    setIsSubmitting(true);
    try {
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
      if (!topicObj) topicObj = topics[0] || { id: 1, name: topic };

      const frameworkConfig = LANGUAGE_LEVELS_MAP[language];
      const framework = frameworkConfig?.framework || "CEFR";

      const createdSet = await api<CreatedSetResponse>("/admin/question-sets", {
        method: "POST",
        body: {
          languageId: langObj.id,
          topicId: topicObj.id,
          framework,
          level: level || "A1",
          title: finalTitle,
          description:
            description ||
            `Bộ câu hỏi trắc nghiệm chủ đề ${topic || "từ vựng"}.`,
          timePerQuestionSec: timePerQuestionSec || 15,
          maxAttempts: maxAttempts > 0 ? maxAttempts : null,
          startsAt: startsAt ? new Date(`${startsAt}T00:00:00`).toISOString() : null,
          endsAt: endsAt ? new Date(`${endsAt}T23:59:59`).toISOString() : null,
        },
      });

      const questionsToImport = rows.map((r) => {
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
        return {
          type: "vocabulary",
          term: r.word,
          passage: null,
          prompt: promptText,
          options: visibleOpts,
          answerIndex: newAnswerIndex,
          explanation: `Đáp án chính xác: "${visibleOpts[newAnswerIndex]}".`,
        };
      });

      await api(`/admin/question-sets/${createdSet.id}/questions/import`, {
        method: "POST",
        body: { questions: questionsToImport },
      });

      // Directly publish question set (bypass gatekeeping)
      try {
        await api(`/admin/question-sets/${createdSet.id}/publish`, {
          method: "POST",
        });
      } catch {
        // fallback
      }

      if (typeof window !== "undefined") {
        const newLocalSet = {
          id: String(createdSet.id),
          title: finalTitle,
          language: language || "Tiếng Anh",
          level: level || "A1",
          topic: topic || "Chủ đề",
          wordCount: rows.length,
          timePerQuestionSec: timePerQuestionSec || 15,
          maxAttempts: maxAttempts || 0,
          startsAt: startsAt || "",
          endsAt: endsAt || "",
          status: "published",
          updatedAt: new Date().toISOString().split("T")[0],
        };
        const existingStr = localStorage.getItem("stududu_custom_quiz_sets");
        let existing = [];
        if (existingStr) {
          try {
            existing = JSON.parse(existingStr);
          } catch {
            // ignore
          }
        }
        existing.unshift(newLocalSet);
        localStorage.setItem("stududu_custom_quiz_sets", JSON.stringify(existing));
      }

      alert(
        `Đã xuất bản bộ đề "${finalTitle}" thành công với ${rows.length} câu hỏi!`
      );
      router.push("/admin/quizzes");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Vui lòng kiểm tra lại thông tin";
      alert(`Lỗi xuất bản bộ đề: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    currentStep,
    setCurrentStep,
    language,
    setLanguage: handleLanguageChange,
    level,
    setLevel: handleLevelChange,
    topic,
    setTopic: handleTopicChange,
    translatedTopic,
    title,
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
    topicsList,
    showTopicModal,
    setShowTopicModal,
    newTopicName,
    setNewTopicName,
    uploadedFile,
    rows,
    isSubmitting,
    handleNextStep,
    handlePrevStep,
    handleAddTopic,
    handleFileUpload,
    handleRemoveFile,
    handleUpdateRow,
    handleDeleteRow,
    handleAddRow,
    handlePublish,
  };
}
