"use client";

import * as React from "react";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Stepper } from "@/components/ui/Stepper";
import { Logo } from "@/components/ui/Logo";
import { LanguageSwitcher } from "@/components/features/LanguageSwitcher";
import { api, ApiError } from "@/lib/api";
import { useLocale, useTranslations } from "next-intl";
import { getTopicTranslation } from "@/lib/i18nHelper";
import { getLanguageInfo } from "@/lib/languages";
import { AlertCircle, Plus, X } from "lucide-react";

type Language = { id: number; code: string; name: string };
type Topic = { id: number; name: string };
type UserLanguageItem = { languageId: number; role: "native" | "fluent" | "learning"; level?: string };

export default function OnboardingPage() {
  const t = useTranslations("onboarding");
  const tDisc = useTranslations("discover");
  const tRoot = useTranslations();
  const locale = useLocale();
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
    <div className="min-h-screen bg-background py-8 sm:py-12 px-4 sm:px-6 relative flex flex-col items-center justify-center">
      {/* Top Bar: Logo & Language Switcher */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-6 px-1">
        <Logo size="sm" href="/" />
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-2xl bg-surface p-6 sm:p-8 rounded-2xl shadow-card border border-border">
        <Stepper steps={[t("step_languages"), t("step_interests"), t("step_complete")]} currentStep={step} className="mb-8" />

        {error && (
          <div className="mb-6 rounded-xl bg-rose-50 border border-rose-200/80 p-3.5 text-xs sm:text-sm text-rose-700 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold font-display text-foreground mb-3">{t("teach_title")}</h2>
              <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <select 
                  className="flex h-11 rounded-xl border border-border bg-surface-2/60 px-4 py-2 flex-1 outline-none focus:border-primary font-medium text-sm text-foreground"
                  value={teachLangId} onChange={(e) => setTeachLangId(e.target.value)}
                >
                  <option value="">{t("select_lang")}</option>
                  {availableLanguages
                    .filter((l) => !myLanguages.some((ml) => ml.languageId === l.id))
                    .map((l) => (
                      <option key={l.id} value={l.id}>
                        {getLanguageInfo(l.code, l.name, locale).displayName}
                      </option>
                    ))}
                </select>
                <select 
                  className="flex h-11 rounded-xl border border-border bg-surface-2/60 px-4 py-2 sm:w-32 outline-none focus:border-primary font-medium text-sm text-foreground"
                  value={teachRole} onChange={(e) => setTeachRole(e.target.value as any)}
                >
                  <option value="native">{tDisc("card_native")}</option>
                  <option value="fluent">{tDisc("card_fluent")}</option>
                </select>
                <Button variant="outline" className="h-11 rounded-xl px-5 font-bold" onClick={handleAddTeach}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  {t("add_btn")}
                </Button>
              </div>

              {myLanguages.filter(l => l.role !== 'learning').length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {myLanguages.filter(l => l.role !== 'learning').map(l => (
                    <Chip key={`${l.languageId}-${l.role}`} variant="default" className="py-1 px-3 gap-1.5">
                      <span>{getLangName(l.languageId)} ({l.role === 'native' ? tDisc("card_native") : tDisc("card_fluent")})</span>
                      <button className="hover:opacity-75 transition-opacity" onClick={() => handleRemoveLang(l.languageId, l.role)}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </Chip>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted/80 italic">{t("empty_languages_hint")}</p>
              )}
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-extrabold font-display text-foreground mb-3">{t("learn_title")}</h2>
              <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <select 
                  className="flex h-11 rounded-xl border border-border bg-surface-2/60 px-4 py-2 flex-1 outline-none focus:border-primary font-medium text-sm text-foreground"
                  value={learnLangId} onChange={(e) => setLearnLangId(e.target.value)}
                >
                  <option value="">{t("select_lang")}</option>
                  {availableLanguages
                    .filter((l) => !myLanguages.some((ml) => ml.languageId === l.id))
                    .map((l) => (
                      <option key={l.id} value={l.id}>
                        {getLanguageInfo(l.code, l.name, locale).displayName}
                      </option>
                    ))}
                </select>
                <select 
                  className="flex h-11 rounded-xl border border-border bg-surface-2/60 px-4 py-2 sm:w-32 outline-none focus:border-primary font-medium text-sm text-foreground"
                  value={learnLevel} onChange={(e) => setLearnLevel(e.target.value)}
                >
                  <option value="1">{t("level_1")}</option>
                  <option value="2">{t("level_2")}</option>
                  <option value="3">{t("level_3")}</option>
                  <option value="4">{t("level_4")}</option>
                  <option value="5">{t("level_5")}</option>
                </select>
                <Button variant="outline" className="h-11 rounded-xl px-5 font-bold" onClick={handleAddLearn}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  {t("add_btn")}
                </Button>
              </div>

              {myLanguages.filter(l => l.role === 'learning').length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {myLanguages.filter(l => l.role === 'learning').map(l => (
                    <Chip key={`${l.languageId}-learning`} variant="secondary" className="py-1 px-3 gap-1.5">
                      <span>{getLangName(l.languageId)} ({t(`level_${l.level}` as any)})</span>
                      <button className="hover:opacity-75 transition-opacity" onClick={() => handleRemoveLang(l.languageId, 'learning')}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </Chip>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted/80 italic">{t("empty_languages_hint")}</p>
              )}
            </div>

            <Button className="w-full mt-6 sd-btn-gradient h-12 rounded-full font-bold text-sm" onClick={submitStep1} disabled={loading}>
              {loading ? t("loading") : t("continue_btn")}
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h2 className="text-lg sm:text-xl font-extrabold font-display text-foreground">{t("interests_title")}</h2>
                {selectedTopics.length > 0 && (
                  <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200/60">
                    {t("selected_count", { count: selectedTopics.length })}
                  </span>
                )}
              </div>
              <p className="text-muted text-xs sm:text-sm mb-6">{t("interests_subtitle")}</p>
              
              <div className="flex flex-wrap gap-2.5">
                {availableTopics.map(topic => (
                  <button 
                    key={topic.id}
                    type="button"
                    onClick={() => {
                      if (selectedTopics.includes(topic.id)) {
                        setSelectedTopics(selectedTopics.filter(id => id !== topic.id));
                      } else {
                        setSelectedTopics([...selectedTopics, topic.id]);
                      }
                    }}
                  >
                    <Chip active={selectedTopics.includes(topic.id)} variant="outline" className="cursor-pointer text-xs sm:text-sm py-2 px-3.5 font-medium transition-all">
                      {getTopicTranslation(topic.name, tRoot)}
                    </Chip>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <Button variant="ghost" className="h-12 rounded-full px-6 font-semibold" onClick={() => setStep(1)} disabled={loading}>
                {t("back_btn")}
              </Button>
              <Button className="flex-1 sd-btn-gradient h-12 rounded-full font-bold text-sm" onClick={submitStep2} disabled={loading}>
                {loading ? t("loading") : t("continue_btn")}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold font-display text-foreground mb-1.5">{t("profile_title")}</h2>
              <p className="text-muted text-xs sm:text-sm mb-6">{t("profile_subtitle")}</p>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-muted uppercase tracking-wider">{t("bio_label")}</label>
                    <span className="text-[11px] text-muted font-medium">{bio.length}/500</span>
                  </div>
                  <textarea
                    className="w-full rounded-xl border border-border bg-surface-2/60 p-4 outline-none focus:border-primary focus:bg-surface resize-none h-32 text-sm text-foreground transition-all"
                    placeholder={t("bio_placeholder")}
                    maxLength={500}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                  <p className="text-[11px] text-teal-800 bg-teal-50/80 p-2.5 rounded-lg border border-teal-200/60 mt-2 font-medium">
                    {t("bio_tip")}
                  </p>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">{t("intent_label")}</label>
                  <select 
                    className="w-full h-11 rounded-xl border border-border bg-surface-2/60 px-4 outline-none focus:border-primary font-medium text-sm text-foreground"
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

            <div className="flex gap-3 pt-6">
              <Button variant="ghost" className="h-12 rounded-full px-6 font-semibold" onClick={() => setStep(2)} disabled={loading}>
                {t("back_btn")}
              </Button>
              <Button className="flex-1 sd-btn-gradient h-12 rounded-full font-bold text-sm" onClick={submitStep3} disabled={loading}>
                {loading ? t("loading") : t("finish_btn")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
