import { PlanCode, Subscription, SubscriptionStatus } from '@prisma/client';

/**
 * Gói THỰC SỰ đang có hiệu lực tại thời điểm `now`.
 *
 * - BR-41 / US-41 AC3: `past_due` còn trong grace period vẫn giữ nguyên quyền Pro.
 * - BR-42: `canceling` giữ quyền tới hết chu kỳ đã thanh toán.
 * - Hết hạn mà job hạ cấp chưa kịp chạy → vẫn coi là free (không cho quyền thừa).
 */
export function effectivePlan(
  subscription: Pick<
    Subscription,
    'plan' | 'status' | 'currentPeriodEnd' | 'graceEndsAt'
  > | null,
  now: Date = new Date(),
): PlanCode {
  if (!subscription) return PlanCode.free;

  switch (subscription.status) {
    case SubscriptionStatus.active:
    case SubscriptionStatus.canceling:
      return notPassed(subscription.currentPeriodEnd, now)
        ? subscription.plan
        : PlanCode.free;

    case SubscriptionStatus.past_due:
      return notPassed(subscription.graceEndsAt, now)
        ? subscription.plan
        : PlanCode.free;

    default:
      return PlanCode.free;
  }
}

function notPassed(deadline: Date | null, now: Date): boolean {
  return deadline === null || deadline.getTime() > now.getTime();
}
