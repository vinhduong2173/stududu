import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { Request } from 'express';

/**
 * BR-40 — quota theo ngày reset theo múi giờ TRÌNH DUYỆT người dùng.
 * Frontend gửi `x-timezone-offset: -new Date().getTimezoneOffset()`
 * (phút lệch UTC, dương về phía đông: UTC+7 → 420).
 * Thiếu header thì EntitlementsService suy từ múi giờ trong hồ sơ.
 */
export const TzOffset = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): number | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const raw = request.headers['x-timezone-offset'];
    const value = Number(Array.isArray(raw) ? raw[0] : raw);
    return Number.isFinite(value) ? value : undefined;
  },
);
