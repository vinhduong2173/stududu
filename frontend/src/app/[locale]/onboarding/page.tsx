"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Chip } from "@/components/ui/Chip";
import { Stepper } from "@/components/ui/Stepper";
import { api, ApiError } from "@/lib/api";
import { useTranslations } from "next-intl";
import { getTopicTranslation } from "@/lib/i18nHelper";

type Language = { id: number; code: string; name: string };
type Topic = { id: number; name: string };
type UserLanguageItem = { languageId: number; role: "native" | "fluent" | "learning"; level?: string };

export default function OnboardingPage() {
  const t = useTranslations("onboarding");
  const tDisc = useTranslations("discover");
  const tRoot = useTranslations();
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  // Step 1 State: Languages
  const [availableLanguages, setAvailableLanguages] = React.useState<Language[]>([]);
  const [myLanguages, setMyLanguages] = React.useState<UserLanguageItem[]>([]);
  const [teachLangId, setTeachLangId] = React.useState<string>("");
  const [teachRole, setTeachRole] = React.useState<"native" | "fluent">("native");
  const [learnLangId, setLearnLangId] = React.useState<string>("");
  const [learnLevel, setLearnLevel] = React.useState<string>("1");

  // Step 2 State: Interests
  const [availableTopics, setAvailableTopics] = React.useState<Topic[]>([]);
  const [selectedTopics, setSelectedTopics] = React.useState<number[]>([]);

  // Step 3 State: Profile
  const [bio, setBio] = React.useState("");
  const [intent, setIntent] = React.useState("Giao tiếp casual");

  React.useEffect(() => {
    // Fetch seed data
    api<Language[]>("/languages").then(setAvailableLanguages).catch(console.error);
    api<Topic[]>("/topics").then(setAvailableTopics).catch(console.error);
  }, []);

  const getLangName = (id: number) => availableLanguages.find((l) => l.id === id)?.name || "";

  const handleAddTeach = () => {
    if (!teachLangId) return;
    const langId = parseInt(teachLangId);
    if (myLanguages.some((l) => l.languageId === langId && (l.role === "native" || l.role === "fluent"))) return;
    setMyLanguages([...myLanguages, { languageId: langId, role: teachRole, level: teachRole === "fluent" ? "C1" : undefined }]);
    setTeachLangId("");
  };

  const handleAddLearn = () => {
    if (!learnLangId) return;
    const langId = parseInt(learnLangId);
    if (myLanguages.some((l) => l.languageId === langId && l.role === "learning")) return;
    setMyLanguages([...myLanguages, { languageId: langId, role: "learning", level: learnLevel }]);
    setLearnLangId("");
  };

  const handleRemoveLang = (langId: number, role: string) => {
    setMyLanguages(myLanguages.filter((l) => !(l.languageId === langId && l.role === role)));
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
      await api("/users/me", { method: "PATCH", body: { bio, intent } });
      await api("/users/me/preference", { method: "PUT", body: { intent } });
      router.push("/discover");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : tDisc("error_generic"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6">
      <div className="mx-auto max-w-2xl bg-surface p-8 rounded-2xl shadow-sm border border-border">
        <Stepper steps={[t("step_languages"), t("step_interests"), t("step_complete")]} currentStep={step} className="mb-10" />

        {error && <div className="mb-6 rounded-xl bg-error/10 p-4 text-sm text-error">{error}</div>}

        {step === 1 && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <h2 className="text-xl font-bold mb-4">{t("teach_title")}</h2>
              <div className="flex gap-2 mb-4">
                <select 
                  className="flex h-12 rounded-xl border border-border bg-transparent px-4 py-2 flex-1 outline-none focus:border-primary font-medium"
                  value={teachLangId} onChange={(e) => setTeachLangId(e.target.value)}
                >
                  <option value="">{t("select_lang")}</option>
                  {availableLanguages.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
                <select 
                  className="flex h-12 rounded-xl border border-border bg-transparent px-4 py-2 w-32 outline-none focus:border-primary font-medium"
                  value={teachRole} onChange={(e) => setTeachRole(e.target.value as any)}
                >
                  <option value="native">{tDisc("card_native")}</option>
                  <option value="fluent">{tDisc("card_fluent")}</option>
                </select>
                <Button variant="secondary" onClick={handleAddTeach}>{t("add_btn")}</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {myLanguages.filter(l => l.role !== 'learning').map(l => (
                  <Chip key={`${l.languageId}-${l.role}`} className="pr-1">
                    {getLangName(l.languageId)} ({l.role === 'native' ? tDisc("card_native") : tDisc("card_fluent")})
                    <button className="ml-2 hover:text-error" onClick={() => handleRemoveLang(l.languageId, l.role)}>×</button>
                  </Chip>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-4">{t("learn_title")}</h2>
              <div className="flex gap-2 mb-4">
                <select 
                  className="flex h-12 rounded-xl border border-border bg-transparent px-4 py-2 flex-1 outline-none focus:border-primary font-medium"
                  value={learnLangId} onChange={(e) => setLearnLangId(e.target.value)}
                >
                  <option value="">{t("select_lang")}</option>
                  {availableLanguages.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
                <select 
                  className="flex h-12 rounded-xl border border-border bg-transparent px-4 py-2 w-32 outline-none focus:border-primary font-medium"
                  value={learnLevel} onChange={(e) => setLearnLevel(e.target.value)}
                >
                  <option value="1">{t("level_1")}</option>
                  <option value="2">{t("level_2")}</option>
                  <option value="3">{t("level_3")}</option>
                  <option value="4">{t("level_4")}</option>
                  <option value="5">{t("level_5")}</option>
                </select>
                <Button variant="secondary" onClick={handleAddLearn}>{t("add_btn")}</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {myLanguages.filter(l => l.role === 'learning').map(l => (
                  <Chip key={`${l.languageId}-learning`} className="pr-1">
                    {getLangName(l.languageId)} (Level {l.level})
                    <button className="ml-2 hover:text-error" onClick={() => handleRemoveLang(l.languageId, 'learning')}>×</button>
                  </Chip>
                ))}
              </div>
            </div>

            <Button className="w-full mt-4" onClick={submitStep1} disabled={loading}>
              {loading ? t("loading") : t("continue_btn")}
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-xl font-bold mb-2">{t("interests_title")}</h2>
              <p className="text-muted text-sm mb-6">{t("interests_subtitle")}</p>
              
              <div className="flex flex-wrap gap-3">
                {availableTopics.map(topic => (
                  <button 
                    key={topic.id}
                    onClick={() => {
                      if (selectedTopics.includes(topic.id)) {
                        setSelectedTopics(selectedTopics.filter(id => id !== topic.id));
                      } else {
                        setSelectedTopics([...selectedTopics, topic.id]);
                      }
                    }}
                  >
                    <Chip active={selectedTopics.includes(topic.id)} variant="outline" className="cursor-pointer text-base py-2 px-4">
                      {getTopicTranslation(topic.name, tRoot)}
                    </Chip>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button variant="ghost" onClick={() => setStep(1)} disabled={loading}>{t("back_btn")}</Button>
              <Button className="flex-1" onClick={submitStep2} disabled={loading}>
                {loading ? t("loading") : t("continue_btn")}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-xl font-bold mb-2">{t("profile_title")}</h2>
              <p className="text-muted text-sm mb-6">{t("profile_subtitle")}</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{t("bio_label")}</label>
                  <textarea
                    className="w-full rounded-xl border border-border bg-transparent p-4 outline-none focus:border-primary resize-none h-32"
                    placeholder={t("bio_placeholder")}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">{t("intent_label")}</label>
                  <select 
                    className="w-full h-12 rounded-xl border border-border bg-transparent px-4 outline-none focus:border-primary font-medium"
                    value={intent}
                    onChange={(e) => setIntent(e.target.value)}
                  >
                    <option value="Giao tiếp casual">{t("intent_casual")}</option>
                    <option value="Thi cử">{t("intent_exam")}</option>
                    <option value="Du lịch">{t("intent_travel")}</option>
                    <option value="Làm việc">{t("intent_work")}</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button variant="ghost" onClick={() => setStep(2)} disabled={loading}>{t("back_btn")}</Button>
              <Button className="flex-1" onClick={submitStep3} disabled={loading}>
                {loading ? t("loading") : t("finish_btn")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
