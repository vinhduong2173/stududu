"use client";

import * as React from "react";
import { Chip } from "@/components/ui/Chip";
import { getTopicTranslation } from "@/lib/i18nHelper";
import { Topic } from "@/hooks/useProfileEdit";

interface ProfileInterestsSectionProps {
  t: any;
  tRoot: any;
  availableTopics: Topic[];
  selectedTopics: number[];
  toggleTopic: (id: number) => void;
}

export function ProfileInterestsSection({
  t,
  tRoot,
  availableTopics,
  selectedTopics,
  toggleTopic,
}: ProfileInterestsSectionProps) {
  return (
    <section className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
      <h2 className="font-display text-lg font-bold text-foreground mb-1">{t("interests")}</h2>
      <p className="text-sm text-muted mb-4">{t("interests_hint")}</p>
      <div className="flex flex-wrap gap-3">
        {availableTopics.map((topic) => (
          <button key={topic.id} onClick={() => toggleTopic(topic.id)}>
            <Chip active={selectedTopics.includes(topic.id)} variant="outline" className="cursor-pointer py-2 px-4">
              {getTopicTranslation(topic.name, tRoot)}
            </Chip>
          </button>
        ))}
      </div>
    </section>
  );
}
