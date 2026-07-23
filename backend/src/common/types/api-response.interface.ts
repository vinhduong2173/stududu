export interface APIResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
  errors?: string[] | Record<string, unknown>;
}

export interface APIRequest<T = unknown> {
  payload: T;
  headers?: Record<string, string>;
}
