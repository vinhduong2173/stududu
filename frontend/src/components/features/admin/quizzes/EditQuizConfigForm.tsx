import * as React from "react";
import { Step1GeneralFields } from "./Step1GeneralFields";
import { Step1TimingFields } from "./Step1TimingFields";

interface EditQuizConfigFormProps {
  title: string;
  setTitle: (val: string) => void;
  language: string;
  setLanguage: (val: string) => void;
  level: string;
  setLevel: (val: string) => void;
  topic: string;
  setTopic: (val: string) => void;
  topicsList: string[];
  onOpenTopicModal: () => void;
  description: string;
  setDescription: (val: string) => void;
  timePerQuestionSec: number;
  setTimePerQuestionSec: (val: number) => void;
  maxAttempts: number;
  setMaxAttempts: (val: number) => void;
  startsAt: string;
  setStartsAt: (val: string) => void;
  endsAt: string;
  setEndsAt: (val: string) => void;
}

export function EditQuizConfigForm({
  title,
  setTitle,
  language,
  setLanguage,
  level,
  setLevel,
  topic,
  setTopic,
  topicsList,
  onOpenTopicModal,
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
}: EditQuizConfigFormProps) {
  return (
    <div className="space-y-5 rounded-2xl border border-border bg-surface p-6 shadow-xs md:p-8">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
          Cấu hình thông tin bộ đề
        </h2>
        <span className="text-xs font-semibold text-muted">
          {language} · {level} · {topic}
        </span>
      </div>

      {/* Tiêu đề bộ đề */}
      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase text-muted">
          Tiêu đề bộ đề <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nhập tiêu đề bộ đề..."
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Grid các trường tương tự Tạo đề */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Step1GeneralFields
          language={language}
          setLanguage={setLanguage}
          level={level}
          setLevel={setLevel}
          topic={topic}
          setTopic={setTopic}
          topicsList={topicsList}
          onOpenTopicModal={onOpenTopicModal}
        />

        <Step1TimingFields
          timePerQuestionSec={timePerQuestionSec}
          setTimePerQuestionSec={setTimePerQuestionSec}
          maxAttempts={maxAttempts}
          setMaxAttempts={setMaxAttempts}
          startsAt={startsAt}
          setStartsAt={setStartsAt}
          endsAt={endsAt}
          setEndsAt={setEndsAt}
          description={description}
          setDescription={setDescription}
        />
      </div>
    </div>
  );
}
