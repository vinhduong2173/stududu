import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Step1GeneralFields } from "./Step1GeneralFields";
import { Step1TimingFields } from "./Step1TimingFields";

interface Step1BasicConfigProps {
  language: string;
  setLanguage: (val: string) => void;
  level: string;
  setLevel: (val: string) => void;
  topic: string;
  setTopic: (val: string) => void;
  title: string;
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
  topicsList: string[];
  onOpenTopicModal: () => void;
  onNext: () => void;
}

export function Step1BasicConfig({
  language,
  setLanguage,
  level,
  setLevel,
  topic,
  setTopic,
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
  onOpenTopicModal,
  onNext,
}: Step1BasicConfigProps) {
  const canProceed = Boolean(language && level && topic);

  return (
    <div className="space-y-6 rounded-2xl border border-border bg-surface p-6 shadow-xs md:p-8">
      <div>
        <h2 className="text-xl font-bold text-foreground">Bước 1 — Cấu hình bộ đề</h2>
        <p className="mt-1 text-sm text-muted">
          Điền các thông tin cơ bản về ngôn ngữ, cấp độ và chủ đề của bộ đề trắc nghiệm.
        </p>
      </div>

      {title && (
        <div className="flex items-center gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-xs text-primary">
          <span className="font-semibold uppercase tracking-wider text-muted">Tiêu đề tự động:</span>
          <span className="font-bold text-primary">{title}</span>
        </div>
      )}

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

      <div className="flex justify-end pt-4">
        <Button
          onClick={onNext}
          disabled={!canProceed}
          className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-xs disabled:opacity-50"
        >
          Tạo bộ đề →
        </Button>
      </div>
    </div>
  );
}
