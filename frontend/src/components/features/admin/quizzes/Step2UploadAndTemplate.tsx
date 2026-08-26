import * as React from "react";
import { Download, FileSpreadsheet, Trash2, Upload, PenLine } from "lucide-react";
import { Button } from "@/components/ui/Button";

type InputMode = "csv" | "manual" | null;

interface Step2UploadAndTemplateProps {
  uploadedFile: File | null;
  rowsCount: number;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: () => void;
  onAddRow: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export function Step2UploadAndTemplate({
  uploadedFile,
  rowsCount,
  onFileUpload,
  onRemoveFile,
  onAddRow,
  onPrev,
  onNext,
}: Step2UploadAndTemplateProps) {
  const [inputMode, setInputMode] = React.useState<InputMode>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleDownloadSample = () => {
    const csvContent =
      "Word,Phonetic,Meaning,POS,Example,Distractor1,Distractor2,Distractor3\n" +
      "Thunderstorm,/ˈθʌn.də.stɔːm/,Cơn giông bão,Danh từ,A severe thunderstorm damaged several houses.,Nắng nhẹ,Sương mù,Tuyết rơi\n" +
      "Humidity,/hjuːˈmɪd.ə.ti/,Độ ẩm không khí,Danh từ,The humidity is very high today.,Nhiệt độ,Áp suất,Gió mùa\n" +
      "Precipitation,/prɪˌsɪp.ɪˈteɪ.ʃən/,Lượng mưa / hiện tượng giáng thủy,Danh từ,Heavy precipitation is expected tonight.,Nắng ráo,Hạn hán,Sương giá";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "LangAdmin_Quiz_Template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRemove = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
    onRemoveFile();
  };

  const handleSelectManual = () => {
    handleRemove();
    setInputMode("manual");
    if (rowsCount === 0) onAddRow();
  };

  const handleSelectCsv = () => {
    setInputMode("csv");
  };

  return (
    <div className="space-y-6 rounded-2xl border border-border bg-surface p-6 shadow-xs md:p-8">
      <div>
        <h2 className="text-xl font-bold text-foreground">
          Bước 2 — Nhập dữ liệu câu hỏi
        </h2>
        <p className="mt-1 text-sm text-muted">
          Chọn cách nhập dữ liệu câu hỏi cho bộ đề của bạn.
        </p>
      </div>

      {/* Mode Selector */}
      <ModeSelector inputMode={inputMode} onSelectCsv={handleSelectCsv} onSelectManual={handleSelectManual} />

      {/* CSV Upload Section */}
      {inputMode === "csv" && (
        <CsvUploadSection
          fileInputRef={fileInputRef}
          uploadedFile={uploadedFile}
          onFileUpload={onFileUpload}
          onRemove={handleRemove}
          onDownloadSample={handleDownloadSample}
        />
      )}

      {/* Manual Creation Section */}
      {inputMode === "manual" && (
        <ManualCreateSection />
      )}

      {/* Navigation */}
      <div className="flex justify-between border-t border-border pt-4">
        <Button variant="outline" onClick={onPrev} className="rounded-xl px-5">
          ← Quay lại
        </Button>
        <Button
          disabled={rowsCount === 0}
          onClick={onNext}
          className="rounded-xl bg-primary px-6 text-primary-foreground disabled:opacity-50"
        >
          Tiếp theo →
        </Button>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function ModeSelector({
  inputMode,
  onSelectCsv,
  onSelectManual,
}: {
  inputMode: InputMode;
  onSelectCsv: () => void;
  onSelectManual: () => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <ModeCard
        active={inputMode === "csv"}
        icon={<Upload className="h-6 w-6" />}
        title="Upload file CSV"
        description="Tải file danh sách câu hỏi đã chuẩn bị sẵn"
        onClick={onSelectCsv}
      />
      <ModeCard
        active={inputMode === "manual"}
        icon={<PenLine className="h-6 w-6" />}
        title="Tạo thủ công"
        description="Nhập từng câu hỏi và đáp án trực tiếp"
        onClick={onSelectManual}
      />
    </div>
  );
}

function ModeCard({
  active,
  icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all cursor-pointer ${
        active
          ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-sm"
          : "border-border bg-background hover:border-primary/30 hover:bg-muted/5"
      }`}
    >
      <div className={`shrink-0 rounded-xl p-2.5 ${active ? "bg-primary/10 text-primary" : "bg-muted/10 text-muted"}`}>
        {icon}
      </div>
      <div>
        <p className={`text-sm font-bold ${active ? "text-primary" : "text-foreground"}`}>{title}</p>
        <p className="text-xs text-muted">{description}</p>
      </div>
    </button>
  );
}

function CsvUploadSection({
  fileInputRef,
  uploadedFile,
  onFileUpload,
  onRemove,
  onDownloadSample,
}: {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  uploadedFile: File | null;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  onDownloadSample: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* Download template */}
      <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="h-6 w-6 text-primary shrink-0" />
          <div>
            <p className="text-xs font-bold text-foreground">Chưa có file đề mẫu?</p>
            <p className="text-[11px] text-muted">
              Tải file mẫu chuẩn với các cột: <code>Word, Phonetic, Meaning, POS, Example, Distractor 1..3</code>
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onDownloadSample}
          className="gap-1.5 rounded-xl border-primary/30 text-xs font-semibold text-primary hover:bg-primary/10 shrink-0"
        >
          <Download className="h-3.5 w-3.5" /> Tải file mẫu CSV
        </Button>
      </div>

      {/* Upload area */}
      <div className="relative cursor-pointer rounded-2xl border-2 border-dashed border-border bg-background p-8 text-center transition-colors hover:bg-muted/5">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx"
          onChange={onFileUpload}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
        <Upload className="mx-auto mb-3 h-10 w-10 text-primary" />
        <p className="font-semibold text-foreground">Kéo thả file vào đây hoặc bấm để chọn file</p>
        <p className="mt-1 text-xs text-muted">Hỗ trợ định dạng .CSV, .XLSX (Tối đa 10MB)</p>
      </div>

      {/* File info */}
      {uploadedFile ? (
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <div className="flex items-center gap-3 min-w-0">
            <FileSpreadsheet className="h-6 w-6 text-emerald-600 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate">{uploadedFile.name}</p>
              <p className="text-[11px] text-muted">
                {(uploadedFile.size / 1024).toFixed(1)} KB · Tệp đã sẵn sàng
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-100 hover:text-rose-700 shrink-0"
            title="Gỡ bỏ file này"
          >
            <Trash2 className="h-3.5 w-3.5" /> Gỡ bỏ
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-muted/5 p-4 text-center text-xs text-muted">
          Chưa có file nào được chọn. Vui lòng tải lên file <strong>.CSV</strong> đã chuẩn bị để tiếp tục.
        </div>
      )}
    </div>
  );
}

function ManualCreateSection() {
  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-center">
      <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
        <PenLine className="h-6 w-6 text-emerald-600" />
      </div>
      <p className="text-sm font-bold text-foreground">Chế độ tạo thủ công</p>
      <p className="mt-1 text-xs text-muted">
        Bấm &quot;Tiếp theo&quot; để bắt đầu nhập câu hỏi và đáp án.
      </p>
    </div>
  );
}
