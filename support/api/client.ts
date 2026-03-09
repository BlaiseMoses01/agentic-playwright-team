/**
 * Base API client for test automation.
 * The API Test Specialist agent extends this with domain-specific methods.
 */

export interface ApiResponse<T = unknown> {
  status: number;
  headers: Headers;
  data: T;
  ok: boolean;
}

export interface ApiRequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string>;
  body?: unknown;
}

export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };
  private authToken: string | null = null;

  constructor(baseUrl?: string) {
    const url = baseUrl || process.env.API_BASE_URL || process.env.TARGET;
    if (!url) {
      throw new Error("No API base URL configured. Set API_BASE_URL or TARGET in your .env file.");
    }
    this.baseUrl = url.replace(/\/$/, "");
  }

  /** Set the auth token for subsequent requests. */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /** Clear the auth token. */
  clearAuthToken(): void {
    this.authToken = null;
  }

  async get<T = unknown>(path: string, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>("GET", path, options);
  }

  async post<T = unknown>(path: string, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>("POST", path, options);
  }

  async put<T = unknown>(path: string, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>("PUT", path, options);
  }

  async delete<T = unknown>(path: string, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>("DELETE", path, options);
  }

  private async request<T>(
    method: string,
    path: string,
    options?: ApiRequestOptions,
  ): Promise<ApiResponse<T>> {
    let url = `${this.baseUrl}${path}`;

    if (options?.params) {
      const searchParams = new URLSearchParams(options.params);
      url += `?${searchParams.toString()}`;
    }

    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      ...options?.headers,
    };

    if (this.authToken) {
      headers["Authorization"] = `Bearer ${this.authToken}`;
    }

    const fetchOptions: RequestInit = { method, headers };

    if (options?.body && method !== "GET") {
      fetchOptions.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, fetchOptions);

    let data: T;
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      data = (await response.json()) as T;
    } else {
      data = (await response.text()) as unknown as T;
    }

    return {
      status: response.status,
      headers: response.headers,
      data,
      ok: response.ok,
    };
  }
}
