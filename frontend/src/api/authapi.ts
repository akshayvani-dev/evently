import axios from 'axios';
import api from '../lib/axios';
import type {
  ApiResponse,
  AuthResponse,
  LogoutResponse,
  SignInPayload,
  SignUpPayload,
  User,
} from '../types/auth';

/**
 * Extracts a user-friendly error message from an API error response.
 */
export function getApiErrorMessage(
  error: unknown,
  fallbackMessage = 'An unexpected error occurred. Please try again.'
): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || fallbackMessage;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallbackMessage;
}

let currentUserRequest: Promise<AuthResponse> | null = null;

/**
 * Authentication API Service
 * Encapsulates all backend authentication endpoint interactions.
 * Session state is managed via secure HTTP-only cookies sent via credentials.
 */
export const authApi = {
  /**
   * Registers a new user.
   * Route: POST /api/v1/auth/signup
   */
  signup: async (payload: SignUpPayload): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/signup', payload);
    return response.data;
  },

  /**
   * Signs in an existing user.
   * Route: POST /api/v1/auth/signin
   */
  signin: async (payload: SignInPayload): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/signin', payload);
    return response.data;
  },

  /**
   * Logs out the current user and invalidates session cookies.
   * Route: POST /api/v1/auth/logout
   */
  logout: async (): Promise<LogoutResponse> => {
    const response = await api.post<LogoutResponse>('/auth/logout');
    return response.data;
  },

  /**
   * Fetches the current authenticated user's session profile.
   * Route: GET /api/v1/auth/me
   */
  getMe: (): Promise<AuthResponse> => {
    if (currentUserRequest) return currentUserRequest;
    currentUserRequest = api.get<AuthResponse>('/auth/me')
      .then((response) => response.data)
      .finally(() => { currentUserRequest = null; });
    return currentUserRequest;
  },

  /**
   * Alias for getMe()
   */
  me: async (): Promise<AuthResponse> => {
    return authApi.getMe();
  },

  /**
   * Refreshes the access token using the HTTP-only refresh token cookie.
   * Route: POST /api/v1/auth/refresh
   */
  refresh: async (): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/refresh');
    return response.data;
  },
};

// Named exports for convenient direct imports
export const signup = authApi.signup;
export const signin = authApi.signin;
export const logout = authApi.logout;
export const getMe = authApi.getMe;
export const me = authApi.me;
export const refresh = authApi.refresh;

export default authApi;
