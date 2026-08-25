"use client";

import * as React from "react";
import { AlertTriangle, Eye, PencilLine, Sparkles, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { QuizQuestionCard } from "@/components/features/QuizQuestionCard";
import { api, apiUpload, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  DryRunResponse,
  QUESTION_TYPES,
  QuestionTypeValue,
  REQUIRED_QUESTION_COUNT,
} from "@/lib/questionSets";

const INPUT =
  "w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-foreground outline-none transition-colors focus:border-primary";

const ACCEPTED = ".pdf,.docx,.txt";

/** Câu nháp đang chỉnh trong bảng xem trước (chưa lưu DB) */
type DraftQuestion = {
  key: string;
  type: QuestionTypeValue;
  term: string;
  passage: string;
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  /** Lỗi backend trả về ở lần kiểm gần nhất; xoá khi Admin sửa lại dòng */
  errors: string[];
};

/**
 * Kiểm nhanh phía client để nút "Nhập" không hứa suông rồi để backend từ chối cả lô.
 * Backend (`QuestionValidatorService`) vẫn là nơi quyết định — đây chỉ là bản rút gọn
 * đủ để bắt những lỗi Admin nhìn thấy ngay trên form.
 */
function draftIssues(draft: DraftQuestion): string[] {
  const issues: string[] = [];
  if (!draft.prompt.trim()) issues.push("Thiếu nội dung câu hỏi");

  const options = draft.options.map((o) => o.trim());
  if (options.some((o) => !o)) issues.push("Có đáp án để trống");
  else if (new Set(options.map((o) => o.toLowerCase())).size !== options.length) {
    issues.push("Có hai đáp án trùng nội dung");
  }
  if (draft.answerIndex < 0 || draft.answerIndex > 3) {
    issues.push("Chưa chọn đáp án đúng");
  }
  if (draft.type === "vocabulary" && !draft.term.trim()) {
    issues.push('Câu loại "Từ vựng" phải có từ vựng gốc');
  }
  if ((draft.type === "cloze" || draft.type === "reading") && !draft.passage.trim()) {
    issues.push("Loại câu này phải có đoạn văn");
  }
  return issues;
}

export function GeneratePanel({
  setId,
  remainingSlots,
  onImported,
}: {
  setId: number;
  remainingSlots: number;
  onImported: () => void;
}) {
  // Trần là số chỗ còn trống: sinh nhiều hơn chỗ trống thì chắc chắn nhập không lọt
  // (bộ đề chốt đúng REQUIRED_QUESTION_COUNT câu)
  const maxCount = Math.max(1, Math.min(REQUIRED_QUESTION_COUNT, remainingSlots));
  const [file, setFile] = React.useState<File | null>(null);
  const [questionCount, setQuestionCount] = React.useState(maxCount);
  const [note, setNote] = React.useState("");
  const [generating, setGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [drafts, setDrafts] = React.useState<DraftQuestion[] | null>(null);
  const [sourceMeta, setSourceMeta] = React.useState<Record<string, unknown> | null>(null);
  const [truncated, setTruncated] = React.useState(false);
  // Toggle "👁 Xem như học viên" — addendum mục 4
  const [previewMode, setPreviewMode] = React.useState(false);
  const [importing, setImporting] = React.useState(false);

  const generate = async () => {
    if (!file) return;
    setGenerating(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("questionCount", String(questionCount));
      if (note) form.append("note", note);

      const res = await apiUpload<DryRunResponse>(
        `/admin/question-sets/${setId}/generate`,
        form,
      );
      setSourceMeta(res.sourceMeta);
      setTruncated(res.truncated);
      setDrafts(
        res.rows.map((row, i) => {
          const q = row.question;
          const raw = row.raw as Record<string, unknown>;
          return {
            key: `${Date.now()}-${i}`,
            type: (q?.type ?? (raw.type as QuestionTypeValue) ?? "vocabulary") as QuestionTypeValue,
            term: q?.term ?? (raw.term as string) ?? "",
            passage: q?.passage ?? (raw.passage as string) ?? "",
            prompt: q?.prompt ?? (raw.prompt as string) ?? "",
            options: normalizeOptions(q?.options ?? (raw.options as string[])),
            answerIndex: q?.answerIndex ?? (raw.answerIndex as number) ?? 0,
            explanation: q?.explanation ?? (raw.explanation as string) ?? "",
            errors: row.errors,
          };
        }),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không sinh được câu hỏi");
    } finally {
      setGenerating(false);
    }
  };

  const importAll = async () => {
    if (!drafts) return;
    setImporting(true);
    setError(null);
    try {
      await api(`/admin/question-sets/${setId}/questions/import`, {
        method: "POST",
        body: {
          // BR-53: giữ nguyên nguồn ai_generated dù Admin đã hiệu đính
          aiGenerated: true,
          sourceMeta,
          questions: drafts.map((d) => ({
            type: d.type,
            term: d.term || undefined,
            passage: d.passage || undefined,
            prompt: d.prompt,
            options: d.options,
            answerIndex: d.answerIndex,
            explanation: d.explanation || undefined,
          })),
        },
      });
      setDrafts(null);
      setFile(null);
      onImported();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Không nhập được câu hỏi — sửa các dòng còn lỗi rồi thử lại",
      );
    } finally {
      setImporting(false);
    }
  };

  const patch = (key: string, changes: Partial<DraftQuestion>) =>
    setDrafts((prev) =>
      prev ? prev.map((d) => (d.key === key ? { ...d, ...changes, errors: [] } : d)) : prev,
    );

  // Lỗi hiển thị = lỗi backend trả về (nếu chưa sửa) hoặc lỗi client tự thấy
  const issuesOf = (draft: DraftQuestion) =>
    draft.errors.length > 0 ? draft.errors : draftIssues(draft);

  const errorCount = drafts?.filter((d) => issuesOf(d).length > 0).length ?? 0;
  const overCapacity = (drafts?.length ?? 0) - remainingSlots;
  const blockedReason =
    errorCount > 0
      ? `Còn ${errorCount} câu chưa hợp lệ`
      : overCapacity > 0
        ? `Dư ${overCapacity} câu so với chỗ trống`
        : null;

  return (
    <div className="space-y-4">
      {!drafts && (
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-foreground">Sinh câu hỏi từ tài liệu</h3>
          </div>
          <p className="mb-4 text-sm text-muted">
            Hỗ trợ PDF, DOCX, TXT có chữ đọc được (tối đa 5MB). Chưa hỗ trợ ảnh scan.
            Câu AI sinh <strong>không tự vào bộ</strong> — bạn phải xem và duyệt trước.
          </p>

          <div className="space-y-3">
            <label
              className={cn(
                "flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-sm transition-colors",
                file ? "border-primary bg-primary/5 text-foreground" : "border-border text-muted hover:bg-muted/5",
              )}
            >
              <Upload className="h-4 w-4" />
              {file ? file.name : "Chọn file PDF / DOCX / TXT"}
              <input
                type="file"
                accept={ACCEPTED}
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-muted">
                  Số câu muốn sinh (tối đa {maxCount})
                </span>
                <input
                  type="number"
                  min={1}
                  max={maxCount}
                  className={INPUT}
                  value={questionCount}
                  // Kẹp ngay tại đây: gõ 50 rồi bấm sinh sẽ ăn lỗi 400 khó hiểu từ DTO
                  onChange={(e) =>
                    setQuestionCount(
                      Math.max(1, Math.min(maxCount, Number(e.target.value) || 1)),
                    )
                  }
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-muted">
                  Ghi chú cho AI (không bắt buộc)
                </span>
                <input
                  className={INPUT}
                  placeholder="vd: tập trung vào thì quá khứ"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </label>
            </div>

            <Button className="w-full" onClick={generate} disabled={!file || generating}>
              {generating ? (
                "AI đang soạn câu hỏi…"
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Sinh từ tài liệu</span>
                </span>
              )}
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {drafts && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4">
            <div className="text-sm">
              <p className="font-semibold text-foreground">
                AI sinh được {drafts.length} câu
                {errorCount > 0 && (
                  <span className="ml-2 text-rose-600">· {errorCount} câu cần sửa</span>
                )}
              </p>
              <p className="text-xs text-muted">
                Còn {remainingSlots} chỗ trống trong bộ. Sửa trực tiếp rồi bấm nhập.
              </p>
              {overCapacity > 0 && (
                <p className="mt-1 text-xs font-medium text-rose-600">
                  Bộ đề chỉ nhận đúng {REQUIRED_QUESTION_COUNT} câu — hãy bỏ bớt{" "}
                  {overCapacity} câu trước khi nhập.
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={previewMode ? "default" : "ghost"}
                size="sm"
                onClick={() => setPreviewMode((v) => !v)}
              >
                {previewMode ? (
                  <>
                    <PencilLine className="mr-2 h-4 w-4" /> Về chế độ soạn
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" /> Xem như học viên
                  </>
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setDrafts(null)}>
                Bỏ, sinh lại
              </Button>
              {/* Backend nhập cả lô hoặc không nhập gì — chặn từ đây để Admin không
                  bấm rồi mới biết cả 20 câu đều chưa vào */}
              <Button
                size="sm"
                onClick={importAll}
                disabled={importing || drafts.length === 0 || blockedReason !== null}
                title={blockedReason ?? undefined}
              >
                {importing
                  ? "Đang nhập…"
                  : (blockedReason ?? `Nhập ${drafts.length} câu vào bộ`)}
              </Button>
            </div>
          </div>

          {truncated && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Tài liệu dài hơn giới hạn nên chỉ 8.000 ký tự đầu được đưa vào AI. Câu
                hỏi có thể chưa phủ hết nội dung.
              </span>
            </div>
          )}

          {previewMode ? (
            <div className="space-y-3">
              <p className="rounded-xl border border-border bg-muted/5 p-3 text-xs text-muted">
                Đây đúng là giao diện học viên sẽ thấy. Thứ tự đáp án giữ nguyên như bạn
                nhập (không đảo) để dễ đối chiếu — lúc làm bài thật hệ thống mới đảo.
              </p>
              {drafts.map((d, i) => (
                <QuizQuestionCard
                  key={d.key}
                  question={{
                    id: i,
                    type: d.type,
                    term: d.term || null,
                    passage: d.passage || null,
                    prompt: d.prompt,
                    options: d.options,
                  }}
                  index={i}
                  total={drafts.length}
                  mode="preview"
                  correctIndex={d.answerIndex}
                  explanation={d.explanation || null}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {drafts.map((d, i) => (
                <DraftRow
                  key={d.key}
                  draft={d}
                  issues={issuesOf(d)}
                  index={i}
                  onChange={(changes) => patch(d.key, changes)}
                  onRemove={() =>
                    setDrafts((prev) => (prev ? prev.filter((x) => x.key !== d.key) : prev))
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DraftRow({
  draft,
  issues,
  index,
  onChange,
  onRemove,
}: {
  draft: DraftQuestion;
  issues: string[];
  index: number;
  onChange: (changes: Partial<DraftQuestion>) => void;
  onRemove: () => void;
}) {
  const hasError = issues.length > 0;
  return (
    <div
      className={cn(
        "rounded-2xl border bg-surface p-4",
        hasError ? "border-rose-300 bg-rose-50/40" : "border-border",
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {index + 1}
          </span>
          <select
            className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
            value={draft.type}
            onChange={(e) => onChange({ type: e.target.value as QuestionTypeValue })}
          >
            {QUESTION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={onRemove}
          className="rounded-lg p-1.5 text-muted transition-colors hover:bg-rose-50 hover:text-rose-600"
          title="Bỏ câu này"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {hasError && (
        <ul className="mb-3 list-inside list-disc rounded-lg bg-rose-100 p-2 text-xs text-rose-700">
          {issues.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}

      <div className="space-y-2">
        {draft.type === "vocabulary" && (
          <input
            className={INPUT}
            placeholder="Từ vựng gốc"
            value={draft.term}
            onChange={(e) => onChange({ term: e.target.value })}
          />
        )}
        {(draft.type === "cloze" || draft.type === "reading") && (
          <textarea
            className={cn(INPUT, "min-h-16")}
            placeholder="Đoạn văn"
            value={draft.passage}
            onChange={(e) => onChange({ passage: e.target.value })}
          />
        )}
        <textarea
          className={cn(INPUT, "min-h-16 font-medium")}
          placeholder="Câu hỏi"
          value={draft.prompt}
          onChange={(e) => onChange({ prompt: e.target.value })}
        />
        {draft.options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="radio"
              name={`answer-${draft.key}`}
              checked={draft.answerIndex === i}
              onChange={() => onChange({ answerIndex: i })}
              className="h-4 w-4 accent-primary"
            />
            <span className="w-4 text-xs font-bold text-muted">
              {String.fromCharCode(65 + i)}
            </span>
            <input
              className={INPUT}
              value={opt}
              onChange={(e) => {
                const next = [...draft.options];
                next[i] = e.target.value;
                onChange({ options: next });
              }}
            />
          </div>
        ))}
        <textarea
          className={cn(INPUT, "min-h-14 text-muted")}
          placeholder="Giải thích"
          value={draft.explanation}
          onChange={(e) => onChange({ explanation: e.target.value })}
        />
      </div>
    </div>
  );
}

/** AI có thể trả thiếu/thừa đáp án — luôn đưa về đúng 4 ô để Admin sửa tay */
function normalizeOptions(options?: string[]): string[] {
  const base = Array.isArray(options) ? options.map((o) => String(o ?? "")) : [];
  return [0, 1, 2, 3].map((i) => base[i] ?? "");
}
