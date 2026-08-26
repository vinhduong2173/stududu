import * as React from "react";
import { ArrowLeft, Save } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";

interface EditQuizHeaderProps {
  title: string;
  language: string;
  level: string;
  saving: boolean;
  onSave: () => void;
}

export function EditQuizHeader({
  title,
  language,
  level,
  saving,
  onSave,
}: EditQuizHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-border bg-surface px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/quizzes"
          className="rounded-xl border border-border p-2 text-muted transition-colors hover:bg-muted/10 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {title || "Chỉnh sửa bộ đề"}
            </h1>
            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
              {language} · {level}
            </span>
          </div>
          <p className="text-xs text-muted">
            Chỉnh sửa cấu hình bộ đề và nội dung các câu hỏi trắc nghiệm.
          </p>
        </div>
      </div>

      <Button
        onClick={onSave}
        disabled={saving}
        className="flex items-center gap-2 rounded-xl bg-primary px-6 font-bold text-primary-foreground shadow-xs transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        <Save className="h-4 w-4" />
        {saving ? "Đang lưu..." : "Lưu thay đổi"}
      </Button>
    </div>
  );
}
