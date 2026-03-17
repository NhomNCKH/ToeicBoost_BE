export interface IApiResponse<T = unknown> {
  statusCode: number;
  message: string;
  data?: T;
  timestamp: string;
  path?: string;
}

export interface IApiErrorResponse {
  statusCode: number;
  error: string;
  message: string | string[];
  details?: unknown;
  timestamp: string;
  path?: string;
}
