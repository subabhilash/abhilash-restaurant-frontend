export type UserRole = "super_admin" | "admin" | "kitchen" | "waiter";

export interface AuthUser {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  restaurant_id: number | null;
}

export interface TokenPair {
  access: string;
  refresh: string;
}

export interface LoginResponse extends TokenPair {
  user: AuthUser;
}

export interface RegisterResponse extends LoginResponse {
  detail?: string;
}
