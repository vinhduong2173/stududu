import { Injectable } from '@nestjs/common';
import { PlanCode } from '@prisma/client';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ENTITLEMENTS,
  ENTITLEMENT_KEYS,
  EntitlementKey,
  EntitlementRule,
  QUOTA_WARNING_ABSOLUTE,
  QUOTA_WARNING_RATIO,
} from './entitlements.constant';
import { QuotaExceededException } from './quota-exceeded.exception';
import { UsageCounterService } from './services/usage-counter.service';
import { effectivePlan } from './utils/effective-plan.util';
import {
  dailyPeriodStart,
  nextDailyReset,
  resolveOffsetMinutes,
} from './utils/usage-period.util';

export interface EntitlementCheck {
  key: EntitlementKey;
  kind: EntitlementRule['kind'];
  plan: PlanCode;
  allowed: boolean;
  limit: number;
  used: number;
  remaining: number;
  resetAt: string | null;
  /** US-39 AC2 — sắp chạm hạn mức, giao diện hiện cảnh báo nhẹ. */
  warn: boolean;
}

export interface EntitlementOptions {
  /** Số hiện có với loại `cap` (SRS §4 — `{ current: count }`). */
  current?: number;
  /** Phút lệch UTC của trình duyệt, dương về phía đông (BR-40). */
  tzOffsetMinutes?: number;
}

interface PeriodContext {
  plan: PlanCode;
  periodStart: Date | null;
  resetAt: Date | null;
}

/**
 * US-41 — điểm kiểm tra quyền DUY NHẤT của toàn hệ thống.
 * BR-39: không module nào khác được so sánh trực tiếp mã gói.
 */
@Injectable()
export class EntitlementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usage: UsageCounterService,
    private readonly i18n: I18nService,
  ) {}

  /** US-41 AC1 — `{ allowed, limit, used, resetAt }` theo subscription hiện tại. */
  async can(
    userId: number,
    key: EntitlementKey,
    options: EntitlementOptions = {},
  ): Promise<EntitlementCheck> {
    const rule = ENTITLEMENTS[key];
    const ctx = await this.resolveContext(userId, options.tzOffsetMinutes);
    const limit = rule.limits[ctx.plan];

    if (rule.kind === 'boolean') {
      return this.buildCheck(key, rule, ctx, {
        limit: 1,
        used: limit > 0 ? 0 : 1,
      });
    }

    const used = await this.currentUsage(
      userId,
      key,
      rule,
      ctx,
      options.current,
    );
    return this.buildCheck(key, rule, ctx, { limit, used });
  }

  /**
   * Kiểm tra rồi ghi nhận một lượt dùng. Chạm hạn mức → 403 QUOTA_EXCEEDED
   * (US-39 AC1). Trả về trạng thái SAU khi đã trừ để caller hiện cảnh báo.
   */
  async assertAndConsume(
    userId: number,
    key: EntitlementKey,
    options: EntitlementOptions = {},
  ): Promise<EntitlementCheck> {
    const check = await this.can(userId, key, options);
    if (!check.allowed) throw this.quotaExceeded(check);

    if (ENTITLEMENTS[key].kind !== 'quota') return check;
    return this.consume(userId, key, options);
  }

  /** Ghi nhận lượt dùng không kiểm tra — dùng khi caller đã tự kiểm tra trước. */
  async consume(
    userId: number,
    key: EntitlementKey,
    options: EntitlementOptions = {},
  ): Promise<EntitlementCheck> {
    const rule = ENTITLEMENTS[key];
    const ctx = await this.resolveContext(userId, options.tzOffsetMinutes);
    if (rule.kind !== 'quota' || !ctx.periodStart) {
      return this.can(userId, key, options);
    }

    const used = await this.usage.increment(userId, key, ctx.periodStart);
    return this.buildCheck(key, rule, ctx, {
      limit: rule.limits[ctx.plan],
      used,
    });
  }

  /** US-37 AC2 — toàn bộ hạn mức + mức dùng hiện tại cho trang /pricing. */
  async summary(
    userId: number,
    tzOffsetMinutes?: number,
  ): Promise<EntitlementCheck[]> {
    return Promise.all(
      ENTITLEMENT_KEYS.map((key) => this.can(userId, key, { tzOffsetMinutes })),
    );
  }

  /** Đơn giản hoá cho nhánh boolean (`match.advanced_filter`). */
  async isEnabled(userId: number, key: EntitlementKey): Promise<boolean> {
    return (await this.can(userId, key)).allowed;
  }

  private async resolveContext(
    userId: number,
    tzOffsetMinutes?: number,
  ): Promise<PeriodContext> {
    const now = new Date();
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true, subscription: true },
    });

    const plan = effectivePlan(user?.subscription ?? null, now);
    const offset = resolveOffsetMinutes(tzOffsetMinutes, user?.timezone);
    return {
      plan,
      periodStart: dailyPeriodStart(now, offset),
      resetAt: nextDailyReset(now, offset),
    };
  }

  private async currentUsage(
    userId: number,
    key: EntitlementKey,
    rule: EntitlementRule,
    ctx: PeriodContext,
    current?: number,
  ): Promise<number> {
    if (typeof current === 'number') return current;
    if (rule.kind === 'cap') return this.capUsage(userId, key);
    return ctx.periodStart ? this.usage.read(userId, key, ctx.periodStart) : 0;
  }

  /** Loại `cap` đếm từ dữ liệu thật, không từ counter — xem BR-43. */
  private async capUsage(userId: number, key: EntitlementKey): Promise<number> {
    if (key === 'vocabulary.save') {
      return this.prisma.userSavedWord.count({ where: { userId } });
    }
    return 0;
  }

  private buildCheck(
    key: EntitlementKey,
    rule: EntitlementRule,
    ctx: PeriodContext,
    values: { limit: number; used: number },
  ): EntitlementCheck {
    const { limit, used } = values;
    const remaining = Math.max(0, limit - used);
    const resetAt = rule.reset === 'daily' ? ctx.resetAt : null;

    return {
      key,
      kind: rule.kind,
      plan: ctx.plan,
      allowed: used < limit,
      limit,
      used,
      remaining,
      resetAt: resetAt ? resetAt.toISOString() : null,
      warn:
        rule.kind !== 'boolean' &&
        remaining > 0 &&
        remaining <=
          Math.max(QUOTA_WARNING_ABSOLUTE, limit * QUOTA_WARNING_RATIO),
    };
  }

  private quotaExceeded(check: EntitlementCheck): QuotaExceededException {
    const lang = I18nContext.current()?.lang;
    const messageKey =
      check.kind === 'boolean'
        ? 'translation.subscription.featureRequiresPro'
        : 'translation.subscription.quotaExceeded';

    return new QuotaExceededException({
      key: check.key,
      limit: check.limit,
      used: check.used,
      resetAt: check.resetAt,
      message: this.i18n.t(messageKey, {
        lang,
        args: { limit: check.limit },
      }),
    });
  }
}
