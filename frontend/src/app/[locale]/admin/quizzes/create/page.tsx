"use client";

import * as React from "react";
import { Link, useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Plus,
  Play,
  Sparkles,
  Upload,
  AlertCircle,
  X,
  HelpCircle,
  Lock,
  Trophy,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

type StepIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface VocabRow {
  id: number;
  word: string;
  phonetic: string;
  meaning: string;
  type: string;
  example: string;
  distractors: string[];
  status: "valid" | "warning";
}

const DEFAULT_SAMPLE_ROWS: VocabRow[] = [
  {
    id: 1,
    word: "Thunderstorm",
    phonetic: "/ˈθʌn.də.stɔːm/",
    meaning: "Cơn giông bão",
    type: "Danh từ",
    example: "A severe thunderstorm damaged several houses.",
    distractors: ["Nắng nhẹ", "Sương mù", "Tuyết rơi"],
    status: "valid",
  },
  {
    id: 2,
    word: "Humidity",
    phonetic: "/hjuːˈmɪd.ə.ti/",
    meaning: "Độ ẩm không khí",
    type: "Danh từ",
    example: "The humidity is very high today.",
    distractors: ["Nhiệt độ", "Áp suất", "Gió mùa"],
    status: "valid",
  },
  {
    id: 3,
    word: "Precipitation",
    phonetic: "/prɪˌsɪp.ɪˈteɪ.ʃən/",
    meaning: "Lượng mưa / hiện tượng giáng thủy",
    type: "Danh từ",
    example: "Heavy precipitation is expected tonight.",
    distractors: ["Nắng ráo", "Hạn hán", "Sương giá"],
    status: "valid",
  },
  {
    id: 4,
    word: "Breeze",
    phonetic: "/briːz/",
    meaning: "Cơn gió nhẹ",
    type: "Danh từ",
    example: "A cool breeze blew in from the sea.",
    distractors: ["Bão tố", "Gió lốc", "Mưa rào"],
    status: "valid",
  },
  {
    id: 5,
    word: "Overcast",
    phonetic: "/ˌəʊ.vəˈkɑːst/",
    meaning: "U ám / mây bao phủ",
    type: "Tính từ",
    example: "The sky was dark and overcast.",
    distractors: ["Trong xanh", "Rực rỡ", "Nhiều nắng"],
    status: "valid",
  },
];

export default function QuizCreatePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = React.useState<StepIndex>(1);

  // Form State - Bước 1
  const [language, setLanguage] = React.useState("");
  const [level, setLevel] = React.useState("");
  const [topic, setTopic] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");

  // Topic Modal State
  const [showTopicModal, setShowTopicModal] = React.useState(false);
  const [newTopicName, setNewTopicName] = React.useState("");
  const [topicsList, setTopicsList] = React.useState<string[]>([
    "Thời tiết",
    "Kinh tế",
    "Du lịch",
    "Công nghệ",
    "Giao tiếp hàng ngày",
    "Công sở",
    "Ẩm thực",
  ]);

  // Upload File State - Bước 3 & 4
  const [uploadedFile, setUploadedFile] = React.useState<File | null>(null);
  const [rows, setRows] = React.useState<VocabRow[]>(DEFAULT_SAMPLE_ROWS);

  // Practice Quiz State - Bước 6 (Làm thử)
  const [quizQuestionIndex, setQuizQuestionIndex] = React.useState(0);
  const [selectedAnswer, setSelectedAnswer] = React.useState<string | null>(null);
  const [quizScore, setQuizScore] = React.useState(100);
  const [showRankAnim, setShowRankAnim] = React.useState(false);
  const [timerSeconds, setTimerSeconds] = React.useState(10);

  // Step 7 Publish Demo States
  const [publishBlocked, setPublishBlocked] = React.useState(false);
  const [disableAnswerEdit, setDisableAnswerEdit] = React.useState(false);

  // Auto generate Title when Topic or Level changes
  React.useEffect(() => {
    if (topic && level) {
      setTitle(`${topic} — ${level}`);
    }
  }, [topic, level]);

  // Timer simulation for Step 6
  React.useEffect(() => {
    if (currentStep === 6 && timerSeconds > 0 && !selectedAnswer) {
      const interval = setInterval(() => {
        setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentStep, timerSeconds, selectedAnswer]);

  const handleNextStep = () => {
    if (currentStep < 7) {
      setCurrentStep((prev) => (prev + 1) as StepIndex);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as StepIndex);
    }
  };

  const handleAddTopic = () => {
    if (newTopicName.trim()) {
      setTopicsList((prev) => [...prev, newTopicName.trim()]);
      setTopic(newTopicName.trim());
      setNewTopicName("");
      setShowTopicModal(false);
    }
  };

  const parseCSVText = (text: string): VocabRow[] => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length <= 1) return [];

    const parsedRows: VocabRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const columns: string[] = [];
      let current = "";
      let inQuotes = false;

      for (let charIndex = 0; charIndex < line.length; charIndex++) {
        const char = line[charIndex];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          columns.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      columns.push(current.trim());

      if (columns.length >= 3 && columns[0]) {
        const word = columns[0].replace(/^["']|["']$/g, '');
        const phonetic = columns[1]?.replace(/^["']|["']$/g, '') || '';
        const meaning = columns[2]?.replace(/^["']|["']$/g, '') || '';
        const type = columns[3]?.replace(/^["']|["']$/g, '') || 'Danh từ';
        const example = columns[4]?.replace(/^["']|["']$/g, '') || '';
        const d1 = columns[5]?.replace(/^["']|["']$/g, '') || 'Đáp án sai 1';
        const d2 = columns[6]?.replace(/^["']|["']$/g, '') || 'Đáp án sai 2';
        const d3 = columns[7]?.replace(/^["']|["']$/g, '') || 'Đáp án sai 3';

        parsedRows.push({
          id: i,
          word,
          phonetic,
          meaning,
          type,
          example,
          distractors: [d1, d2, d3],
          status: "valid",
        });
      }
    }
    return parsedRows;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          const parsed = parseCSVText(text);
          if (parsed.length > 0) {
            setRows(parsed);
          }
        }
      };
      reader.readAsText(file, "UTF-8");
    }
  };

  const stepsList = [
    { num: 1, label: "Tạo bộ đề" },
    { num: 2, label: "File mẫu" },
    { num: 3, label: "Upload" },
    { num: 4, label: "Kiểm tra" },
    { num: 5, label: "Kết quả" },
    { num: 6, label: "Làm thử" },
    { num: 7, label: "Publish" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-16">
      {/* Top Header & Breadcrumb */}
      <header className="border-b border-border bg-surface px-6 py-4 flex items-center justify-between shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-muted mb-0.5">
            <Link href="/admin/quizzes" className="hover:text-primary transition-colors">
              Bộ đề
            </Link>
            <span>·</span>
            <span className="text-foreground">Soạn mới</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">Bộ đề mới</h1>
        </div>

        <button
          onClick={() => router.push("/admin/quizzes")}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-muted hover:text-foreground hover:bg-muted/10 rounded-xl transition-all border border-border/60"
        >
          <X className="h-4 w-4" />
          Thoát
        </button>
      </header>

      {/* Stepper Header (7 Steps Bar) */}
      <div className="bg-surface/50 border-b border-border px-6 py-6 overflow-x-auto">
        <div className="max-w-4xl mx-auto flex items-center justify-between min-w-[640px] px-4">
          {stepsList.map((step, idx) => {
            const isCompleted = currentStep > step.num;
            const isCurrent = currentStep === step.num;

            return (
              <React.Fragment key={step.num}>
                <div
                  onClick={() => setCurrentStep(step.num as StepIndex)}
                  className="flex flex-col items-center cursor-pointer group"
                >
                  <div
                    className={cn(
                      "h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-2xs",
                      isCurrent
                        ? "bg-primary text-primary-foreground ring-4 ring-primary/20 scale-105"
                        : isCompleted
                        ? "bg-emerald-600 text-white"
                        : "bg-surface border-2 border-border text-muted group-hover:border-primary/50"
                    )}
                  >
                    {isCompleted ? <Check className="h-4 w-4 stroke-[3]" /> : step.num}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-semibold mt-2 transition-colors",
                      isCurrent ? "text-primary font-bold" : isCompleted ? "text-foreground" : "text-muted"
                    )}
                  >
                    {step.label}
                  </span>
                </div>

                {idx < stepsList.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 mx-2 rounded-full transition-colors",
                      currentStep > step.num + 1
                        ? "bg-emerald-500"
                        : currentStep > step.num
                        ? "bg-primary"
                        : "bg-border"
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Main Form Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-6 md:p-8 mt-4">
        {/* STEP 1 — Tạo bộ đề */}
        {currentStep === 1 && (
          <div className="bg-surface rounded-2xl border border-border shadow-xs p-6 md:p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground">Bước 1 — Tạo bộ đề</h2>
              <p className="text-sm text-muted mt-1">Điền thông tin cơ bản để tạo bộ đề mới.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Ngôn ngữ */}
              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                  Ngôn ngữ <span className="text-rose-500">*</span>
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">— Chọn ngôn ngữ —</option>
                  <option value="Tiếng Anh">Tiếng Anh</option>
                  <option value="Tiếng Nhật">Tiếng Nhật</option>
                  <option value="Tiếng Hàn">Tiếng Hàn</option>
                  <option value="Tiếng Trung">Tiếng Trung</option>
                  <option value="Tiếng Tây Ban Nha">Tiếng Tây Ban Nha</option>
                  <option value="Tiếng Pháp">Tiếng Pháp</option>
                </select>
              </div>

              {/* Trình độ */}
              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                  Trình độ <span className="text-rose-500">*</span>
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">— Chọn trình độ —</option>
                  <option value="A1">A1 (Sơ cấp)</option>
                  <option value="A2">A2 (Sơ trung cấp)</option>
                  <option value="B1">B1 (Trung cấp)</option>
                  <option value="B2">B2 (Trung cao cấp)</option>
                  <option value="C1">C1 (Cao cấp)</option>
                  <option value="C2">C2 (Thành thạo)</option>
                  <option value="N5">JLPT N5</option>
                  <option value="N3">JLPT N3</option>
                  <option value="N1">JLPT N1</option>
                </select>
              </div>

              {/* Chủ đề từ vựng */}
              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                  Chủ đề từ vựng <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 text-sm bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">— Chọn chủ đề —</option>
                    {topicsList.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>

                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setShowTopicModal(true)}
                    className="shrink-0 flex items-center gap-1 bg-primary/5 hover:bg-primary/10 text-primary border-primary/20 text-xs font-semibold rounded-xl px-3"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Chủ đề mới
                  </Button>
                </div>
              </div>

              {/* Tiêu đề bộ đề */}
              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                  Tiêu đề bộ đề
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Tự điền khi chọn chủ đề + trình độ"
                  className="py-2.5 text-sm rounded-xl"
                />
              </div>
            </div>

            {/* Mô tả */}
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                Mô tả <span className="text-muted font-normal">(tùy chọn)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Giới thiệu ngắn về bộ đề..."
                rows={3}
                className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>

            {/* Submit Action */}
            <div className="pt-4 flex justify-end">
              <Button
                onClick={handleNextStep}
                disabled={!language || !level || !topic}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-3 rounded-xl shadow-xs disabled:opacity-50"
              >
                Tạo bộ đề →
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2 — File mẫu */}
        {currentStep === 2 && (
          <div className="bg-surface rounded-2xl border border-border shadow-xs p-6 md:p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground">Bước 2 — Tải file mẫu</h2>
              <p className="text-sm text-muted mt-1">Tải xuống template mẫu để nhập danh sách từ vựng & câu hỏi.</p>
            </div>

            <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 space-y-4">
              <div className="flex items-start gap-3">
                <FileSpreadsheet className="h-8 w-8 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-foreground">Template Excel / CSV chuẩn</h3>
                  <p className="text-xs text-muted mt-1">
                    File mẫu chứa các cột chuẩn: <code>Word</code>, <code>Phonetic</code>, <code>Meaning</code>, <code>POS</code>, <code>Example</code>, <code>Distractor 1</code>, <code>Distractor 2</code>, <code>Distractor 3</code>.
                  </p>
                </div>
              </div>

              <Button
                onClick={() => {
                  const blob = new Blob([
                    "Word,Phonetic,Meaning,POS,Example,Distractor1,Distractor2,Distractor3\nThunderstorm,/ˈθʌn.də.stɔːm/,Cơn giông bão,Danh từ,A severe thunderstorm damaged several houses.,Nắng nhẹ,Sương mù,Tuyết rơi"
                  ], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "LangAdmin_Quiz_Template.csv";
                  a.click();
                }}
                className="flex items-center gap-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl px-4 py-2.5"
              >
                <Download className="h-4 w-4" />
                Tải file mẫu CSV
              </Button>
            </div>

            <div className="flex justify-between pt-4 border-t border-border">
              <Button variant="outline" onClick={handlePrevStep} className="rounded-xl px-5">
                ← Quay lại
              </Button>
              <Button onClick={handleNextStep} className="bg-primary text-primary-foreground rounded-xl px-6">
                Tiếp tục: Upload →
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3 — Upload */}
        {currentStep === 3 && (
          <div className="bg-surface rounded-2xl border border-border shadow-xs p-6 md:p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground">Bước 3 — Upload dữ liệu</h2>
              <p className="text-sm text-muted mt-1">Tải file danh sách từ vựng Excel/CSV của bộ đề lên hệ thống.</p>
            </div>

            <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center bg-background hover:bg-muted/5 transition-colors cursor-pointer relative">
              <input
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload className="h-10 w-10 text-primary mx-auto mb-3" />
              <p className="font-semibold text-foreground">Kéo thả file vào đây hoặc bấm để chọn file</p>
              <p className="text-xs text-muted mt-1">Hỗ trợ các định dạng .CSV, .XLSX (Tối đa 10MB)</p>
            </div>

            {uploadedFile ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
                  <div>
                    <p className="text-xs font-bold text-foreground">{uploadedFile.name}</p>
                    <p className="text-[11px] text-muted">{(uploadedFile.size / 1024).toFixed(1)} KB · Đã trích xuất {rows.length} từ vựng</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-500/20 px-2.5 py-1 rounded-full">
                  Đã tải lên
                </span>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-muted/10 border border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-6 w-6 text-primary" />
                  <div>
                    <p className="text-xs font-bold text-foreground">Dữ liệu mẫu demo (5 từ vựng mẫu)</p>
                    <p className="text-[11px] text-muted">Mã bộ đề: {title || "Thời tiết — B1"}</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                  Mặc định sẵn có
                </span>
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-border">
              <Button variant="outline" onClick={handlePrevStep} className="rounded-xl px-5">
                ← Quay lại
              </Button>
              <Button onClick={handleNextStep} className="bg-primary text-primary-foreground rounded-xl px-6">
                Kiểm tra dữ liệu →
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4 — Kiểm tra */}
        {currentStep === 4 && (
          <div className="bg-surface rounded-2xl border border-border shadow-xs p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">Bước 4 — Kiểm tra dữ liệu từ vựng</h2>
                <p className="text-sm text-muted mt-1">Bảng trích xuất dữ liệu từ file <strong>{uploadedFile?.name || "CSV mẫu"}</strong>. Kiểm tra thông tin trước khi tiếp tục.</p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full border border-emerald-500/20">
                {rows.length} từ vựng hợp lệ
              </span>
            </div>

            <div className="border border-border rounded-xl overflow-x-auto shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/15 font-semibold text-muted border-b border-border uppercase tracking-wider">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Từ vựng</th>
                    <th className="p-3">Phiên âm</th>
                    <th className="p-3">Nghĩa tiếng Việt</th>
                    <th className="p-3">Loại từ</th>
                    <th className="p-3">Ví dụ</th>
                    <th className="p-3">Đáp án sai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((r, i) => (
                    <tr key={r.id} className="hover:bg-muted/5">
                      <td className="p-3 font-semibold text-muted">{i + 1}</td>
                      <td className="p-3 font-bold text-foreground">{r.word}</td>
                      <td className="p-3 text-muted">{r.phonetic}</td>
                      <td className="p-3 font-medium text-emerald-700">{r.meaning}</td>
                      <td className="p-3">{r.type}</td>
                      <td className="p-3 text-muted italic max-w-xs truncate">{r.example || "—"}</td>
                      <td className="p-3 text-muted">{r.distractors.filter(Boolean).join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between pt-4 border-t border-border">
              <Button variant="outline" onClick={handlePrevStep} className="rounded-xl px-5">
                ← Quay lại
              </Button>
              <Button onClick={handleNextStep} className="bg-primary text-primary-foreground rounded-xl px-6">
                Xem kết quả phân tích →
              </Button>
            </div>
          </div>
        )}

        {/* STEP 5 — Kết quả */}
        {currentStep === 5 && (
          <div className="bg-surface rounded-2xl border border-border shadow-xs p-6 md:p-8 space-y-6 text-center">
            <div className="h-16 w-16 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500/20">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground">Bước 5 — Kiểm tra kết quả phân tích</h2>
              <p className="text-sm text-muted mt-1 max-w-md mx-auto">
                Tất cả dữ liệu từ vựng & câu hỏi trắc nghiệm đã được quét thành công. Không có lỗi định dạng!
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto pt-2">
              <div className="p-4 rounded-2xl bg-background border border-border">
                <p className="text-2xl font-extrabold text-foreground">{rows.length}</p>
                <p className="text-[11px] font-semibold text-muted uppercase mt-1">Tổng câu</p>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-2xl font-extrabold text-emerald-600">{rows.length}</p>
                <p className="text-[11px] font-semibold text-emerald-700 uppercase mt-1">Hợp lệ</p>
              </div>
              <div className="p-4 rounded-2xl bg-background border border-border">
                <p className="text-2xl font-extrabold text-muted">0</p>
                <p className="text-[11px] font-semibold text-muted uppercase mt-1">Bị lỗi</p>
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-border">
              <Button variant="outline" onClick={handlePrevStep} className="rounded-xl px-5">
                ← Quay lại
              </Button>
              <Button onClick={handleNextStep} className="bg-primary text-primary-foreground rounded-xl px-6 flex items-center gap-2">
                <Play className="h-4 w-4 fill-current" />
                Làm thử bộ đề →
              </Button>
            </div>
          </div>
        )}

        {/* STEP 6 — Làm thử (Full interactive Quiz Demo overlay) */}
        {currentStep === 6 && (
          <div className="bg-surface rounded-2xl border border-border shadow-xs p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">Bước 6 — Làm thử giao diện Quiz</h2>
                <p className="text-sm text-muted mt-1">Trải nghiệm màn chơi thử của học viên trực tiếp trên Admin.</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 fill-current" />
                Speed Bonus Enabled
              </span>
            </div>

            {/* Simulated Quiz Card Canvas */}
            <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 space-y-6 shadow-xl relative overflow-hidden">
              {/* Leaderboard notification simulation banner */}
              <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl px-4 py-2 text-xs font-bold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-emerald-400" />
                  <span>Bảng xếp hạng: Thăng hạng 9 → 7 (Promotion Zone)!</span>
                </div>
                <span className="text-[10px] bg-emerald-500/30 px-2 py-0.5 rounded">+50 pts speed</span>
              </div>

              {/* Header inside Quiz */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                    Câu hỏi {quizQuestionIndex + 1} / {rows.length}
                  </p>
                  <h3 className="text-2xl font-extrabold text-white mt-1">
                    "{rows[quizQuestionIndex]?.word}" có nghĩa là gì?
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Phiên âm: {rows[quizQuestionIndex]?.phonetic}</p>
                </div>

                {/* Circular SVG Timer */}
                <div className="relative h-14 w-14 flex items-center justify-center">
                  <svg className="h-full w-full transform -rotate-90">
                    <circle cx="28" cy="28" r="22" stroke="currentColor" strokeWidth="4" className="text-slate-800" fill="transparent" />
                    <circle
                      cx="28"
                      cy="28"
                      r="22"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeDasharray="138"
                      strokeDashoffset={138 - (138 * timerSeconds) / 10}
                      className={cn(
                        "transition-all duration-1000",
                        timerSeconds <= 3 ? "text-rose-500" : timerSeconds <= 6 ? "text-amber-500" : "text-emerald-400"
                      )}
                      fill="transparent"
                    />
                  </svg>
                  <span className="absolute font-extrabold text-sm text-white">{timerSeconds}s</span>
                </div>
              </div>

              {/* Options grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  rows[quizQuestionIndex]?.meaning,
                  ...rows[quizQuestionIndex]?.distractors,
                ]
                  .sort()
                  .map((option, idx) => {
                    const isCorrect = option === rows[quizQuestionIndex]?.meaning;
                    const isSelected = selectedAnswer === option;

                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedAnswer(option);
                          if (isCorrect) {
                            setQuizScore((prev) => prev + 100);
                            setShowRankAnim(true);
                          }
                        }}
                        className={cn(
                          "p-4 rounded-2xl text-left font-semibold text-sm transition-all border flex items-center justify-between",
                          selectedAnswer
                            ? isCorrect
                              ? "bg-emerald-600 text-white border-emerald-400 shadow-md"
                              : isSelected
                              ? "bg-rose-600 text-white border-rose-400"
                              : "bg-slate-800/60 text-slate-400 border-slate-700 opacity-60"
                            : "bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700"
                        )}
                      >
                        <span>{option}</span>
                        {selectedAnswer && isCorrect && <Check className="h-5 w-5 text-white" />}
                      </button>
                    );
                  })}
              </div>

              {/* Next Question inside trial */}
              {selectedAnswer && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      setSelectedAnswer(null);
                      setTimerSeconds(10);
                      setQuizQuestionIndex((prev) => (prev + 1) % rows.length);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/90 transition-all flex items-center gap-1.5"
                  >
                    Câu tiếp theo →
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4 border-t border-border">
              <Button variant="outline" onClick={handlePrevStep} className="rounded-xl px-5">
                ← Quay lại
              </Button>
              <Button onClick={handleNextStep} className="bg-primary text-primary-foreground rounded-xl px-6">
                Chuyển sang Publish →
              </Button>
            </div>
          </div>
        )}

        {/* STEP 7 — Publish */}
        {currentStep === 7 && (
          <div className="bg-surface rounded-2xl border border-border shadow-xs p-6 md:p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground">Bước 7 — Cấu hình & Đăng bộ đề</h2>
              <p className="text-sm text-muted mt-1">Xem lại tổng thể và kích hoạt phát hành bộ đề lên ứng dụng.</p>
            </div>

            <div className="p-5 rounded-2xl bg-background border border-border space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <h3 className="font-bold text-foreground">{title || "Thời tiết — B1"}</h3>
                  <p className="text-xs text-muted">Ngôn ngữ: {language || "Tiếng Anh"} · Trình độ: {level || "B1"}</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  {rows.length} từ vựng
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1">
                  <span className="text-muted">Chủ đề từ vựng:</span>
                  <span className="font-semibold text-foreground">{topic || "Thời tiết"}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted">Trạng thái phát hành:</span>
                  <span className="font-bold text-emerald-600">Sẵn sàng (Active)</span>
                </div>
              </div>
            </div>

            {/* Bottom Bar Demo Restriction Toggles matching Figma */}
            <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Lock className="h-4 w-4 text-amber-400" />
                <span className="font-semibold">Demo trạng thái bị chặn:</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPublishBlocked(!publishBlocked)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg font-bold text-[11px] transition-colors border",
                    publishBlocked
                      ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                      : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                  )}
                >
                  A — Publish bị vô hiệu hóa
                </button>
                <button
                  type="button"
                  onClick={() => setDisableAnswerEdit(!disableAnswerEdit)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg font-bold text-[11px] transition-colors border",
                    disableAnswerEdit
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                  )}
                >
                  B — Không thể đổi đáp án
                </button>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-border">
              <Button variant="outline" onClick={handlePrevStep} className="rounded-xl px-5">
                ← Quay lại
              </Button>
              <Button
                disabled={publishBlocked}
                onClick={() => {
                  alert(`Đã xuất bản bộ đề "${title || "Thời tiết — B1"}" thành công!`);
                  router.push("/admin/quizzes");
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-7 py-3 shadow-md disabled:opacity-50 flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Hoàn tất & Đăng bộ đề
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Modal Thêm chủ đề mới */}
      {showTopicModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-border shadow-xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground">Thêm chủ đề mới</h3>
              <button onClick={() => setShowTopicModal(false)} className="text-muted hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted mb-1.5">Tên chủ đề từ vựng</label>
              <Input
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                placeholder="VD: Khoa học vũ trụ, Y tế..."
                className="rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setShowTopicModal(false)} className="rounded-xl">
                Hủy
              </Button>
              <Button onClick={handleAddTopic} className="bg-primary text-primary-foreground rounded-xl">
                Thêm chủ đề
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
