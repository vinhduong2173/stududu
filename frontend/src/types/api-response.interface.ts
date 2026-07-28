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

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface VerifyEmailResponse {
  accessToken: string;
  user: User;
}
