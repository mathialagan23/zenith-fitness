import api from "./api";
import { User, UpdateUserData, ApiResponse } from "@/types";

// Core HTTP helpers
const fetchUser = async (): Promise<User> => {
  const response = await api.get<ApiResponse<User>>("/user");
  return response.data.data as User;
};

const persistUser = async (data: UpdateUserData): Promise<User> => {
  const response = await api.put<ApiResponse<User>>("/user", data);
  return response.data.data as User;
};

// Public service API
// Keep both the new profile-style names and the existing ones
export const userService = {
  // New, profile-oriented naming (used by Settings page)
  getProfile: fetchUser,
  updateProfile: persistUser,

  // Legacy / other call sites (used by plan wizard, auth store, etc.)
  getUser: fetchUser,
  updateUser: persistUser,
};
