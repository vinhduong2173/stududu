"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { api, ApiError } from "@/lib/api";
import { ArrowLeft, Check, Clock, ImageUp, Trash2 } from "lucide-react";
import { TIMEZONES, TIME_SLOTS, getTimezone } from "@/lib/timezones";
import { cn, compressImage } from "@/lib/utils";

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
      .catch((err) => setError(err.message || "Không tải được hồ sơ"))
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
      setError("Tên hiển thị không được để trống.");
      return;
    }
    const hasTeach = myLanguages.some((l) => l.role !== "learning");
    const hasLearn = myLanguages.some((l) => l.role === "learning");
    if (!hasTeach || !hasLearn) {
      setError("Cần ít nhất 1 ngôn ngữ dạy được và 1 ngôn ngữ muốn học.");
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
      setError(err instanceof ApiError ? err.message : "Đã có lỗi xảy ra");
    } finally {
      setSaving(false);
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

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 hover:bg-muted/10 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="text-2xl font-bold text-foreground">Chỉnh sửa hồ sơ</h1>
      </div>

      {error && <div className="mb-6 rounded-xl bg-error/10 p-4 text-sm text-error">{error}</div>}

      <div className="space-y-6">
        {/* Thông tin cơ bản */}
        <section className="bg-surface rounded-3xl p-6 shadow-sm border border-border space-y-4">
          <h2 className="text-lg font-bold text-foreground">Thông tin cơ bản</h2>

          <div className="flex items-center gap-4">
            <Avatar src={avatarUrl || undefined} fallback={displayName.charAt(0) || "?"} size="xl" />
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Ảnh đại diện</label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  <ImageUp className="h-4 w-4 mr-2" /> Chọn ảnh từ máy
                </Button>
                {avatarUrl && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setAvatarUrl("")}>
                    <Trash2 className="h-4 w-4 mr-2" /> Xóa ảnh
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted mt-2">JPG/PNG — ảnh sẽ được nén tự động.</p>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  try {
                    setAvatarUrl(await compressImage(file, 400, 0.8));
                  } catch {
                    setError("Không đọc được ảnh này, thử ảnh khác nhé.");
                  }
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Ngày sinh</label>
              <input
                type="date"
                className={`${selectClass} w-full`}
                value={dob}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDob(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Giới tính</label>
              <select className={`${selectClass} w-full`} value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="">Không tiết lộ</option>
                <option value="nam">Nam</option>
                <option value="nữ">Nữ</option>
                <option value="khác">Khác</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Thành phố</label>
              <Input placeholder="VD: Hà Nội" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tên hiển thị</label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Giới thiệu bản thân (Bio)</label>
            <textarea
              className="w-full rounded-xl border border-border bg-transparent p-4 outline-none focus:border-primary resize-none h-32"
              placeholder="VD: Mình học tiếng Anh vì muốn du học. Cuối tuần mình thích đi cà phê..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Mục tiêu luyện tập</label>
            <select className={`${selectClass} w-full`} value={intent} onChange={(e) => setIntent(e.target.value)}>
              {INTENTS.map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>
        </section>

        {/* Ngôn ngữ */}
        <section className="bg-surface rounded-3xl p-6 shadow-sm border border-border space-y-6">
          <h2 className="text-lg font-bold text-foreground">Ngôn ngữ</h2>

          <div>
            <p className="font-semibold mb-3">Tôi nói (dạy được)</p>
            <div className="flex gap-2 mb-3">
              <select className={`${selectClass} flex-1`} value={teachLangId} onChange={(e) => setTeachLangId(e.target.value)}>
                <option value="">Chọn ngôn ngữ</option>
                {availableLanguages.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
              <select className={`${selectClass} w-32`} value={teachRole} onChange={(e) => setTeachRole(e.target.value as "native" | "fluent")}>
                <option value="native">Mẹ đẻ</option>
                <option value="fluent">Thành thạo</option>
              </select>
              <Button variant="secondary" onClick={addTeach}>Thêm</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {myLanguages.filter((l) => l.role !== "learning").map((l) => (
                <Chip key={`${l.languageId}-${l.role}`} className="pr-1">
                  {getLangName(l.languageId)} ({l.role === "native" ? "Mẹ đẻ" : "Thành thạo"})
                  <button className="ml-2 hover:text-error" onClick={() => removeLang(l.languageId, l.role)}>×</button>
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <p className="font-semibold mb-3">Tôi muốn học</p>
            <div className="flex gap-2 mb-3">
              <select className={`${selectClass} flex-1`} value={learnLangId} onChange={(e) => setLearnLangId(e.target.value)}>
                <option value="">Chọn ngôn ngữ</option>
                {availableLanguages.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
              <select className={`${selectClass} w-36`} value={learnLevel} onChange={(e) => setLearnLevel(e.target.value)}>
                {Object.entries(LEVEL_LABELS).map(([v, label]) => (
                  <option key={v} value={v}>{label}</option>
                ))}
              </select>
              <Button variant="secondary" onClick={addLearn}>Thêm</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {myLanguages.filter((l) => l.role === "learning").map((l) => (
                <Chip key={`${l.languageId}-learning`} variant="secondary" className="pr-1">
                  {getLangName(l.languageId)} ({LEVEL_LABELS[l.level ?? ""] ?? `Level ${l.level}`})
                  <button className="ml-2 hover:text-error" onClick={() => removeLang(l.languageId, "learning")}>×</button>
                </Chip>
              ))}
            </div>
          </div>
        </section>

        {/* Sở thích */}
        <section className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
          <h2 className="text-lg font-bold text-foreground mb-4">Sở thích</h2>
          <div className="flex flex-wrap gap-3">
            {availableTopics.map((topic) => (
              <button key={topic.id} onClick={() => toggleTopic(topic.id)}>
                <Chip active={selectedTopics.includes(topic.id)} variant="outline" className="cursor-pointer py-2 px-4">
                  {topic.name}
                </Chip>
              </button>
            ))}
          </div>
        </section>

        {/* Múi giờ + khung giờ rảnh */}
        <section className="bg-surface rounded-3xl p-6 shadow-sm border border-border space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" /> Khung giờ rảnh & Múi giờ
          </h2>

          <div>
            <label className="block text-sm font-medium mb-2">Múi giờ của bạn</label>
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
              <label className="text-sm font-medium">Khung giờ rảnh (tối đa 2)</label>
              <span className="text-xs font-semibold text-primary">{availableSlots.length}/2 đã chọn</span>
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
                      {getTimezone(timezone).flag} Giờ {getTimezone(timezone).name}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted mt-2">
              Khung giờ rảnh giúp đối tác hẹn lịch trò chuyện với bạn dễ hơn (tự quy đổi múi giờ).
            </p>
          </div>
        </section>

        {/* Tiêu chí ghép */}
        <section className="bg-surface rounded-3xl p-6 shadow-sm border border-border space-y-4">
          <h2 className="text-lg font-bold text-foreground">Tiêu chí ghép đôi</h2>
          <div>
            <label className="block text-sm font-medium mb-2">Ngôn ngữ ưu tiên ghép</label>
            <select className={`${selectClass} w-full`} value={languageFocus} onChange={(e) => setLanguageFocus(e.target.value)}>
              <option value="">Không ưu tiên</option>
              {availableLanguages.map((l) => (
                <option key={l.id} value={l.code}>{l.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Trình độ đối tác mong muốn</label>
            <select className={`${selectClass} w-full`} value={levelDesired} onChange={(e) => setLevelDesired(e.target.value)}>
              <option value="">Bất kỳ</option>
              {Object.entries(LEVEL_LABELS).map(([v, label]) => (
                <option key={v} value={v}>{label}</option>
              ))}
            </select>
          </div>
        </section>

        <div className="flex gap-4">
          <Button variant="ghost" className="flex-1" onClick={() => router.back()} disabled={saving}>
            Hủy
          </Button>
          <Button className="flex-1" onClick={handleSave} disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </div>
    </div>
  );
}
