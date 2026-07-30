"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Clock,
  MessageSquare,
  Sparkles,
  AlertCircle,
  UserCheck,
} from "lucide-react";

interface StudentFeedbackData {
  submissionId: number;
  quizId: number;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  submittedAt: string;
  feedback: string | null;
  hasFeedback: boolean;
  creatorName: string;
  creatorAvatar?: string;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function StudentFeedbackPage() {
  const params = useParams();
  const router = useRouter();

  const submissionId = Number(params?.submissionId);
  const [data, setData] = React.useState<StudentFeedbackData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!submissionId) return;
    setLoading(true);

    api<StudentFeedbackData>(`/quiz/submission/${submissionId}/my-feedback`)
      .then(setData)
      .catch((err: any) => setErrorMsg(err.message || "Không thể tải nhận xét"))
      .finally(() => setLoading(false));
  }, [submissionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 text-muted font-semibold animate-pulse">
        Đang tải nhận xét từ giáo viên...
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-foreground">Không Thể Tải Nhận Xét</h2>
        <p className="text-xs text-muted max-w-sm">{errorMsg || "Bài làm không tồn tại hoặc bạn không có quyền xem."}</p>
        <Button onClick={() => router.push("/inbox")}>Quay về Tin Nhắn</Button>
      </div>
    );
  }

  const scoreColor =
    data.score >= 80 ? "text-green-500" : data.score >= 50 ? "text-amber-500" : "text-rose-500";
  const scoreBg =
    data.score >= 80 ? "bg-green-500/10 border-green-500/30" : data.score >= 50 ? "bg-amber-500/10 border-amber-500/30" : "bg-rose-500/10 border-rose-500/30";

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* STICKY HEADER */}
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-border px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/inbox")}
            className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-muted/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-extrabold text-foreground tracking-tight flex items-center gap-2 truncate">
              <Award className="w-5 h-5 text-primary shrink-0" /> Kết Quả Bài Thi
            </h1>
            <p className="text-xs text-muted truncate max-w-xs">{data.quizTitle}</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => router.push("/inbox")} className="rounded-2xl font-bold">
          Quay lại Chat
        </Button>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10 space-y-6">
        {/* Score Card */}
        <div className={`p-8 rounded-3xl border-2 text-center space-y-3 shadow-lg ${scoreBg}`}>
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <UserCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-foreground">Kết Quả Của Bạn</h2>
          <div className={`text-6xl font-black ${scoreColor}`}>{data.score}%</div>
          <p className="text-sm font-semibold text-muted">
            Bài thi: <span className="font-bold text-foreground">{data.quizTitle}</span>
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-muted">
            <Clock className="w-3.5 h-3.5" />
            Nộp lúc {formatTime(data.submittedAt)}
          </div>
        </div>

        {/* Người ra đề */}
        <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-surface border border-border">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-extrabold text-primary text-sm shrink-0">
            {data.creatorName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-xs text-muted">Người ra đề</p>
            <p className="font-bold text-foreground text-sm">{data.creatorName}</p>
          </div>
        </div>

        {/* Feedback Block */}
        {data.hasFeedback && data.feedback ? (
          <div className="bg-surface p-6 rounded-3xl border-2 border-indigo-500/30 shadow-md space-y-3">
            <div className="flex items-center gap-2 text-sm font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              <Sparkles className="w-5 h-5" />
              Nhận Xét &amp; Đánh Giá Từ Giáo Viên
            </div>
            <p className="text-sm text-foreground font-medium leading-relaxed italic whitespace-pre-wrap">
              {data.feedback}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 p-8 rounded-3xl border-2 border-dashed border-border text-center">
            <div className="w-14 h-14 rounded-full bg-muted/10 flex items-center justify-center">
              <MessageSquare className="w-7 h-7 text-muted" />
            </div>
            <p className="font-bold text-foreground">Chưa có nhận xét</p>
            <p className="text-xs text-muted max-w-xs">
              Giáo viên chưa gửi nhận xét cho bài làm này. Vui lòng quay lại sau!
            </p>
          </div>
        )}

        {/* Score breakdown summary only */}
        <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-surface border border-border">
          <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
          <p className="text-sm font-semibold text-foreground">
            Tổng số câu: <span className="font-extrabold text-primary">{data.totalQuestions} câu</span>
            {" • "}Điểm số của bạn: <span className={`font-extrabold ${scoreColor}`}>{data.score}%</span>
          </p>
        </div>
      </main>
    </div>
  );
}
