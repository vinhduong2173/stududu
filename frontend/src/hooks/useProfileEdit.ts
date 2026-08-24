"use client";

import * as React from "react";
import { useRouter } from "@/i18n/routing";
import { api, ApiError } from "@/lib/api";
import { ageFromDob, compressImage } from "@/lib/utils";
import { useTranslations } from "next-intl";

export type Language = { id: number; code: string; name: string };
export type Topic = { id: number; name: string };
export type UserLanguageItem = { languageId: number; role: "native" | "fluent" | "learning"; level?: string };

export const INTENTS = ["Giao tiếp casual", "Thi cử", "Du lịch", "Làm việc"];
export const LEVEL_LABELS: Record<string, string> = {
  "1": "Mới bắt đầu",
  "2": "Sơ cấp",
  "3": "Trung cấp",
  "4": "Khá",
  "5": "Thành thạo",
};

export function useProfileEdit() {
  const router = useRouter();
  const t = useTranslations("profile");
  const tOnboard = useTranslations("onboarding");
  const tDisc = useTranslations("discover");
  const tCommon = useTranslations("common");
  const tRoot = useTranslations();

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  const [displayName, setDisplayName] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [intent, setIntent] = React.useState("");
  const [gender, setGender] = React.useState("");
  const [dob, setDob] = React.useState("");
  const [city, setCity] = React.useState("");
  const [country, setCountry] = React.useState("");
  const avatarInputRef = React.useRef<HTMLInputElement>(null);

  const [availableLanguages, setAvailableLanguages] = React.useState<Language[]>([]);
  const [myLanguages, setMyLanguages] = React.useState<UserLanguageItem[]>([]);
  const [teachLangId, setTeachLangId] = React.useState("");
  const [teachRole, setTeachRole] = React.useState<"native" | "fluent">("native");
  const [learnLangId, setLearnLangId] = React.useState("");
  const [learnLevel, setLearnLevel] = React.useState("3");

  const [availableTopics, setAvailableTopics] = React.useState<Topic[]>([]);
  const [selectedTopics, setSelectedTopics] = React.useState<number[]>([]);

  const [languageFocus, setLanguageFocus] = React.useState("");
  const [levelDesired, setLevelDesired] = React.useState("");

  const [timezone, setTimezone] = React.useState("VN");
  const [availableSlots, setAvailableSlots] = React.useState<string[]>([]);

  React.useEffect(() => {
    Promise.all([
      api<Language[]>("/languages"),
      api<Topic[]>("/topics"),
      api<any>("/users/me"),
    ])
      .then(([langs, topics, me]) => {
        setAvailableLanguages(langs);
        setAvailableTopics(topics);
        setDisplayName(me.displayName ?? "");
        setAvatarUrl(me.avatarUrl ?? "");
        setBio(me.bio ?? "");
        setIntent(me.intent ?? INTENTS[0]);
        setGender(me.gender ?? "");
        setDob(me.dob ? String(me.dob).slice(0, 10) : "");
        setCity(me.city ?? "");
        setCountry(me.country ?? "VN");
        setMyLanguages(
          me.languages.map((l: any) => ({
            languageId: l.languageId ?? l.language.id,
            role: l.role,
            level: l.level ?? undefined,
          })),
        );
        setSelectedTopics(me.interests.map((i: any) => i.topicId ?? i.topic.id));
        setLanguageFocus(me.matchPreference?.languageFocus ?? "");
        setLevelDesired(me.matchPreference?.levelDesired ?? "");
        setTimezone(me.timezone ?? "VN");
        setAvailableSlots(me.availableSlots ?? []);
      })
      .catch((err) => setError(err.message || t("loading_error")))
      .finally(() => setLoading(false));
  }, []);

  const getLangName = (id: number) => availableLanguages.find((l) => l.id === id)?.name || "";

  const addTeach = () => {
    if (!teachLangId) return;
    const langId = parseInt(teachLangId);
    if (myLanguages.some((l) => l.languageId === langId)) {
      setError("Ngôn ngữ này đã có trong danh sách hồ sơ.");
      return;
    }
    setMyLanguages([
      ...myLanguages,
      { languageId: langId, role: teachRole, level: teachRole === "fluent" ? "C1" : undefined },
    ]);
    setTeachLangId("");
    setError("");
  };

  const addLearn = () => {
    if (!learnLangId) return;
    const langId = parseInt(learnLangId);
    if (myLanguages.some((l) => l.languageId === langId)) {
      setError("Ngôn ngữ này đã có trong danh sách hồ sơ.");
      return;
    }
    setMyLanguages([...myLanguages, { languageId: langId, role: "learning", level: learnLevel }]);
    setLearnLangId("");
    setError("");
  };

  const removeLang = (langId: number, role: string) => {
    setMyLanguages(myLanguages.filter((l) => !(l.languageId === langId && l.role === role)));
    setError("");
  };

  const toggleTopic = (id: number) =>
    setSelectedTopics((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );

  const handleSave = async () => {
    if (!displayName.trim()) {
      setError(t("empty_name_error"));
      return;
    }
    const hasTeach = myLanguages.some((l) => l.role !== "learning");
    const hasLearn = myLanguages.some((l) => l.role === "learning");
    if (!hasTeach || !hasLearn) {
      setError(t("lang_selection_error"));
      return;
    }

    const langIds = myLanguages.map((l) => l.languageId);
    if (new Set(langIds).size !== langIds.length) {
      setError("Không thể chọn cùng một ngôn ngữ cho nhiều vai trò.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await api("/users/me", {
        method: "PATCH",
        body: {
          displayName: displayName.trim(),
          avatarUrl: avatarUrl || null,
          bio: bio.trim() || null,
          intent,
          gender: gender || null,
          dob: dob || null,
          city: city.trim() || null,
          country: country || null,
          timezone,
          availableSlots,
        },
      });
      await api("/users/me/languages", { method: "PUT", body: { languages: myLanguages } });
      await api("/users/me/interests", { method: "PUT", body: { topicIds: selectedTopics } });
      await api("/users/me/preference", {
        method: "PUT",
        body: {
          intent,
          languageFocus: languageFocus || null,
          levelDesired: levelDesired || null,
        },
      });
      router.push("/profile/me");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : tCommon("error_generic"));
    } finally {
      setSaving(false);
    }
  };

  const onPickAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setAvatarUrl(await compressImage(file, 400, 0.8));
    } catch {
      setError(t("avatar_error"));
    }
  };

  const previewAge = ageFromDob(dob);
  const teachPreview = myLanguages.find((l) => l.role !== "learning");
  const learnPreview = myLanguages.find((l) => l.role === "learning");
  const previewTopics = availableTopics.filter((tp) => selectedTopics.includes(tp.id));

  return {
    router,
    t,
    tOnboard,
    tDisc,
    tCommon,
    tRoot,
    loading,
    saving,
    error,
    displayName,
    setDisplayName,
    avatarUrl,
    setAvatarUrl,
    bio,
    setBio,
    intent,
    setIntent,
    gender,
    setGender,
    dob,
    setDob,
    city,
    setCity,
    country,
    setCountry,
    avatarInputRef,
    availableLanguages,
    myLanguages,
    teachLangId,
    setTeachLangId,
    teachRole,
    setTeachRole,
    learnLangId,
    setLearnLangId,
    learnLevel,
    setLearnLevel,
    availableTopics,
    selectedTopics,
    languageFocus,
    setLanguageFocus,
    levelDesired,
    setLevelDesired,
    timezone,
    setTimezone,
    availableSlots,
    setAvailableSlots,
    getLangName,
    addTeach,
    addLearn,
    removeLang,
    toggleTopic,
    handleSave,
    onPickAvatar,
    previewAge,
    teachPreview,
    learnPreview,
    previewTopics,
  };
}
