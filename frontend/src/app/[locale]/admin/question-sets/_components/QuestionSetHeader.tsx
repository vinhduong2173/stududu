"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PublishGate, QuestionSetDetail } from "@/lib/questionSets";

interface QuestionSetHeaderProps {
  set: QuestionSetDetail;
  gate: PublishGate;
  busy: boolean;
  onPublish: () => void;
}

export function QuestionSetHeader({ set, gate, busy, onPublish }: QuestionSetHeaderProps) {
  const isPublished = set.status === "published";

  return (
    <div className="space-y-4">
      <Link
        href="/admin/question-sets"
        className="inline-flex items-center text-xs font-semibold text-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Quay lại danh sách bộ đề
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{set.title}</h1>
          <p className="mt-1 text-sm text-muted">
            {set.language.name} · {set.topic.name} · {set.framework} {set.level}
          </p>
        </div>
        {!isPublished && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              disabled={busy || !gate.canPublish}
              onClick={onPublish}
            >
              <Send className="mr-2 h-4 w-4" /> Xuất bản (Publish)
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
