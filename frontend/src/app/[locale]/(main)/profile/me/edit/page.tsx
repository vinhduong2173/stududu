"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Check } from "lucide-react";
import { useProfileEdit } from "@/hooks/useProfileEdit";
import { ProfileAvatarBanner } from "@/components/features/profile/ProfileAvatarBanner";
import { ProfileBasicInfoSection } from "@/components/features/profile/ProfileBasicInfoSection";
import { ProfileLanguageSection } from "@/components/features/profile/ProfileLanguageSection";
import { ProfileInterestsSection } from "@/components/features/profile/ProfileInterestsSection";
import { ProfileAvailabilitySection } from "@/components/features/profile/ProfileAvailabilitySection";
import { ProfilePreviewCard } from "@/components/features/profile/ProfilePreviewCard";

export default function EditProfilePage() {
  const p = useProfileEdit();

  if (p.loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const actionButtons = (
    <div className="flex gap-2 shrink-0">
      <Button variant="ghost" onClick={() => p.router.back()} disabled={p.saving}>
        {p.tCommon("cancel")}
      </Button>
      <Button className="sd-btn-gradient" onClick={p.handleSave} disabled={p.saving}>
        <Check className="h-4 w-4 mr-2" />
        {p.saving ? p.tOnboard("loading") : p.tCommon("save")}
      </Button>
    </div>
  );

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
            {p.t("edit_profile")}
          </h1>
          <p className="text-sm text-muted mt-1">{p.t("edit_subtitle")}</p>
        </div>
        {actionButtons}
      </div>

      {p.error && <div className="mb-6 rounded-xl bg-error/10 p-4 text-sm text-error">{p.error}</div>}

      <ProfileAvatarBanner
        t={p.t}
        displayName={p.displayName}
        avatarUrl={p.avatarUrl}
        setAvatarUrl={p.setAvatarUrl}
        avatarInputRef={p.avatarInputRef}
        onPickAvatar={p.onPickAvatar}
      />

      {/* Bố cục 2 cột */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CỘT TRÁI */}
        <div className="lg:col-span-2 space-y-6">
          <ProfileBasicInfoSection
            t={p.t}
            tOnboard={p.tOnboard}
            tRoot={p.tRoot}
            displayName={p.displayName}
            setDisplayName={p.setDisplayName}
            city={p.city}
            setCity={p.setCity}
            country={p.country}
            setCountry={p.setCountry}
            dob={p.dob}
            setDob={p.setDob}
            gender={p.gender}
            setGender={p.setGender}
            bio={p.bio}
            setBio={p.setBio}
          />

          <ProfileLanguageSection
            t={p.t}
            tOnboard={p.tOnboard}
            tDisc={p.tDisc}
            availableLanguages={p.availableLanguages}
            myLanguages={p.myLanguages}
            teachLangId={p.teachLangId}
            setTeachLangId={p.setTeachLangId}
            teachRole={p.teachRole}
            setTeachRole={p.setTeachRole}
            learnLangId={p.learnLangId}
            setLearnLangId={p.setLearnLangId}
            learnLevel={p.learnLevel}
            setLearnLevel={p.setLearnLevel}
            getLangName={p.getLangName}
            addTeach={p.addTeach}
            addLearn={p.addLearn}
            removeLang={p.removeLang}
          />

          <ProfileInterestsSection
            t={p.t}
            tRoot={p.tRoot}
            availableTopics={p.availableTopics}
            selectedTopics={p.selectedTopics}
            toggleTopic={p.toggleTopic}
          />

          <ProfileAvailabilitySection
            t={p.t}
            tOnboard={p.tOnboard}
            timezone={p.timezone}
            setTimezone={p.setTimezone}
            availableSlots={p.availableSlots}
            setAvailableSlots={p.setAvailableSlots}
            languageFocus={p.languageFocus}
            setLanguageFocus={p.setLanguageFocus}
            levelDesired={p.levelDesired}
            setLevelDesired={p.setLevelDesired}
            availableLanguages={p.availableLanguages}
          />
        </div>

        {/* CỘT PHẢI */}
        <ProfilePreviewCard
          t={p.t}
          tOnboard={p.tOnboard}
          tDisc={p.tDisc}
          tRoot={p.tRoot}
          displayName={p.displayName}
          avatarUrl={p.avatarUrl}
          previewAge={p.previewAge}
          city={p.city}
          country={p.country}
          teachPreview={p.teachPreview}
          learnPreview={p.learnPreview}
          previewTopics={p.previewTopics}
          getLangName={p.getLangName}
          intent={p.intent}
          setIntent={p.setIntent}
        />
      </div>

      {/* Nút lưu dưới cùng */}
      <div className="flex justify-end mt-8">{actionButtons}</div>
    </div>
  );
}
