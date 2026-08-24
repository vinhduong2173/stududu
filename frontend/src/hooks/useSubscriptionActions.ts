"use client";

import * as React from "react";
import { ApiError } from "@/lib/api";
import {
  cancelSubscription,
  resumeSubscription,
  startCheckout,
} from "@/lib/subscription";
import { invalidateEntitlements } from "./useEntitlements";

export const errorMessage = (err: unknown) =>
  err instanceof ApiError ? err.message : String(err);

/** US-38 / US-42 — nâng cấp, huỷ, khôi phục gói. Tách khỏi useSubscription
 *  để mỗi hook giữ đúng một nhiệm vụ (AGENTS §13.2 Rule A). */
export function useSubscriptionActions(
  reload: () => Promise<unknown>,
  onError: (message: string) => void,
) {
  const [busy, setBusy] = React.useState(false);

  const run = React.useCallback(
    async (fn: () => Promise<unknown>) => {
      setBusy(true);
      try {
        await fn();
        // Nhãn PRO và chip hạn mức ở các màn hình khác đọc từ cache dùng chung —
        // đổi gói xong phải xoá cache, nếu không giao diện hiện quyền cũ.
        invalidateEntitlements();
        await reload();
      } catch (err) {
        onError(errorMessage(err));
      } finally {
        setBusy(false);
      }
    },
    [reload, onError],
  );

  /** Chuyển sang trang thanh toán của provider — không quay lại nên không tắt busy. */
  const upgrade = React.useCallback(async () => {
    setBusy(true);
    try {
      window.location.href = (await startCheckout()).url;
    } catch (err) {
      onError(errorMessage(err));
      setBusy(false);
    }
  }, [onError]);

  return {
    busy,
    upgrade,
    cancel: () => run(cancelSubscription),
    resume: () => run(resumeSubscription),
  };
}
