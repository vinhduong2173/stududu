"use client";

import * as React from "react";
import { useVocabulary } from "@/hooks/useVocabulary";
import { VocabularyHeader } from "@/components/features/vocabulary/VocabularyHeader";
import { VocabularyTabSwitcher } from "@/components/features/vocabulary/VocabularyTabSwitcher";
import { VocabularyQuizSection } from "@/components/features/vocabulary/VocabularyQuizSection";
import { VocabularyNotebookSection } from "@/components/features/vocabulary/VocabularyNotebookSection";

export default function VocabularyPage() {
  const v = useVocabulary();

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6 pb-16 space-y-6">
      {/* HEADER SECTION */}
      <VocabularyHeader
        t={v.t}
        totalCount={v.totalCount}
        masteredCount={v.masteredCount}
        learningCount={v.learningCount}
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
          incorrectWords={v.incorrectWords}
          handleRetryMissed={v.handleRetryMissed}
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
          undoItem={v.undoItem}
          handleUndoDelete={v.handleUndoDelete}
        />
      )}

      {v.toast}
    </div>
  );
}
