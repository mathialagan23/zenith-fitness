import api from "./api";
import { User, LoginCredentials, RegisterData, AuthResponse, ApiResponse } from "@/types";

export const authService = {
  // Register new user
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>("/auth/register", data);
    return response.data.data as AuthResponse;
  },

  // Login user
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>("/auth/login", credentials);
    return response.data.data as AuthResponse;
  },

  // Logout user
  logout: async (): Promise<void> => {
    await api.post("/auth/logout");
  },

  // Get current user
  getMe: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>("/auth/me");
    return response.data.data as User;
  },
};
