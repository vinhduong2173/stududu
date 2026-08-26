import * as React from "react";
import { CheckCircle2, Circle, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuestionOptionItemProps {
  label: string;
  isCorrect?: boolean;
  isHidden?: boolean;
  value: string;
  placeholder?: string;
  canHide?: boolean;
  onChange: (val: string) => void;
  onSetCorrect: () => void;
  onToggleHidden?: () => void;
}

export function QuestionOptionItem({
  label,
  isCorrect = false,
  isHidden = false,
  value,
  placeholder,
  canHide = true,
  onChange,
  onSetCorrect,
  onToggleHidden,
}: QuestionOptionItemProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border p-2.5 transition-all sm:p-3",
        isHidden
          ? "border-border/40 bg-muted/10 opacity-50"
          : isCorrect
          ? "border-emerald-500/40 bg-emerald-500/5 ring-1 ring-emerald-500/20"
          : "border-border bg-background hover:border-border/80"
      )}
    >
      {/* Radio button outside textbox */}
      <button
        type="button"
        onClick={isHidden ? undefined : onSetCorrect}
        disabled={isHidden}
        className={cn(
          "flex items-center gap-1.5 shrink-0 group focus:outline-none",
          isHidden ? "cursor-not-allowed" : "cursor-pointer"
        )}
        title={isHidden ? "Option đã ẩn" : "Bấm để đặt làm đáp án đúng"}
      >
        {isCorrect && !isHidden ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
        ) : (
          <Circle className={cn(
            "h-5 w-5 shrink-0",
            isHidden ? "text-muted/40" : "text-muted group-hover:text-emerald-500"
          )} />
        )}
        <span
          className={cn(
            "text-xs font-bold transition-colors",
            isHidden
              ? "text-muted/40"
              : isCorrect
              ? "text-emerald-700"
              : "text-muted group-hover:text-foreground"
          )}
        >
          {label}
        </span>
      </button>

      {/* Text input only */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={isHidden}
        placeholder={placeholder || `Nhập đáp án ${label}...`}
        className={cn(
          "flex-1 bg-transparent text-xs sm:text-sm font-medium text-foreground focus:outline-none",
          isHidden && "text-muted/40 line-through cursor-not-allowed",
          isCorrect && !isHidden && "font-semibold text-emerald-950"
        )}
      />

      {/* Eye toggle button to hide/show option */}
      {canHide && onToggleHidden && (
        <button
          type="button"
          onClick={onToggleHidden}
          className={cn(
            "rounded-lg p-1.5 shrink-0 transition-colors cursor-pointer focus:outline-none",
            isHidden
              ? "text-muted/50 hover:text-foreground hover:bg-muted/15"
              : "text-muted hover:text-rose-500 hover:bg-rose-50"
          )}
          title={isHidden ? "Hiện lại option này" : "Ẩn option này"}
        >
          {isHidden ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      )}
    </div>
  );
}
