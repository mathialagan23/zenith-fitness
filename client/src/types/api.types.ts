// API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: Array<{ field: string; message: string }>;
}

// Pagination params
export interface PaginationParams {
  page?: number;
  limit?: number;
}

// Date range params
export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

// API error
export interface ApiError {
  message: string;
  status: number;
  details?: Array<{ field: string; message: string }>;
}
