export function getApiUrl(): string {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      const envUrl = process.env.NEXT_PUBLIC_API_URL;
      if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
        return envUrl.replace(/\/+$/, '');
      }
      return '/api';
    }
  }
  const envUrl = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_API_URL : undefined;
  return envUrl ? envUrl.replace(/\/+$/, '') : 'http://localhost:3001';
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
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

  const baseUrl = getApiUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  const res = await fetch(`${baseUrl}${normalizedPath}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { message?: string | string[] } | null;
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

    throw new ApiError(res.status, message ?? res.statusText);
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
