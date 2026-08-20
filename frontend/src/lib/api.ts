// typeof-guard: file này còn được bundle ngoài Next (design-sync) — nơi không có `process`
const API_URL =
  (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_API_URL : undefined) ??
  'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    /** Body lỗi nguyên bản — EP-11 cần `code`, `limit`, `resetAt` của QUOTA_EXCEEDED. */
    public body?: Record<string, unknown> | null,
  ) {
    super(message);
  }
}

/** US-39 AC1 — chạm hạn mức gói: 403 kèm mã QUOTA_EXCEEDED. */
export interface QuotaErrorBody {
  code: "QUOTA_EXCEEDED";
  key: string;
  limit: number;
  used: number;
  resetAt: string | null;
}

export function asQuotaError(err: unknown): QuotaErrorBody | null {
  if (!(err instanceof ApiError) || err.status !== 403) return null;
  const body = err.body;
  return body?.code === "QUOTA_EXCEEDED" ? (body as unknown as QuotaErrorBody) : null;
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  token?: string;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, token, headers, ...rest } = options;

  let activeToken = token;
  if (!activeToken && typeof window !== 'undefined') {
    activeToken = localStorage.getItem('accessToken') || undefined;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
      // BR-40 — quota theo ngày reset 00:00 theo múi giờ TRÌNH DUYỆT, không phải
      // của server. Dương về phía đông (UTC+7 → 420).
      ...(typeof window !== 'undefined'
        ? { 'x-timezone-offset': String(-new Date().getTimezoneOffset()) }
        : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as
      | ({ message?: string | string[] } & Record<string, unknown>)
      | null;
    const message = Array.isArray(data?.message) ? data.message.join(', ') : data?.message;
    
    if (res.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      const path = window.location.pathname;
      const cleanPath = path.replace(/^\/(vi|en|fr|es|zh|ja|de)/, '');
      if (cleanPath !== '' && cleanPath !== '/' && cleanPath !== '/login' && cleanPath !== '/register' && cleanPath !== '/forgot-password') {
        const localeMatch = path.match(/^\/(vi|en|fr|es|zh|ja|de)/);
        const currentLocale = localeMatch ? localeMatch[1] : 'vi';
        window.location.href = `/${currentLocale}/login`;
      }
    }
    
    throw new ApiError(res.status, message ?? res.statusText, data);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/**
 * Upload multipart/form-data (tải tài liệu cho AI sinh câu hỏi).
 * KHÔNG tự đặt Content-Type — trình duyệt phải tự sinh boundary cho FormData.
 */
export async function apiUpload<T>(path: string, form: FormData, token?: string): Promise<T> {
  let activeToken = token;
  if (!activeToken && typeof window !== "undefined") {
    activeToken = localStorage.getItem("accessToken") || undefined;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: activeToken ? { Authorization: `Bearer ${activeToken}` } : undefined,
    body: form,
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { message?: string | string[] } | null;
    const message = Array.isArray(data?.message) ? data.message.join(", ") : data?.message;
    throw new ApiError(res.status, message ?? res.statusText);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
