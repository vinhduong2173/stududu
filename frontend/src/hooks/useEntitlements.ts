"use client";

import * as React from "react";
import {
  PRO_STATUSES,
  type Entitlement,
  type EntitlementKey,
  type SubscriptionState,
  getSubscription,
} from "@/lib/subscription";

/**
 * Cache ở mức module: nhãn PRO và chip hạn mức xuất hiện ở nhiều màn hình, không
 * để mỗi chỗ tự gọi `/subscription/me` một lần.
 */
let pending: Promise<SubscriptionState> | null = null;

/** Gọi sau khi nâng cấp/huỷ gói để lần đọc kế tiếp lấy dữ liệu mới. */
export function invalidateEntitlements() {
  pending = null;
}

/** Chỉ ĐỌC quyền để hiển thị. Muốn thao tác nâng cấp/huỷ thì dùng useSubscription. */
export function useEntitlements() {
  const [state, setState] = React.useState<SubscriptionState | null>(null);

  React.useEffect(() => {
    let alive = true;
    pending ??= getSubscription();
    pending.then(
      (s) => alive && setState(s),
      () => {
        pending = null; // lỗi mạng không được cache lại
      },
    );
    return () => {
      alive = false;
    };
  }, []);

  return {
    state,
    isPro: state ? PRO_STATUSES.includes(state.status) : false,
    entitlement: (key: EntitlementKey): Entitlement | undefined =>
      state?.entitlements.find((e) => e.key === key),
    /** Chức năng bật/tắt theo gói — dùng cho bộ lọc ghép đôi nâng cao. */
    can: (key: EntitlementKey): boolean =>
      state?.entitlements.find((e) => e.key === key)?.allowed ?? false,
  };
}
