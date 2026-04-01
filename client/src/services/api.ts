import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL } from "@/config/constants";
import { ApiResponse, ApiError } from "@/types";

// In-memory CSRF token (never persisted)
let csrfToken: string | null = null;

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  // Ensures cookies (including auth + CSRF cookie) are sent
  withCredentials: true,
});

// Initialize CSRF by calling the backend token endpoint
export const initCSRF = async (): Promise<void> => {
  try {
    const response = await api.get<{ success: boolean; csrfToken: string }>("/csrf-token");
    csrfToken = response.data.csrfToken;
  } catch (error) {
    // If this fails, subsequent mutating requests will get a 403 until retried
    // We intentionally do not throw here to avoid blocking app startup
    console.error("[CSRF] Failed to initialize CSRF token", error);
  }
};

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const method = (config.method || "get").toLowerCase();

    // Attach CSRF token to mutating requests only
    if (["post", "put", "patch", "delete"].includes(method) && csrfToken) {
      config.headers.set("X-CSRF-Token", csrfToken);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<ApiResponse<unknown>>) => {
    const apiError: ApiError = {
      message: error.response?.data?.error || error.message || "An error occurred",
      status: error.response?.status || 500,
      details: error.response?.data?.details,
    };

    // Handle 401 - redirect to login
    if (error.response?.status === 401) {
      window.dispatchEvent(new CustomEvent("auth:logout"));
    }

    return Promise.reject(apiError);
  }
);

export default api;

// Generic request helpers (still useful for simple API calls)
export const get = async <T>(url: string, params?: Record<string, unknown>): Promise<T> => {
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
