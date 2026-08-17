"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useVocabulary } from "@/hooks/useVocabulary";
import { VocabularyHeader } from "@/components/features/vocabulary/VocabularyHeader";
import { VocabularyTabSwitcher } from "@/components/features/vocabulary/VocabularyTabSwitcher";
import { VocabularyQuizSection } from "@/components/features/vocabulary/VocabularyQuizSection";
import { VocabularyNotebookSection } from "@/components/features/vocabulary/VocabularyNotebookSection";
import { CreateUserSetModal } from "@/components/features/CreateUserSetModal";

export default function VocabularyPage() {
  const v = useVocabulary();
  const router = useRouter();
  const [showAiModal, setShowAiModal] = React.useState(false);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-8 pb-24 space-y-6">
      {/* HEADER SECTION */}
      <VocabularyHeader
        t={v.t}
        totalCount={v.totalCount}
        masteredCount={v.masteredCount}
        learningCount={v.learningCount}
        onOpenAiModal={() => setShowAiModal(true)}
      />

      {/* MAIN TABS SWITCHER */}
      <VocabularyTabSwitcher
        t={v.t}
        activeTab={v.activeTab}
        setActiveTab={v.setActiveTab}
        totalCount={v.totalCount}
      />

      {/* TAB 1: LÀM QUIZ ÔN TẬP */}
      {v.activeTab === "quiz" && (
        <VocabularyQuizSection
          t={v.t}
          reviewMode={v.reviewMode}
          handleModeChange={v.handleModeChange}
          learningCount={v.learningCount}
          totalCount={v.totalCount}
          loading={v.loading}
          quizCompleted={v.quizCompleted}
          rankInfo={v.rankInfo}
          totalQuestions={v.totalQuestions}
          earnedPoints={v.earnedPoints}
          maxPossiblePoints={v.maxPossiblePoints}
          score={v.score}
          accuracyPercent={v.accuracyPercent}
          handleRestartQuiz={v.handleRestartQuiz}
          setActiveTab={v.setActiveTab}
          deck={v.deck}
          activeQuizWord={v.activeQuizWord}
          currentIndex={v.currentIndex}
          streak={v.streak}
          getDefinitionForTargetLang={v.getDefinitionForTargetLang}
          quizOptions={v.quizOptions}
          selectedOption={v.selectedOption}
          isAnswered={v.isAnswered}
          handleSelectOption={v.handleSelectOption}
          handleNextQuestion={v.handleNextQuestion}
        />
      )}

      {/* TAB 2: SỔ TỪ VỰNG */}
      {v.activeTab === "notebook" && (
        <VocabularyNotebookSection
          t={v.t}
          filteredWords={v.filteredWords}
          listFilter={v.listFilter}
          setListFilter={v.setListFilter}
          search={v.search}
          setSearch={v.setSearch}
          selectedWordId={v.selectedWordId}
          getDefinitionForTargetLang={v.getDefinitionForTargetLang}
          handleDeleteWord={v.handleDeleteWord}
        />
      )}

      {showAiModal && (
        <CreateUserSetModal
          onClose={() => setShowAiModal(false)}
          onCreated={(newSetId) => {
            setShowAiModal(false);
            router.push(`/quiz/${newSetId}`);
          }}
        />
      )}

      {v.toast}
    </div>
  );
}
