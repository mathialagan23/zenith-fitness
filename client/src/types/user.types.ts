// User types (targets now in Plan, not User)
export interface User {
  id: string;
  email: string;
  name: string;
  weight: number;
  height: number;
  goal: "cutting" | "bulking" | "maintenance" | "recomposition";
  hasCompletedSetup: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateUserData {
  name?: string;
  weight?: number;
  height?: number;
  goal?: User["goal"];
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
