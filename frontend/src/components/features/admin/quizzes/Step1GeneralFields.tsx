import * as React from "react";
import { Plus } from "lucide-react";
import { LANGUAGE_LEVELS_MAP } from "@/lib/quizLanguageLevels";

interface Step1GeneralFieldsProps {
  language: string;
  setLanguage: (val: string) => void;
  level: string;
  setLevel: (val: string) => void;
  topic: string;
  setTopic: (val: string) => void;
  topicsList: string[];
  onOpenTopicModal: () => void;
}

export function Step1GeneralFields({
  language,
  setLanguage,
  level,
  setLevel,
  topic,
  setTopic,
  topicsList,
  onOpenTopicModal,
}: Step1GeneralFieldsProps) {
  const levelConfig = LANGUAGE_LEVELS_MAP[language];
  const availableLevels = levelConfig?.levels || [];
  const frameworkName = levelConfig?.framework ? `(${levelConfig.framework})` : "";

  return (
    <>
      {/* Ngôn ngữ */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-foreground">
          Ngôn ngữ học <span className="text-rose-500">*</span>
        </label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Chọn ngôn ngữ</option>
          <option value="Tiếng Anh">Tiếng Anh (English)</option>
          <option value="Tiếng Nhật">Tiếng Nhật (Japanese)</option>
          <option value="Tiếng Trung">Tiếng Trung (Chinese)</option>
          <option value="Tiếng Hàn">Tiếng Hàn (Korean)</option>
          <option value="Tiếng Pháp">Tiếng Pháp (French)</option>
          <option value="Tiếng Đức">Tiếng Đức (German)</option>
          <option value="Tiếng Tây Ban Nha">Tiếng Tây Ban Nha (Spanish)</option>
        </select>
      </div>

      {/* Trình độ theo ngôn ngữ */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-foreground">
          Trình độ {frameworkName} <span className="text-rose-500">*</span>
        </label>
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          disabled={!language}
          className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">
            {language ? "Chọn trình độ" : "Vui lòng chọn ngôn ngữ trước"}
          </option>
          {availableLevels.map((lvl) => (
            <option key={lvl.value} value={lvl.value}>
              {lvl.label}
            </option>
          ))}
        </select>
      </div>

      {/* Chủ đề */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
            Chủ đề từ vựng <span className="text-rose-500">*</span>
          </label>
          <button
            type="button"
            onClick={onOpenTopicModal}
            className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
          >
            <Plus className="h-3 w-3" /> Thêm chủ đề
          </button>
        </div>
        <select
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Chọn chủ đề</option>
          {topicsList.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
