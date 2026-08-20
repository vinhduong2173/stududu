import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { EntitlementKey } from '../entitlements.constant';

/**
 * Đọc/ghi UsageCounter. Tách riêng khỏi EntitlementsService để phần quyết định
 * quyền không phải bận tâm chuyện lưu trữ (SRS §6 — quyết định thiết kế #3).
 */
@Injectable()
export class UsageCounterService {
  constructor(private readonly prisma: PrismaService) {}

  async read(
    userId: number,
    key: EntitlementKey,
    periodStart: Date,
  ): Promise<number> {
    const row = await this.prisma.usageCounter.findUnique({
      where: { userId_key_periodStart: { userId, key, periodStart } },
    });
    return row?.count ?? 0;
  }

  /** Cộng lượt dùng, trả về số lượt sau khi cộng. */
  async increment(
    userId: number,
    key: EntitlementKey,
    periodStart: Date,
    amount = 1,
  ): Promise<number> {
    const row = await this.prisma.usageCounter.upsert({
      where: { userId_key_periodStart: { userId, key, periodStart } },
      create: { userId, key, periodStart, count: amount },
      update: { count: { increment: amount } },
    });
    return row.count;
  }

  /** Dọn counter cũ — job hằng ngày gọi để bảng không phình vô hạn. */
  async purgeOlderThan(cutoff: Date): Promise<number> {
    const { count } = await this.prisma.usageCounter.deleteMany({
      where: { periodStart: { lt: cutoff } },
    });
    return count;
  }
}
