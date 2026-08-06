"use client";

import * as React from "react";
import { Clock, Loader2, Medal, Trophy, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Challenge, Leaderboard, formatDuration } from "@/lib/questionSets";

/**
 * Thử thách cộng đồng — mọi người làm cùng một bộ đề trong khoảng thời gian,
 * xếp hạng theo số câu đúng rồi tới thời gian hoàn thành.
 *
 * ⚠️ Bảng xếp hạng CHỈ tồn tại ở đây: không có điểm tích luỹ trên hồ sơ, không có
 * rank toàn hệ thống — nguyên tắc no-credit (BR-13) vẫn giữ nguyên.
 */
export function ChallengeBoard() {
  const t = useTranslations("challenge");
  const [challenges, setChallenges] = React.useState<Challenge[]>([]);
  const [openId, setOpenId] = React.useState<number | null>(null);
  const [board, setBoard] = React.useState<Leaderboard | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [boardLoading, setBoardLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    api<Challenge[]>("/challenges")
      .then(setChallenges)
      .catch((e: ApiError) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const openBoard = async (id: number) => {
    if (openId === id) {
      setOpenId(null);
      setBoard(null);
      return;
    }
    setOpenId(id);
    setBoardLoading(true);
    try {
      setBoard(await api<Leaderboard>(`/challenges/${id}/leaderboard`));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("board_failed"));
    } finally {
      setBoardLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (challenges.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface p-6 text-center">
        <Trophy className="mx-auto h-8 w-8 text-muted/50" />
        <p className="mt-2 text-sm text-muted">{t("no_challenges")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {challenges.map((c) => {
        const done = Boolean(c.myAttempt?.finishedAt);
        // Đã mở đề nhưng chưa nộp: backend trả lại đúng lượt cũ, nên đây là "làm tiếp"
        const inProgress = Boolean(c.myAttempt) && !done;
        return (
          <div key={c.id} className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-foreground">{c.title}</h3>
                  <PhaseBadge phase={c.phase} t={t} />
                </div>
                {c.description && (
                  <p className="text-sm text-muted">{c.description}</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
                  <span>
                    {c.set.framework} {c.set.level} · {c.set.topic.name}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {t("participants", { count: c.participantCount })}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(c.endsAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => openBoard(c.id)}>
                  <Medal className="mr-1.5 h-4 w-4" />
                  {openId === c.id ? t("hide_board") : t("leaderboard")}
                </Button>
                {c.phase === "running" && !done && (
                  <Button asChild size="sm">
                    <Link href={`/quiz/${c.setId}?challengeId=${c.id}`}>
                      {inProgress ? t("resume") : t("join")}
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            {done && c.myAttempt && (
              <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                {t("my_result", {
                  correct: c.myAttempt.correctCount,
                  total: c.myAttempt.totalCount,
                  time: formatDuration(c.myAttempt.durationSec ?? 0),
                })}
              </p>
            )}
            {c.phase === "running" && !done && (
              <p className="mt-3 text-xs text-muted">{t("once_only")}</p>
            )}

            {openId === c.id && (
              <div className="mt-4 border-t border-border pt-4">
                {boardLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                ) : board && board.entries.length > 0 ? (
                  <ol className="space-y-1">
                    {board.entries.slice(0, 20).map((entry) => (
                      <li
                        key={entry.userId}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2 text-sm",
                          board.myRank?.userId === entry.userId
                            ? "bg-primary/5 font-semibold"
                            : "hover:bg-muted/5",
                        )}
                      >
                        <span
                          className={cn(
                            "w-6 shrink-0 text-center font-bold",
                            entry.rank === 1
                              ? "text-amber-500"
                              : entry.rank === 2
                                ? "text-slate-400"
                                : entry.rank === 3
                                  ? "text-orange-600"
                                  : "text-muted",
                          )}
                        >
                          {entry.rank}
                        </span>
                        <Avatar
                          src={entry.avatarUrl ?? undefined}
                          fallback={entry.displayName.charAt(0).toUpperCase()}
                          size="sm"
                        />
                        <span className="min-w-0 flex-1 truncate text-foreground">
                          {entry.displayName}
                        </span>
                        <span className="shrink-0 text-foreground">
                          {entry.correctCount}/{entry.totalCount}
                        </span>
                        <span className="w-12 shrink-0 text-right text-xs text-muted">
                          {formatDuration(entry.durationSec)}
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="py-3 text-center text-sm text-muted">
                    {t("board_empty")}
                  </p>
                )}
                <p className="mt-3 text-[11px] text-muted">{t("board_scope_note")}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PhaseBadge({
  phase,
  t,
}: {
  phase: Challenge["phase"];
  t: ReturnType<typeof useTranslations>;
}) {
  const styles: Record<Challenge["phase"], string> = {
    upcoming: "bg-sky-50 text-sky-700 border-sky-200",
    running: "bg-emerald-50 text-emerald-700 border-emerald-200",
    ended: "bg-muted/10 text-muted border-border",
  };
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        styles[phase],
      )}
    >
      {t(`phase_${phase}`)}
    </span>
  );
}
