import apiClient from './apiClient';

// ─── Request Payloads ─────────────────────────────────────────────────────────

export interface SignUpPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RefreshPayload {
  refreshToken: string;
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  society?: string | null;
  sector?: string | null;
  interests?: string[];
  avatarUrl?: string | null;
  role?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: AuthUser;
}

// ─── Auth API Calls ───────────────────────────────────────────────────────────

export const authService = {
  /**
   * POST /auth/signup
   * Registers a new user — returns token, refreshToken, user.
   */
  signUp: async (payload: SignUpPayload): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/signup', payload);
    return response.data;
  },

  /**
   * POST /auth/login
   * Authenticates an existing user — returns token, refreshToken, user.
   */
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', payload);
    return response.data;
  },

  /**
   * POST /auth/refresh
   * Exchanges a valid refreshToken for a new token + refreshToken pair.
   * Called automatically by the Axios 401 interceptor — not dispatched manually.
   */
  refresh: async (payload: RefreshPayload): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/refresh', payload);
    return response.data;
  },

  /**
   * GET /auth/me
   * Returns the full profile of the currently authenticated user.
   * Requires a valid Bearer token — set via setAuthToken() before calling.
   */
  getMe: async (): Promise<AuthUser> => {
    const response = await apiClient.get<AuthUser>('/auth/me');
    return response.data;
  },
};
