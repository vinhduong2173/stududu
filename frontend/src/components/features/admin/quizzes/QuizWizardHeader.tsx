import * as React from "react";
import { Link, useRouter } from "@/i18n/routing";
import { X } from "lucide-react";

interface QuizWizardHeaderProps {
  title?: string;
}

export function QuizWizardHeader({ title }: QuizWizardHeaderProps) {
  const router = useRouter();

  return (
    <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-4 shadow-2xs">
      <div>
        <div className="mb-0.5 flex items-center gap-2 text-xs font-semibold text-muted">
          <Link href="/admin/quizzes" className="transition-colors hover:text-primary">
            Bộ đề
          </Link>
          <span>·</span>
          <span className="text-foreground">Soạn mới</span>
        </div>
        <h1 className="text-xl font-bold text-foreground">{title || "Bộ đề mới"}</h1>
      </div>

      <button
        onClick={() => router.push("/admin/quizzes")}
        className="flex items-center gap-1.5 rounded-xl border border-border/60 px-3 py-1.5 text-xs font-semibold text-muted transition-all hover:bg-muted/10 hover:text-foreground"
      >
        <X className="h-4 w-4" />
        Thoát
      </button>
    </header>
  );
}
