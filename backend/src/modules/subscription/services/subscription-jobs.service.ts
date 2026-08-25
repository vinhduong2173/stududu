import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { UsageCounterService } from '../../entitlements/services/usage-counter.service';
import {
  JOB_INTERVAL_MINUTES,
  PENDING_PAYMENT_TTL_MINUTES,
  USAGE_RETENTION_DAYS,
  addDays,
} from '../constants/subscription.constant';
import { SubscriptionBillingService } from './subscription-billing.service';
import { SubscriptionDunningService } from './subscription-dunning.service';

export interface JobReport {
  ranAt: string;
  expiredCheckouts: number;
  reminders: number;
  charged: number;
  retried: number;
  downgraded: number;
  cancellationsCompleted: number;
  purgedCounters: number;
}

/**
 * Tác vụ định kỳ của EP-11 (§10.3 — cần một scheduled job chạy hằng ngày).
 * Dùng setInterval thay vì @nestjs/schedule để không thêm dependency mới vào
 * repo; đổi sang cron thật khi hạ tầng deploy xong (điều kiện G1 của gate §1.1).
 */
@Injectable()
export class SubscriptionJobsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SubscriptionJobsService.name);
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly billing: SubscriptionBillingService,
    private readonly dunning: SubscriptionDunningService,
    private readonly usage: UsageCounterService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit(): void {
    if (this.config.get<string>('SUBSCRIPTION_JOBS_ENABLED') === 'false') {
      this.logger.warn(
        'Job subscription đang tắt (SUBSCRIPTION_JOBS_ENABLED=false)',
      );
      return;
    }
    this.timer = setInterval(
      () => void this.run().catch((err) => this.logger.error(err)),
      JOB_INTERVAL_MINUTES * 60 * 1000,
    );
    this.timer.unref?.();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  /** Chạy toàn bộ chuỗi; admin có thể gọi tay để demo (§11-Q4). */
  async run(now: Date = new Date()): Promise<JobReport> {
    return {
      ranAt: now.toISOString(),
      expiredCheckouts: await this.expireStalePendingCheckouts(now),
      reminders: await this.dunning.sendRenewalReminders(now),
      charged: await this.dunning.chargeDueRenewals(now),
      retried: await this.dunning.retryPastDue(now),
      downgraded: await this.dunning.downgradeExpiredGrace(now),
      cancellationsCompleted: await this.completeCancellations(now),
      purgedCounters: await this.usage.purgeOlderThan(
        addDays(now, -USAGE_RETENTION_DAYS),
      ),
    };
  }

  /** US-38 AC4 — đóng tab giữa chừng: 30 phút sau tự trở về `free`. */
  private async expireStalePendingCheckouts(now: Date): Promise<number> {
    const cutoff = new Date(
      now.getTime() - PENDING_PAYMENT_TTL_MINUTES * 60 * 1000,
    );
    const { count } = await this.prisma.subscription.updateMany({
      where: {
        status: SubscriptionStatus.pending_payment,
        updatedAt: { lt: cutoff },
      },
      data: { status: SubscriptionStatus.free, providerSubId: null },
    });
    return count;
  }

  /** US-42 AC2 — hết chu kỳ đã trả tiền thì `canceling` → `free`, không trừ tiền. */
  private async completeCancellations(now: Date): Promise<number> {
    const due = await this.prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.canceling,
        currentPeriodEnd: { lte: now },
      },
    });

    for (const sub of due) await this.billing.downgrade(sub);
    return due.length;
  }
}
