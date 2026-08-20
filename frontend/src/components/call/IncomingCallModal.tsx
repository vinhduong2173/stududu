"use client";

import { Phone, PhoneOff, Video } from "lucide-react";
import { useTranslations } from "next-intl";
import { Avatar } from "@/components/ui/Avatar";
import type { CallKind } from "@/lib/webrtc/callContract";
import type { CallPartner } from "./CallProvider";

/**
 * Màn chuông — chỉ hiển thị (điểm ③ mục 8). Nút "Nhận" phải là sự kiện người
 * dùng bấm thật vì cả getUserMedia lẫn play() trên iOS đều đòi hỏi điều đó.
 *
 * BR-37 — cuộc gọi video có thêm lối "nhận nhưng không bật camera": vẫn nghe và
 * nhìn thấy đối phương, chỉ không xuất hiện. Chọn ngay ở đây chứ không bật rồi
 * tắt, vì xin quyền camera là đã làm sáng đèn camera.
 */
export function IncomingCallModal({
  partner,
  kind,
  onAccept,
  onReject,
}: {
  partner: CallPartner;
  kind: CallKind;
  /** `withCamera=false` → chỉ xin micro, phía kia thấy avatar của mình. */
  onAccept: (withCamera: boolean) => void;
  onReject: () => void;
}) {
  const t = useTranslations("call");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("incoming_title", { name: partner.displayName })}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/70 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-sm rounded-3xl bg-surface p-8 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="mb-4 flex justify-center">
          <Avatar
            src={partner.avatarUrl ?? undefined}
            fallback={partner.displayName.charAt(0)}
            size="xl"
            className="animate-pulse"
          />
        </div>
        <p className="text-xl font-bold text-foreground">{partner.displayName}</p>
        <p className="mt-1 text-sm text-muted">
          {kind === "video" ? t("incoming_video") : t("incoming_audio")}
        </p>

        <div className="mt-8 flex items-center justify-center gap-10">
          <button
            onClick={onReject}
            aria-label={t("decline")}
            className="flex flex-col items-center gap-2 text-xs font-medium text-muted"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-error text-white shadow-lg transition-transform hover:scale-105 active:scale-95">
              <PhoneOff className="h-6 w-6" />
            </span>
            {t("decline")}
          </button>
          <button
            onClick={() => onAccept(kind === "video")}
            aria-label={t("accept")}
            className="flex flex-col items-center gap-2 text-xs font-medium text-muted"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success text-white shadow-lg transition-transform hover:scale-105 active:scale-95 animate-pulse">
              {kind === "video" ? <Video className="h-6 w-6" /> : <Phone className="h-6 w-6" />}
            </span>
            {t("accept")}
          </button>
        </div>

        {kind === "video" && (
          <button
            onClick={() => onAccept(false)}
            className="mt-6 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            {t("accept_audio_only")}
          </button>
        )}
      </div>
    </div>
  );
}
