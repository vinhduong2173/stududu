"use client";

import * as React from "react";
import { useQuizCreateWizard } from "@/hooks/useQuizCreateWizard";
import { QuizWizardHeader } from "@/components/features/admin/quizzes/QuizWizardHeader";
import { QuizWizardStepper } from "@/components/features/admin/quizzes/QuizWizardStepper";
import { Step1BasicConfig } from "@/components/features/admin/quizzes/Step1BasicConfig";
import { Step2UploadAndTemplate } from "@/components/features/admin/quizzes/Step2UploadAndTemplate";
import { Step3DataPreviewTable } from "@/components/features/admin/quizzes/Step3DataPreviewTable";
import { Step4PublishSummary } from "@/components/features/admin/quizzes/Step4PublishSummary";
import { AddTopicModal } from "@/components/features/admin/quizzes/AddTopicModal";

export default function AdminQuizCreatePage() {
  const wizard = useQuizCreateWizard();

  return (
    <div className="flex min-h-screen flex-col bg-background pb-16 text-foreground">
      {/* Top Header */}
      <QuizWizardHeader title={wizard.title || "Bộ đề mới"} />

      {/* Stepper Bar (4 Steps) */}
      <QuizWizardStepper
        currentStep={wizard.currentStep}
        onStepClick={wizard.setCurrentStep}
      />

      {/* Main Step Content */}
      <main className="mx-auto mt-6 w-full max-w-4xl px-4 sm:px-6">
        {wizard.currentStep === 1 && (
          <Step1BasicConfig
            language={wizard.language}
            setLanguage={wizard.setLanguage}
            level={wizard.level}
            setLevel={wizard.setLevel}
            topic={wizard.topic}
            setTopic={wizard.setTopic}
            title={wizard.title}
            description={wizard.description}
            setDescription={wizard.setDescription}
            timePerQuestionSec={wizard.timePerQuestionSec}
            setTimePerQuestionSec={wizard.setTimePerQuestionSec}
            maxAttempts={wizard.maxAttempts}
            setMaxAttempts={wizard.setMaxAttempts}
            startsAt={wizard.startsAt}
            setStartsAt={wizard.setStartsAt}
            endsAt={wizard.endsAt}
            setEndsAt={wizard.setEndsAt}
            topicsList={wizard.topicsList}
            onOpenTopicModal={() => wizard.setShowTopicModal(true)}
            onNext={wizard.handleNextStep}
          />
        )}

        {wizard.currentStep === 2 && (
          <Step2UploadAndTemplate
            uploadedFile={wizard.uploadedFile}
            rowsCount={wizard.rows.length}
            onFileUpload={wizard.handleFileUpload}
            onRemoveFile={wizard.handleRemoveFile}
            onAddRow={wizard.handleAddRow}
            onPrev={wizard.handlePrevStep}
            onNext={wizard.handleNextStep}
          />
        )}

        {wizard.currentStep === 3 && (
          <Step3DataPreviewTable
            rows={wizard.rows}
            uploadedFileName={wizard.uploadedFile?.name}
            onUpdateRow={wizard.handleUpdateRow}
            onDeleteRow={wizard.handleDeleteRow}
            onAddRow={wizard.handleAddRow}
            onPrev={wizard.handlePrevStep}
            onNext={wizard.handleNextStep}
          />
        )}

        {wizard.currentStep === 4 && (
          <Step4PublishSummary
            title={wizard.title}
            language={wizard.language}
            level={wizard.level}
            topic={wizard.topic}
            rowsCount={wizard.rows.length}
            isSubmitting={wizard.isSubmitting}
            onPrev={wizard.handlePrevStep}
            onPublish={wizard.handlePublish}
          />
        )}
      </main>

      {/* Add Topic Modal */}
      {wizard.showTopicModal && (
        <AddTopicModal
          newTopicName={wizard.newTopicName}
          onChangeName={wizard.setNewTopicName}
          onClose={() => wizard.setShowTopicModal(false)}
          onAdd={wizard.handleAddTopic}
        />
      )}
    </div>
  );
}
