export type UserRole = 'organizer' | 'attendee';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
}

export interface AuthResponseData {
  user: User;
  message?: string;
}

export type AuthResponse = ApiResponse<AuthResponseData>;

export interface LogoutResponseData {
  message: string;
}

export type LogoutResponse = ApiResponse<LogoutResponseData>;

export interface SignInPayload {
  email: string;
  password: string;
}

export interface SignUpPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
