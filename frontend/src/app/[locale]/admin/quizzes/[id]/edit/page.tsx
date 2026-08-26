"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { useQuizEdit } from "@/hooks/useQuizEdit";
import { EditQuizHeader } from "@/components/features/admin/quizzes/EditQuizHeader";
import { EditQuizConfigForm } from "@/components/features/admin/quizzes/EditQuizConfigForm";
import { QuestionCardItem } from "@/components/features/admin/quizzes/QuestionCardItem";
import { AddTopicModal } from "@/components/features/admin/quizzes/AddTopicModal";

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default function AdminQuizEditPage({ params }: PageProps) {
  const resolvedParams = React.use(params);
  const edit = useQuizEdit(resolvedParams.id);

  if (edit.loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16 text-foreground">
      <EditQuizHeader
        title={edit.title}
        language={edit.language}
        level={edit.level}
        saving={edit.saving}
        onSave={edit.handleSave}
      />

      <main className="mx-auto mt-6 w-full max-w-4xl space-y-6 px-4 sm:px-6">
        {/* General Config with Language, Level, Topic, Timing */}
        <EditQuizConfigForm
          title={edit.title}
          setTitle={edit.setTitle}
          language={edit.language}
          setLanguage={edit.setLanguage}
          level={edit.level}
          setLevel={edit.setLevel}
          topic={edit.topic}
          setTopic={edit.setTopic}
          topicsList={edit.topicsList}
          onOpenTopicModal={() => edit.setShowTopicModal(true)}
          description={edit.description}
          setDescription={edit.setDescription}
          timePerQuestionSec={edit.timePerQuestionSec}
          setTimePerQuestionSec={edit.setTimePerQuestionSec}
          maxAttempts={edit.maxAttempts}
          setMaxAttempts={edit.setMaxAttempts}
          startsAt={edit.startsAt}
          setStartsAt={edit.setStartsAt}
          endsAt={edit.endsAt}
          setEndsAt={edit.setEndsAt}
        />

        {/* Questions Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground">
              Danh sách câu hỏi ({edit.rows.length} câu)
            </h2>
            <p className="text-xs text-muted">
              Chỉnh sửa trực tiếp nội dung câu hỏi và các đáp án. Bấm nút tròn để chọn đáp án đúng.
            </p>
          </div>
          <button
            type="button"
            onClick={edit.handleAddRow}
            className="flex items-center gap-1.5 rounded-xl bg-primary/10 px-3.5 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/20 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Thêm câu hỏi
          </button>
        </div>

        {/* Questions Cards List */}
        <div className="space-y-4">
          {edit.rows.map((row, index) => (
            <QuestionCardItem
              key={row.id || index}
              row={row}
              index={index}
              onUpdate={(updated) => edit.handleUpdateRow(index, updated)}
              onDelete={() => edit.handleDeleteRow(index)}
            />
          ))}
        </div>

        {/* Add question bottom button */}
        <button
          type="button"
          onClick={edit.handleAddRow}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 py-4 text-xs font-bold text-primary transition-colors hover:bg-primary/10 cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Thêm câu hỏi mới
        </button>
      </main>

      {/* Modal Add Topic */}
      {edit.showTopicModal && (
        <AddTopicModal
          newTopicName={edit.newTopicName}
          onChangeName={edit.setNewTopicName}
          onClose={() => edit.setShowTopicModal(false)}
          onAdd={edit.handleAddTopic}
        />
      )}
    </div>
  );
}
