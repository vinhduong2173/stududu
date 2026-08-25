"use client";

import * as React from "react";
import {
  PRO_STATUSES,
  type Entitlement,
  type EntitlementKey,
  type SubscriptionState,
  getSubscription,
} from "@/lib/subscription";
import { errorMessage, useSubscriptionActions } from "./useSubscriptionActions";

/** EP-11 — trạng thái gói + hạn mức hiện tại, dùng cho trang /pricing. */
export function useSubscription() {
  const [state, setState] = React.useState<SubscriptionState | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const apply = React.useCallback((result: SubscriptionState | Error) => {
    if (result instanceof Error) setError(errorMessage(result));
    else {
      setState(result);
      setError(null);
    }
    setLoading(false);
  }, []);

  const reload = React.useCallback(
    () => getSubscription().then(apply, apply),
    [apply],
  );

  React.useEffect(() => {
    let alive = true;
    void getSubscription().then(
      (s) => alive && apply(s),
      (err: Error) => alive && apply(err),
    );
    return () => {
      alive = false;
    };
  }, [apply]);

  const actions = useSubscriptionActions(reload, setError);

  return {
    state,
    loading,
    error,
    reload,
    ...actions,
    isPro: state ? PRO_STATUSES.includes(state.status) : false,
    entitlement: (key: EntitlementKey): Entitlement | undefined =>
      state?.entitlements.find((e) => e.key === key),
  };
}
