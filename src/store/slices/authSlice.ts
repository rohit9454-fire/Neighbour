import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types';

interface UserStats {
  created: number;
  joined: number;
  neighbours: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  loading: boolean;
  isRefreshing: boolean;
  isFetchingMe: boolean;
  isUpdatingProfile: boolean;
  stats: UserStats | null;
  isFetchingStats: boolean;
  error: string | null;
  autoLoginChecked: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  loading: false,
  isRefreshing: false,
  isFetchingMe: false,
  isUpdatingProfile: false,
  stats: null,
  isFetchingStats: false,
  error: null,
  autoLoginChecked: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // ── Login ──────────────────────────────────────────────────────────────────
    loginRequest: (state, _action: PayloadAction<{ email: string; password: string }>) => {
      state.loading = true;
      state.error = null;
    },

    // ── Sign Up ────────────────────────────────────────────────────────────────
    signUpRequest: (
      state,
      _action: PayloadAction<{ name: string; email: string; password: string }>,
    ) => {
      state.loading = true;
      state.error = null;
    },

    // ── Shared Login / SignUp Success ──────────────────────────────────────────
    loginSuccess: (
      state,
      action: PayloadAction<{ user: User; token: string; refreshToken: string }>,
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.loading = false;
      state.error = null;
      state.autoLoginChecked = true;
    },

    // ── Shared Login / SignUp Failure ──────────────────────────────────────────
    loginFailure: (state, action: PayloadAction<string | undefined>) => {
      state.loading = false;
      state.error = action.payload ?? 'Something went wrong. Please try again.';
      state.autoLoginChecked = true;
    },

    // ── Token Refresh ──────────────────────────────────────────────────────────
    /**
     * Dispatched by the Axios 401 interceptor to trigger the saga.
     * Carries the current refreshToken stored in Redux.
     */
    refreshTokenRequest: (state, _action: PayloadAction<string>) => {
      state.isRefreshing = true;
      state.error = null;
    },

    /**
     * Saga dispatches this after a successful /auth/refresh call.
     * Updates both token and refreshToken in Redux state.
     */
    refreshTokenSuccess: (
      state,
      action: PayloadAction<{ token: string; refreshToken: string }>,
    ) => {
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.isRefreshing = false;
    },

    /**
     * Dispatched when refresh fails (expired / invalid refreshToken).
     * Forces a full logout — user must re-authenticate.
     */
    refreshTokenFailure: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isRefreshing = false;
      state.error = 'Session expired. Please log in again.';
      state.autoLoginChecked = true;
    },

    // ── Logout ─────────────────────────────────────────────────────────────────
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isRefreshing = false;
      state.error = null;
    },

    // ── Auto Login ─────────────────────────────────────────────────────────────
    checkAutoLogin: (state) => {
      state.loading = true;
      state.error = null;
    },
    autoLoginCheckedDone: (state) => {
      state.autoLoginChecked = true;
      state.loading = false;
    },

    // ── Utility ────────────────────────────────────────────────────────────────
    clearError: (state) => {
      state.error = null;
    },

    // ── Fetch Me ───────────────────────────────────────────────────────────────
    /**
     * Dispatch to trigger GET /auth/me via saga.
     * Safe to call any time a fresh user profile is needed.
     */
    fetchMeRequest: (state) => {
      state.isFetchingMe = true;
      state.error = null;
    },

    /**
     * Saga dispatches this with the full user object from /auth/me.
     * Overwrites the stored user in Redux and AsyncStorage.
     */
    fetchMeSuccess: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isFetchingMe = false;
    },

    /**
     * Saga dispatches this when /auth/me fails (non-401 error).
     * Does not log the user out — existing session remains valid.
     */
    fetchMeFailure: (state, action: PayloadAction<string | undefined>) => {
      state.isFetchingMe = false;
      state.error = action.payload ?? 'Failed to load profile.';
    },

    // ── Update Profile ─────────────────────────────────────────────────────────
    updateProfileRequest: (
      state,
      _action: PayloadAction<{ name?: string; society?: string; sector?: string; interests?: string[]; avatarUrl?: string }>,
    ) => {
      state.isUpdatingProfile = true;
      state.error = null;
    },
    updateProfileSuccess: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isUpdatingProfile = false;
    },
    updateProfileFailure: (state, action: PayloadAction<string | undefined>) => {
      state.isUpdatingProfile = false;
      state.error = action.payload ?? 'Failed to update profile.';
    },

    // ── Fetch Stats ────────────────────────────────────────────────────────────
    fetchStatsRequest: (state) => {
      state.isFetchingStats = true;
    },
    fetchStatsSuccess: (state, action: PayloadAction<UserStats>) => {
      state.stats = action.payload;
      state.isFetchingStats = false;
    },
    fetchStatsFailure: (state) => {
      state.isFetchingStats = false;
    },
  },
});

export const {
  loginRequest,
  signUpRequest,
  loginSuccess,
  loginFailure,
  refreshTokenRequest,
  refreshTokenSuccess,
  refreshTokenFailure,
  fetchMeRequest,
  fetchMeSuccess,
  fetchMeFailure,
  updateProfileRequest,
  updateProfileSuccess,
  updateProfileFailure,
  fetchStatsRequest,
  fetchStatsSuccess,
  fetchStatsFailure,
  logout,
  checkAutoLogin,
  autoLoginCheckedDone,
  clearError,
} = authSlice.actions;

export default authSlice.reducer;
