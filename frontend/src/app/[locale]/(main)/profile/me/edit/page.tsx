"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { api, ApiError } from "@/lib/api";
import { Camera, Check, Clock, Eye, Heart, MapPin, Trash2 } from "lucide-react";
import { TIMEZONES, TIME_SLOTS, getTimezone } from "@/lib/timezones";
import { ageFromDob, cn, compressImage } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { getTopicTranslation } from "@/lib/i18nHelper";

/** MÀN 12 (chỉnh sửa) — sửa thông tin cơ bản, ngôn ngữ, sở thích, tiêu chí ghép (US-06, US-07). */

type Language = { id: number; code: string; name: string };
type Topic = { id: number; name: string };
type UserLanguageItem = { languageId: number; role: "native" | "fluent" | "learning"; level?: string };

const INTENTS = ["Giao tiếp casual", "Thi cử", "Du lịch", "Làm việc"];
const LEVEL_LABELS: Record<string, string> = {
  "1": "Mới bắt đầu",
  "2": "Sơ cấp",
  "3": "Trung cấp",
  "4": "Khá",
  "5": "Thành thạo",
};

export default function EditProfilePage() {
  const router = useRouter();
  const t = useTranslations("profile");
  const tOnboard = useTranslations("onboarding");
  const tDisc = useTranslations("discover");
  const tCommon = useTranslations("common");
  const tRoot = useTranslations();

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  // Thông tin cơ bản
  const [displayName, setDisplayName] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState(""); // URL cũ hoặc data URL từ ảnh chọn trong máy
  const [bio, setBio] = React.useState("");
  const [intent, setIntent] = React.useState("");
  const [gender, setGender] = React.useState("");
  const [dob, setDob] = React.useState(""); // yyyy-MM-dd
  const [city, setCity] = React.useState("");
  const avatarInputRef = React.useRef<HTMLInputElement>(null);

  // Ngôn ngữ
  const [availableLanguages, setAvailableLanguages] = React.useState<Language[]>([]);
  const [myLanguages, setMyLanguages] = React.useState<UserLanguageItem[]>([]);
  const [teachLangId, setTeachLangId] = React.useState("");
  const [teachRole, setTeachRole] = React.useState<"native" | "fluent">("native");
  const [learnLangId, setLearnLangId] = React.useState("");
  const [learnLevel, setLearnLevel] = React.useState("3");

  // Sở thích
  const [availableTopics, setAvailableTopics] = React.useState<Topic[]>([]);
  const [selectedTopics, setSelectedTopics] = React.useState<number[]>([]);

  // Tiêu chí ghép
  const [languageFocus, setLanguageFocus] = React.useState("");
  const [levelDesired, setLevelDesired] = React.useState("");

  // Múi giờ + khung giờ rảnh (hẹn lịch chat — bản Figma Make)
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
    if (myLanguages.some((l) => l.languageId === langId && l.role !== "learning")) return;
    setMyLanguages([
      ...myLanguages,
      { languageId: langId, role: teachRole, level: teachRole === "fluent" ? "C1" : undefined },
    ]);
    setTeachLangId("");
  };

  const addLearn = () => {
    if (!learnLangId) return;
    const langId = parseInt(learnLangId);
    if (myLanguages.some((l) => l.languageId === langId && l.role === "learning")) return;
    setMyLanguages([...myLanguages, { languageId: langId, role: "learning", level: learnLevel }]);
    setLearnLangId("");
  };

  const removeLang = (langId: number, role: string) =>
    setMyLanguages(myLanguages.filter((l) => !(l.languageId === langId && l.role === role)));

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

  if (loading)
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );

  const selectClass =
    "flex h-12 rounded-xl border border-border bg-transparent px-4 py-2 outline-none focus:border-primary";
  const fieldLabel = "block text-xs font-semibold text-muted uppercase tracking-wide mb-2";

  // Xem trước — suy ra từ state hiện tại (không gọi API)
  const previewAge = ageFromDob(dob);
  const teachPreview = myLanguages.find((l) => l.role !== "learning");
  const learnPreview = myLanguages.find((l) => l.role === "learning");
  const previewTopics = availableTopics.filter((tp) => selectedTopics.includes(tp.id));

  const actionButtons = (
    <div className="flex gap-2 shrink-0">
      <Button variant="ghost" onClick={() => router.back()} disabled={saving}>
        {tCommon("cancel")}
      </Button>
      <Button className="sd-btn-gradient" onClick={handleSave} disabled={saving}>
        <Check className="h-4 w-4 mr-2" />
        {saving ? tOnboard("loading") : tCommon("save")}
      </Button>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
            {t("edit_profile")}
          </h1>
          <p className="text-sm text-muted mt-1">{t("edit_subtitle")}</p>
        </div>
        {actionButtons}
      </div>

      {error && <div className="mb-6 rounded-xl bg-error/10 p-4 text-sm text-error">{error}</div>}

      {/* Cover banner + avatar */}
      <div className="bg-surface rounded-3xl border border-border shadow-sm overflow-hidden mb-6">
        <div className="sd-cover relative h-32 md:h-44">
          <div className="pointer-events-none absolute -top-16 -right-10 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-8 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        </div>
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-12">
            <div className="relative inline-block">
              <div className="rounded-full ring-4 ring-surface bg-surface">
                <Avatar
                  src={avatarUrl || undefined}
                  fallback={displayName.charAt(0) || "?"}
                  size="xl"
                  className="shadow-lg"
                />
              </div>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-md ring-2 ring-surface hover:bg-primary-hover transition-colors"
                title={t("change_avatar")}
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <div className="pb-1 min-w-0">
              <h2 className="font-display text-xl font-extrabold tracking-tight text-foreground truncate">
                {displayName || t("your_name")}
              </h2>
              <p className="text-sm text-muted">{t("this_is_you")}</p>
            </div>
            {avatarUrl && (
              <button
                type="button"
                onClick={() => setAvatarUrl("")}
                className="ml-auto pb-1 flex items-center gap-1 text-xs font-medium text-muted hover:text-error transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" /> {t("delete_image")}
              </button>
            )}
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPickAvatar}
          />
        </div>
      </div>

      {/* Bố cục 2 cột */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CỘT TRÁI */}
        <div className="lg:col-span-2 space-y-6">
        {/* Thông tin cơ bản */}
        <section className="bg-surface rounded-3xl p-6 shadow-sm border border-border space-y-4">
          <h2 className="font-display text-lg font-bold text-foreground">{t("basic_info")}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={fieldLabel}>{t("display_name")}</label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div>
              <label className={fieldLabel}>{t("city")}</label>
              <Input placeholder={t("city_placeholder")} value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div>
              <label className={fieldLabel}>{t("dob")}</label>
              <input
                type="date"
                className={`${selectClass} w-full`}
                value={dob}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDob(e.target.value)}
              />
            </div>
            <div>
              <label className={fieldLabel}>{t("gender")}</label>
              <select className={`${selectClass} w-full`} value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="">{t("gender_private")}</option>
                <option value="nam">{t("gender_male")}</option>
                <option value="nữ">{t("gender_female")}</option>
                <option value="khác">{t("gender_other")}</option>
              </select>
            </div>
          </div>
        </section>

        {/* Giới thiệu (Bio) */}
        <section className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-bold text-foreground">{tOnboard("bio_label")}</h2>
            <span className="text-xs text-muted">{bio.length}/300</span>
          </div>
          <textarea
            className="w-full rounded-xl border border-border bg-transparent p-4 outline-none focus:border-primary resize-none h-32"
            placeholder={tOnboard("bio_placeholder")}
            maxLength={300}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </section>

        {/* Ngôn ngữ */}
        <section className="bg-surface rounded-3xl p-6 shadow-sm border border-border space-y-6">
          <h2 className="text-lg font-bold text-foreground">{t("languages")}</h2>

          <div>
            <p className="font-semibold mb-3">{tOnboard("teach_title")}</p>
            <div className="flex gap-2 mb-3">
              <select className={`${selectClass} flex-1`} value={teachLangId} onChange={(e) => setTeachLangId(e.target.value)}>
                <option value="">{tOnboard("select_lang")}</option>
                {availableLanguages.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
              <select className={`${selectClass} w-32`} value={teachRole} onChange={(e) => setTeachRole(e.target.value as "native" | "fluent")}>
                <option value="native">{tDisc("card_native")}</option>
                <option value="fluent">{tDisc("card_fluent")}</option>
              </select>
              <Button variant="secondary" onClick={addTeach}>{tOnboard("add_btn")}</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {myLanguages.filter((l) => l.role !== "learning").map((l) => (
                <Chip key={`${l.languageId}-${l.role}`} className="pr-1">
                  {getLangName(l.languageId)} ({l.role === "native" ? tDisc("card_native") : tDisc("card_fluent")})
                  <button className="ml-2 hover:text-error" onClick={() => removeLang(l.languageId, l.role)}>×</button>
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <p className="font-semibold mb-3">{tOnboard("learn_title")}</p>
            <div className="flex gap-2 mb-3">
              <select className={`${selectClass} flex-1`} value={learnLangId} onChange={(e) => setLearnLangId(e.target.value)}>
                <option value="">{tOnboard("select_lang")}</option>
                {availableLanguages.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
              <select className={`${selectClass} w-36`} value={learnLevel} onChange={(e) => setLearnLevel(e.target.value)}>
                {Object.entries(LEVEL_LABELS).map(([v]) => (
                  <option key={v} value={v}>{tOnboard(`level_${v}`)}</option>
                ))}
              </select>
              <Button variant="secondary" onClick={addLearn}>{tOnboard("add_btn")}</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {myLanguages.filter((l) => l.role === "learning").map((l) => (
                <Chip key={`${l.languageId}-learning`} variant="secondary" className="pr-1">
                  {getLangName(l.languageId)} ({tOnboard(`level_${l.level}`) || `Level ${l.level}`})
                  <button className="ml-2 hover:text-error" onClick={() => removeLang(l.languageId, "learning")}>×</button>
                </Chip>
              ))}
            </div>
          </div>
        </section>

        {/* Sở thích */}
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

        {/* Múi giờ + khung giờ rảnh */}
        <section className="bg-surface rounded-3xl p-6 shadow-sm border border-border space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" /> {t("availability")}
          </h2>

          <div>
            <label className="block text-sm font-medium mb-2">{t("timezone_label")}</label>
            <select
              className={`${selectClass} w-full`}
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.code} value={tz.code}>
                  {tz.flag} {tz.name} (UTC{tz.offset >= 0 ? "+" : ""}{tz.offset})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">{t("slots_title")}</label>
              <span className="text-xs font-semibold text-primary">{t("slots_selected", { count: availableSlots.length })}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {TIME_SLOTS.map((slot) => {
                const isSelected = availableSlots.includes(slot.id);
                const disabled = !isSelected && availableSlots.length >= 2;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() =>
                      !disabled &&
                      setAvailableSlots((prev) =>
                        isSelected ? prev.filter((s) => s !== slot.id) : [...prev, slot.id],
                      )
                    }
                    className={cn(
                      "rounded-xl p-3 text-left border-2 transition-all",
                      isSelected
                        ? "border-primary bg-primary/10 shadow-sm"
                        : disabled
                          ? "border-border bg-muted/10 opacity-50 cursor-not-allowed"
                          : "border-border bg-surface hover:border-primary/40",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-foreground">{slot.label}</span>
                      {isSelected && <Check className="w-4 h-4 text-primary" />}
                    </div>
                    <span className="text-xs text-muted">
                      {getTimezone(timezone).flag} {t("slots_time")} {getTimezone(timezone).name}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted mt-2">
              {t("slots_hint")}
            </p>
          </div>
        </section>

        {/* Tiêu chí ghép */}
        <section className="bg-surface rounded-3xl p-6 shadow-sm border border-border space-y-4">
          <h2 className="text-lg font-bold text-foreground">{t("matching_criteria")}</h2>
          <div>
            <label className="block text-sm font-medium mb-2">{t("preferred_language")}</label>
            <select className={`${selectClass} w-full`} value={languageFocus} onChange={(e) => setLanguageFocus(e.target.value)}>
              <option value="">{t("no_preference")}</option>
              {availableLanguages.map((l) => (
                <option key={l.id} value={l.code}>{l.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{t("desired_level")}</label>
            <select className={`${selectClass} w-full`} value={levelDesired} onChange={(e) => setLevelDesired(e.target.value)}>
              <option value="">{t("any_level")}</option>
              {Object.entries(LEVEL_LABELS).map(([v]) => (
                <option key={v} value={v}>{tOnboard(`level_${v}`)}</option>
              ))}
            </select>
          </div>
        </section>

        </div>

        {/* CỘT PHẢI */}
        <div className="space-y-6">
          {/* Xem trước — hồ sơ người khác nhìn thấy */}
          <section className="bg-surface rounded-3xl p-5 shadow-sm border border-border lg:sticky lg:top-6">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="h-4 w-4 text-primary" />
              <h2 className="font-display text-base font-bold text-foreground">{t("preview")}</h2>
            </div>
            <p className="text-xs text-muted mb-4">{t("preview_hint")}</p>

            <div className="rounded-2xl border border-border p-4">
              <div className="flex items-center gap-3">
                <Avatar src={avatarUrl || undefined} fallback={displayName.charAt(0) || "?"} size="lg" />
                <div className="min-w-0">
                  <p className="font-bold text-foreground truncate">
                    {displayName || t("your_name")}
                    {previewAge !== null && <span className="font-medium text-muted">, {previewAge}</span>}
                  </p>
                  <p className="text-xs text-muted flex items-center gap-1">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
                    {t("preview_online")}
                    {city && (
                      <span className="inline-flex items-center gap-0.5">
                        · <MapPin className="w-3 h-3" /> {city}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted shrink-0">{t("preview_speaks")}</span>
                  {teachPreview ? (
                    <Chip className="text-xs py-0.5">
                      {getLangName(teachPreview.languageId)} (
                      {teachPreview.role === "native" ? tDisc("card_native") : tDisc("card_fluent")})
                    </Chip>
                  ) : (
                    <span className="text-xs text-muted">{t("preview_not_added")}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted shrink-0">{t("preview_learns")}</span>
                  {learnPreview ? (
                    <Chip variant="secondary" className="text-xs py-0.5">
                      {getLangName(learnPreview.languageId)} ({tOnboard(`level_${learnPreview.level}`)})
                    </Chip>
                  ) : (
                    <span className="text-xs text-muted">{t("preview_not_added")}</span>
                  )}
                </div>
              </div>

              {previewTopics.length > 0 && (
                <div className="mt-4 rounded-xl bg-primary/5 p-3">
                  <p className="text-xs font-semibold text-primary mb-1">✨ {t("shared_interests")}</p>
                  <p className="text-xs text-foreground leading-relaxed">
                    {previewTopics.map((tp) => getTopicTranslation(tp.name, tRoot)).join(", ")}
                  </p>
                </div>
              )}

              <div className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-semibold text-muted">
                <Heart className="w-4 h-4" /> {t("preview_like")}
              </div>
            </div>
          </section>

          {/* Mục tiêu luyện tập */}
          <section className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
            <h2 className="font-display text-lg font-bold text-foreground mb-1">{tOnboard("intent_label")}</h2>
            <p className="text-sm text-muted mb-3">{t("intent_hint")}</p>
            <select className={`${selectClass} w-full`} value={intent} onChange={(e) => setIntent(e.target.value)}>
              {INTENTS.map((i) => (
                <option key={i} value={i}>
                  {i === "Giao tiếp casual"
                    ? tOnboard("intent_casual")
                    : i === "Thi cử"
                      ? tOnboard("intent_exam")
                      : i === "Du lịch"
                        ? tOnboard("intent_travel")
                        : i === "Làm việc"
                          ? tOnboard("intent_work")
                          : i}
                </option>
              ))}
            </select>
          </section>
        </div>
      </div>

      {/* Nút lưu dưới cùng */}
      <div className="flex justify-end mt-8">{actionButtons}</div>
    </div>
  );
}
