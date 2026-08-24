import { ForbiddenException } from '@nestjs/common';
import { EntitlementKey } from './entitlements.constant';

export interface QuotaExceededBody {
  code: 'QUOTA_EXCEEDED';
  key: EntitlementKey;
  limit: number;
  used: number;
  resetAt: string | null;
  message: string;
}

/**
 * US-39 AC1 — chạm hạn mức trả 403 kèm mã `QUOTA_EXCEEDED`, hạn mức và thời
 * điểm reset để giao diện dựng được thông báo + nút dẫn tới /pricing.
 */
export class QuotaExceededException extends ForbiddenException {
  constructor(body: Omit<QuotaExceededBody, 'code'>) {
    super({ ...body, code: 'QUOTA_EXCEEDED' } satisfies QuotaExceededBody);
  }
}
