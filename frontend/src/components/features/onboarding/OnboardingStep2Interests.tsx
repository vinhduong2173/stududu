"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { getTopicTranslation } from "@/lib/i18nHelper";
import type { Topic } from "@/hooks/useOnboarding";

interface OnboardingStep2InterestsProps {
  t: any;
  tRoot: any;
  availableTopics: Topic[];
  selectedTopics: number[];
  setSelectedTopics: (val: number[]) => void;
  setStep: (step: number) => void;
  submitStep2: () => void;
  loading: boolean;
}

export function OnboardingStep2Interests({
  t,
  tRoot,
  availableTopics,
  selectedTopics,
  setSelectedTopics,
  setStep,
  submitStep2,
  loading,
}: OnboardingStep2InterestsProps) {
  const toggleTopic = (id: number) => {
    if (selectedTopics.includes(id)) {
      setSelectedTopics(selectedTopics.filter((tId) => tId !== id));
    } else {
      setSelectedTopics([...selectedTopics, id]);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <h2 className="text-lg sm:text-xl font-extrabold font-display text-foreground">
            {t("interests_title")}
          </h2>
          {selectedTopics.length > 0 && (
            <span className="text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200/80 shadow-2xs">
              {t("selected_count", { count: selectedTopics.length })}
            </span>
          )}
        </div>
        <p className="text-muted text-xs sm:text-sm mb-6 leading-relaxed">
          {t("interests_subtitle")}
        </p>

        <div className="flex flex-wrap gap-2.5">
          {availableTopics.map((topic) => {
            const isSelected = selectedTopics.includes(topic.id);
            return (
              <button
                key={topic.id}
                type="button"
                onClick={() => toggleTopic(topic.id)}
                className="group cursor-pointer active:scale-95 transition-transform"
              >
                <Chip
                  active={isSelected}
                  variant="outline"
                  className={`text-xs sm:text-sm py-2 px-4 font-medium transition-all duration-150 ${
                    isSelected
                      ? "bg-teal-700 text-white border-teal-700 shadow-card"
                      : "bg-surface hover:bg-surface-2 hover:border-slate-300"
                  }`}
                >
                  {getTopicTranslation(topic.name, tRoot)}
                </Chip>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3 pt-6 border-t border-border/70">
        <Button variant="ghost" className="h-12 rounded-full px-6 font-semibold" onClick={() => setStep(1)} disabled={loading}>
          {t("back_btn")}
        </Button>
        <Button className="flex-1 sd-btn-gradient h-12 rounded-full font-bold text-sm shadow-card active:scale-[0.98] transition-all cursor-pointer" onClick={submitStep2} disabled={loading}>
          {loading ? t("loading") : t("continue_btn")}
        </Button>
      </div>
    </div>
  );
}
