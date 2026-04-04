import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { API_BASE_URL } from "@/config/constants";
import { ApiResponse, ApiError } from "@/types";

// In-memory CSRF token (never persisted to storage)
let csrfToken: string | null = null;
let csrfFetchPromise: Promise<void> | null = null;

// Create axios instance with credentials enabled for cross-origin cookies
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

/**
 * Fetch CSRF token from backend.
 * This also causes the backend to set the _csrf cookie.
 */
const fetchCSRFToken = async (): Promise<void> => {
  const response = await api.get<{ success: boolean; csrfToken: string }>(
    "/csrf-token"
  );
  csrfToken = response.data.csrfToken;
};

/**
 * Initialize CSRF protection on app startup.
 * Called once in main.tsx before rendering.
 */
export const initCSRF = async (): Promise<void> => {
  try {
    await fetchCSRFToken();
  } catch (error) {
    console.error("[CSRF] Failed to initialize CSRF token", error);
  }
};

/**
 * Ensure CSRF token is available before making mutating requests.
 * Deduplicates concurrent fetch attempts.
 */
const ensureCSRFToken = async (): Promise<string | null> => {
  if (csrfToken) return csrfToken;

  if (!csrfFetchPromise) {
    csrfFetchPromise = fetchCSRFToken().finally(() => {
      csrfFetchPromise = null;
    });
  }

  await csrfFetchPromise;
  return csrfToken;
};

/**
 * Request interceptor:
 * - Attaches CSRF token to all state-changing requests (POST, PUT, PATCH, DELETE)
 * - Ensures token is fetched if missing
 */
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const method = (config.method || "get").toLowerCase();

    // Attach CSRF token to mutating requests only
    if (["post", "put", "patch", "delete"].includes(method)) {
      // Skip CSRF header for the token endpoint itself to avoid circular dependency
      if (!config.url?.includes("/csrf-token")) {
        const token = await ensureCSRFToken();
        if (token) {
          config.headers.set("X-CSRF-Token", token);
        }
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor:
 * - Handles CSRF token expiry/mismatch (403) with automatic retry
 * - Handles auth failures (401) by dispatching logout event
 * - Normalizes errors to ApiError format
 */
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _csrfRetry?: boolean;
    };

    // If 403 and this is a mutating request, try refreshing CSRF token once
    if (
      error.response?.status === 403 &&
      !originalRequest._csrfRetry &&
      originalRequest.method &&
      ["post", "put", "patch", "delete"].includes(
        originalRequest.method.toLowerCase()
      )
    ) {
      originalRequest._csrfRetry = true;
      csrfToken = null; // Clear potentially stale token

      try {
        await fetchCSRFToken();
        if (csrfToken) {
          originalRequest.headers.set("X-CSRF-Token", csrfToken);
          return api(originalRequest);
        }
      } catch {
        // CSRF refresh failed, fall through to normal error handling
      }
    }

    // Normalize error to ApiError format
    const apiError: ApiError = {
      message:
        error.response?.data?.error || error.message || "An error occurred",
      status: error.response?.status || 500,
      details: error.response?.data?.details,
    };

    // Handle 401 - dispatch event for auth store to handle logout
    if (error.response?.status === 401) {
      window.dispatchEvent(new CustomEvent("auth:logout"));
    }

    return Promise.reject(apiError);
  }
);

export default api;

// ─── Generic Request Helpers ─────────────────────────────────────────────────

export const get = async <T>(
  url: string,
  params?: Record<string, unknown>
): Promise<T> => {
  const response = await api.get<ApiResponse<T>>(url, { params });
  return response.data.data as T;
};

export const post = async <T>(url: string, data?: unknown): Promise<T> => {
  const response = await api.post<ApiResponse<T>>(url, data);
  return response.data.data as T;
};

export const put = async <T>(url: string, data?: unknown): Promise<T> => {
  const response = await api.put<ApiResponse<T>>(url, data);
  return response.data.data as T;
};

export const del = async <T>(url: string): Promise<T> => {
  const response = await api.delete<ApiResponse<T>>(url);
  return response.data.data as T;
};
