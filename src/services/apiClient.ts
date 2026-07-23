import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

// ─── Base URL ─────────────────────────────────────────────────────────────────
// process.env variables are NOT automatically available in React Native —
// Metro does not load .env files. The URL is hardcoded here as the single
// source of truth. To use a different URL per environment, either:
//   1. Use react-native-config and reference Config.API_BASE_URL, or
//   2. Replace the string below per build variant.
const BASE_URL = 'https://neighbourconnect-s2lb-production.up.railway.app';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ─── Store Injector (breaks circular dependency) ──────────────────────────────
// We cannot import the Redux store here directly because:
//   store → rootSaga → authSaga → services/index → apiClient → store  (cycle)
// Instead the store calls injectStore(store) once after it is created.

type AppStoreShape = {
  getState: () => {
    auth: { refreshToken: string | null };
  };
  // Use a loose callable signature so any Redux store satisfies this type
  // without pulling in Redux generics and creating a circular dependency.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: (action: any) => any;
};

let _store: AppStoreShape | null = null;

export function injectStore(store: AppStoreShape): void {
  _store = store;
}

// ─── Token Helpers ────────────────────────────────────────────────────────────

export function setAuthToken(token: string): void {
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export function clearAuthToken(): void {
  delete apiClient.defaults.headers.common['Authorization'];
}

// ─── Request Interceptor ──────────────────────────────────────────────────────

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (__DEV__) {
      console.log(
        `[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
        config.data ? JSON.stringify(config.data) : '',
      );
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// ─── 401 Auto-Refresh State ───────────────────────────────────────────────────

let isRefreshing = false;

// Queue of { resolve, reject } callbacks waiting for the refresh to finish
type QueueItem = {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
};
let failedQueue: QueueItem[] = [];

function processQueue(error: unknown, newToken: string | null): void {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error || newToken === null) {
      reject(error);
    } else {
      resolve(newToken);
    }
  });
  failedQueue = [];
}

// ─── Response Interceptor ─────────────────────────────────────────────────────

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,

  async (error: AxiosError<{ message?: string; error?: string }>) => {
    // ── Network / timeout errors (no response at all) ──────────────────────────
    // error.response is undefined when the device can't reach the server.
    if (!error.response) {
      const isTimeout = error.code === 'ECONNABORTED';
      const networkMessage = isTimeout
        ? 'Request timed out. Please check your connection and try again.'
        : 'Network error. Please check your internet connection.';
      return Promise.reject(new Error(networkMessage));
    }

    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // ── Non-401 errors: surface the server message and reject ─────────────────
    if (error.response.status !== 401) {
      const message =
        error.response.data?.message ??
        error.response.data?.error ??
        error.message ??
        'Something went wrong. Please try again.';
      return Promise.reject(new Error(message));
    }

    // ── Guard: if config is missing we cannot retry ────────────────────────────
    if (!originalRequest) {
      return Promise.reject(new Error('Session expired. Please log in again.'));
    }

    // ── Already retried once → give up to avoid infinite loop ─────────────────
    if (originalRequest._retry) {
      processQueue(new Error('Session expired'), null);
      _store?.dispatch({ type: 'auth/refreshTokenFailure' });
      return Promise.reject(new Error('Session expired. Please log in again.'));
    }

    // ── Another request is already refreshing → queue this one ────────────────
    if (isRefreshing) {
      return new Promise<AxiosResponse>((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          },
          reject,
        });
      });
    }

    // ── First 401 → attempt token refresh ─────────────────────────────────────
    originalRequest._retry = true;
    isRefreshing = true;

    const storedRefreshToken = _store?.getState().auth.refreshToken ?? null;

    if (!storedRefreshToken) {
      isRefreshing = false;
      processQueue(new Error('No refresh token'), null);
      _store?.dispatch({ type: 'auth/refreshTokenFailure' });
      return Promise.reject(new Error('Session expired. Please log in again.'));
    }

    try {
      const { authService } = await import('./authService');
      const refreshResponse = await authService.refresh({
        refreshToken: storedRefreshToken,
      });

      const newToken        = refreshResponse.token;
      const newRefreshToken = refreshResponse.refreshToken;

      setAuthToken(newToken);

      _store?.dispatch({
        type: 'auth/refreshTokenRequest',
        payload: storedRefreshToken,
      });

      _store?.dispatch({
        type: 'auth/refreshTokenSuccess',
        payload: { token: newToken, refreshToken: newRefreshToken },
      });

      processQueue(null, newToken);

      originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
      return apiClient(originalRequest);
    } catch (refreshError: unknown) {
      processQueue(refreshError, null);
      clearAuthToken();
      _store?.dispatch({ type: 'auth/refreshTokenFailure' });
      return Promise.reject(
        new Error('Session expired. Please log in again.'),
      );
    } finally {
      isRefreshing = false;
    }
  },
);

export default apiClient;
