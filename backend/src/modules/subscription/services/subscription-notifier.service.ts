import { Injectable, Logger } from '@nestjs/common';
import { NotificationService } from '../../notification/notification.service';

/**
 * Chuỗi dunning §5.3. SRS mô tả kênh email, nhưng hạ tầng gửi mail chưa có
 * trong repo (điều kiện G2 của gate §1.1 còn dở) — nên bản này gửi qua kênh
 * thông báo in-app sẵn có và ghi log. Khi có mailer, chỉ cần bổ sung lời gọi
 * ở đúng bốn chỗ dưới đây, không đụng vào vòng đời subscription.
 */
@Injectable()
export class SubscriptionNotifierService {
  private readonly logger = new Logger(SubscriptionNotifierService.name);

  constructor(private readonly notifications: NotificationService) {}

  /** §5.3 T-7 — nhắc trước ngày gia hạn (US-40 AC1). */
  async renewalReminder(userId: number, renewAt: Date, amount: number) {
    const day = renewAt.toLocaleDateString('vi-VN');
    await this.send(
      userId,
      'subscription_renewal_reminder',
      `Gói Pro sẽ tự gia hạn vào ${day}, số tiền ${amount.toLocaleString('vi-VN')} ₫.`,
    );
  }

  /** §5.3 T+0..T+2 — vẫn còn quyền Pro, còn `daysLeft` ngày ân hạn. */
  async paymentFailed(userId: number, daysLeft: number) {
    await this.send(
      userId,
      'subscription_past_due',
      `Thanh toán chưa thành công. Bạn vẫn dùng Pro trong ${daysLeft} ngày tới.`,
    );
  }

  /** §5.3 T+3 — hạ cấp, kèm khẳng định dữ liệu được giữ nguyên (BR-43). */
  async downgraded(userId: number) {
    await this.send(
      userId,
      'subscription_downgraded',
      'Gói Pro đã kết thúc. Dữ liệu của bạn được giữ nguyên.',
    );
  }

  async activated(userId: number) {
    await this.send(
      userId,
      'subscription_activated',
      'Gói Pro đã được kích hoạt. Hạn mức mới có hiệu lực ngay.',
    );
  }

  private async send(userId: number, type: string, message: string) {
    this.logger.log(`[dunning] user=${userId} type=${type}`);
    try {
      await this.notifications.createNotification(userId, null, type, message);
    } catch (err) {
      // Không để lỗi thông báo làm hỏng chuyển trạng thái thanh toán.
      this.logger.error(`Không gửi được thông báo ${type}`, err as Error);
    }
  }
}
