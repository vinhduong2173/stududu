"use client";

import * as React from "react";
import { useRouter } from "@/i18n/routing";
import { api, ApiError } from "@/lib/api";
import { useLocale, useTranslations } from "next-intl";
import { getLanguageInfo } from "@/lib/languages";

export type Language = { id: number; code: string; name: string };
export type Topic = { id: number; name: string };
export type UserLanguageItem = { languageId: number; role: "native" | "fluent" | "learning"; level?: string };

export function useOnboarding() {
  const t = useTranslations("onboarding");
  const tDisc = useTranslations("discover");
  const tRoot = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  const [step, setStepState] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const setStep = (nextStep: number) => {
    setStepState(nextStep);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("onboarding_current_step", nextStep.toString());
    }
  };

  // Step 1: Languages
  const [availableLanguages, setAvailableLanguages] = React.useState<Language[]>([]);
  const [myLanguages, setMyLanguages] = React.useState<UserLanguageItem[]>([]);
  const [teachLangId, setTeachLangId] = React.useState<string>("");
  const [teachRole, setTeachRole] = React.useState<"native" | "fluent">("native");
  const [learnLangId, setLearnLangId] = React.useState<string>("");
  const [learnLevel, setLearnLevel] = React.useState<string>("1");

  // Step 2: Interests
  const [availableTopics, setAvailableTopics] = React.useState<Topic[]>([]);
  const [selectedTopics, setSelectedTopics] = React.useState<number[]>([]);

  // Step 3: Profile
  const [bio, setBio] = React.useState("");
  const [intent, setIntent] = React.useState("Giao tiếp casual");
  const [city, setCity] = React.useState("");
  const [country, setCountry] = React.useState("VN");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const savedStep = sessionStorage.getItem("onboarding_current_step");
      if (savedStep) {
        const parsed = parseInt(savedStep, 10);
        if (parsed >= 1 && parsed <= 3) {
          setStepState(parsed);
        }
      }
    }

    api<Language[]>("/languages").then(setAvailableLanguages).catch(console.error);
    api<Topic[]>("/topics").then(setAvailableTopics).catch(console.error);
    api<any>("/users/me")
      .then((me) => {
        if (me.bio) setBio(me.bio);
        if (me.intent) setIntent(me.intent);
        if (me.city) setCity(me.city);
        if (me.country) setCountry(me.country);

        if (Array.isArray(me.languages) && me.languages.length > 0) {
          const loadedLangs: UserLanguageItem[] = me.languages.map((ul: any) => ({
            languageId: ul.languageId,
            role: ul.role,
            level: ul.level || undefined,
          }));
          setMyLanguages(loadedLangs);
        }

        if (Array.isArray(me.interests) && me.interests.length > 0) {
          const loadedTopics = me.interests.map((ui: any) => ui.topicId || ui.topic?.id).filter(Boolean);
          setSelectedTopics(loadedTopics);
        }

        if (typeof window !== "undefined" && !sessionStorage.getItem("onboarding_current_step")) {
          const hasTeach = me.languages?.some((l: any) => l.role === "native" || l.role === "fluent");
          const hasLearn = me.languages?.some((l: any) => l.role === "learning");
          const hasInterests = Array.isArray(me.interests) && me.interests.length > 0;

          if (hasTeach && hasLearn) {
            if (hasInterests) {
              setStep(3);
            } else {
              setStep(2);
            }
          }
        }
      })
      .catch(() => {});
  }, []);

  const getLangName = (id: number) => {
    const lang = availableLanguages.find((l) => l.id === id);
    return lang ? getLanguageInfo(lang.code, lang.name, locale).displayName : "";
  };

  const handleAddTeach = () => {
    if (!teachLangId) return;
    const langId = parseInt(teachLangId);
    if (myLanguages.some((l) => l.languageId === langId)) {
      setError("Ngôn ngữ này đã được chọn trong danh sách. Vui lòng chọn ngôn ngữ khác.");
      return;
    }
    setMyLanguages([...myLanguages, { languageId: langId, role: teachRole, level: teachRole === "fluent" ? "C1" : undefined }]);
    setTeachLangId("");
    setError("");
  };

  const handleAddLearn = () => {
    if (!learnLangId) return;
    const langId = parseInt(learnLangId);
    if (myLanguages.some((l) => l.languageId === langId)) {
      setError("Ngôn ngữ này đã được chọn trong danh sách. Vui lòng chọn ngôn ngữ khác.");
      return;
    }
    setMyLanguages([...myLanguages, { languageId: langId, role: "learning", level: learnLevel }]);
    setLearnLangId("");
    setError("");
  };

  const handleRemoveLang = (langId: number, role: string) => {
    setMyLanguages(myLanguages.filter((l) => !(l.languageId === langId && l.role === role)));
    setError("");
  };

  const submitStep1 = async () => {
    const hasTeach = myLanguages.some((l) => l.role === "native" || l.role === "fluent");
    const hasLearn = myLanguages.some((l) => l.role === "learning");
    if (!hasTeach || !hasLearn) {
      setError(t("error_lang_selection"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api("/users/me/languages", { method: "PUT", body: { languages: myLanguages } });
      setStep(2);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : tDisc("error_generic"));
    } finally {
      setLoading(false);
    }
  };

  const submitStep2 = async () => {
    setLoading(true);
    setError("");
    try {
      await api("/users/me/interests", { method: "PUT", body: { topicIds: selectedTopics } });
      setStep(3);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : tDisc("error_generic"));
    } finally {
      setLoading(false);
    }
  };

  const submitStep3 = async () => {
    if (!bio.trim()) {
      setError(t("error_bio_empty"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api("/users/me", {
        method: "PATCH",
        body: {
          bio: bio.trim(),
          intent,
          city: city.trim() || undefined,
          country: country || undefined,
        },
      });
      await api("/users/me/preference", { method: "PUT", body: { intent } });
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("onboarding_current_step");
      }
      router.push("/discover");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : tDisc("error_generic"));
    } finally {
      setLoading(false);
    }
  };

  return {
    t,
    tDisc,
    tRoot,
    locale,
    step,
    setStep,
    loading,
    error,
    setError,
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
    getLangName,
    handleAddTeach,
    handleAddLearn,
    handleRemoveLang,
    submitStep1,
    availableTopics,
    selectedTopics,
    setSelectedTopics,
    submitStep2,
    bio,
    setBio,
    intent,
    setIntent,
    city,
    setCity,
    country,
    setCountry,
    submitStep3,
  };
}
