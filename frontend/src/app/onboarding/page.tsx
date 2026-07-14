"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Chip } from "@/components/ui/Chip";
import { Stepper } from "@/components/ui/Stepper";
import { api, ApiError } from "@/lib/api";

type Language = { id: number; code: string; name: string };
type Topic = { id: number; name: string };
type UserLanguageItem = { languageId: number; role: "native" | "fluent" | "learning"; level?: string };

export default function OnboardingPage() {
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
      setError("Cần chọn ít nhất 1 ngôn ngữ dạy được và 1 ngôn ngữ muốn học.");
      return;
    }
    
    setLoading(true);
    setError("");
    try {
      await api("/users/me/languages", { method: "PUT", body: { languages: myLanguages } });
      setStep(2);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Đã có lỗi xảy ra");
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
      setError(err instanceof ApiError ? err.message : "Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const submitStep3 = async () => {
    if (!bio.trim()) {
      setError("Vui lòng nhập giới thiệu bản thân (Bio).");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api("/users/me", { method: "PATCH", body: { bio, intent } });
      await api("/users/me/preference", { method: "PUT", body: { intent } });
      router.push("/discover");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6">
      <div className="mx-auto max-w-2xl bg-surface p-8 rounded-2xl shadow-sm border border-border">
        <Stepper steps={["Ngôn ngữ", "Sở thích", "Hoàn thiện"]} currentStep={step} className="mb-10" />

        {error && <div className="mb-6 rounded-xl bg-error/10 p-4 text-sm text-error">{error}</div>}

        {step === 1 && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <h2 className="text-xl font-bold mb-4">Tôi nói (dạy được)</h2>
              <div className="flex gap-2 mb-4">
                <select 
                  className="flex h-12 rounded-xl border border-border bg-transparent px-4 py-2 flex-1 outline-none focus:border-primary"
                  value={teachLangId} onChange={(e) => setTeachLangId(e.target.value)}
                >
                  <option value="">Chọn ngôn ngữ</option>
                  {availableLanguages.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
                <select 
                  className="flex h-12 rounded-xl border border-border bg-transparent px-4 py-2 w-32 outline-none focus:border-primary"
                  value={teachRole} onChange={(e) => setTeachRole(e.target.value as any)}
                >
                  <option value="native">Mẹ đẻ</option>
                  <option value="fluent">Thành thạo</option>
                </select>
                <Button variant="secondary" onClick={handleAddTeach}>Thêm</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {myLanguages.filter(l => l.role !== 'learning').map(l => (
                  <Chip key={`${l.languageId}-${l.role}`} className="pr-1">
                    {getLangName(l.languageId)} ({l.role === 'native' ? 'Mẹ đẻ' : 'Thành thạo'})
                    <button className="ml-2 hover:text-error" onClick={() => handleRemoveLang(l.languageId, l.role)}>×</button>
                  </Chip>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-4">Tôi muốn học</h2>
              <div className="flex gap-2 mb-4">
                <select 
                  className="flex h-12 rounded-xl border border-border bg-transparent px-4 py-2 flex-1 outline-none focus:border-primary"
                  value={learnLangId} onChange={(e) => setLearnLangId(e.target.value)}
                >
                  <option value="">Chọn ngôn ngữ</option>
                  {availableLanguages.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
                <select 
                  className="flex h-12 rounded-xl border border-border bg-transparent px-4 py-2 w-32 outline-none focus:border-primary"
                  value={learnLevel} onChange={(e) => setLearnLevel(e.target.value)}
                >
                  <option value="1">Mới bắt đầu</option>
                  <option value="2">Sơ cấp</option>
                  <option value="3">Trung cấp</option>
                  <option value="4">Khá</option>
                  <option value="5">Thành thạo</option>
                </select>
                <Button variant="secondary" onClick={handleAddLearn}>Thêm</Button>
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
              {loading ? "Đang lưu..." : "Tiếp tục"}
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-xl font-bold mb-2">Sở thích của bạn</h2>
              <p className="text-muted text-sm mb-6">Chọn các chủ đề bạn quan tâm (không bắt buộc).</p>
              
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
                      {topic.name}
                    </Chip>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button variant="ghost" onClick={() => setStep(1)} disabled={loading}>Quay lại</Button>
              <Button className="flex-1" onClick={submitStep2} disabled={loading}>
                {loading ? "Đang lưu..." : "Tiếp tục"}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-xl font-bold mb-2">Hoàn thiện hồ sơ</h2>
              <p className="text-muted text-sm mb-6">Một chút về bản thân sẽ giúp bạn dễ match hơn.</p>
              
              <div className="space-y-4">
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
                  <label className="block text-sm font-medium mb-2">Mục tiêu luyện tập chính</label>
                  <select 
                    className="w-full h-12 rounded-xl border border-border bg-transparent px-4 outline-none focus:border-primary"
                    value={intent}
                    onChange={(e) => setIntent(e.target.value)}
                  >
                    <option value="Giao tiếp casual">Giao tiếp casual</option>
                    <option value="Thi cử">Thi cử (IELTS, JLPT...)</option>
                    <option value="Du lịch">Du lịch</option>
                    <option value="Làm việc">Làm việc</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button variant="ghost" onClick={() => setStep(2)} disabled={loading}>Quay lại</Button>
              <Button className="flex-1" onClick={submitStep3} disabled={loading}>
                {loading ? "Đang lưu..." : "Hoàn tất & Khám phá"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
