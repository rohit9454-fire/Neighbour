import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

// Base URL is read from the .env file so staging/prod can be switched without
// code changes. Falls back to the production URL if the variable is missing.
const BASE_URL =
  process.env.API_BASE_URL ??
  'https://neighbourconnect-s2lb-production.up.railway.app';

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
  (config: InternalAxiosRequestConfig) => config,
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
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // ── Non-401 errors: surface the server message and reject ─────────────────
    if (error.response?.status !== 401) {
      const message =
        error.response?.data?.message ??
        error.response?.data?.error ??
        error.message ??
        'Something went wrong. Please try again.';
      return Promise.reject(new Error(message));
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
      // No refresh token available — force logout immediately
      isRefreshing = false;
      processQueue(new Error('No refresh token'), null);
      _store?.dispatch({ type: 'auth/refreshTokenFailure' });
      return Promise.reject(new Error('Session expired. Please log in again.'));
    }

    try {
      // Call /auth/refresh directly (bypasses the interceptor via a plain import)
      const { authService } = await import('./authService');
      const refreshResponse = await authService.refresh({
        refreshToken: storedRefreshToken,
      });

      const newToken        = refreshResponse.token;
      const newRefreshToken = refreshResponse.refreshToken;

      // Update Axios header globally
      setAuthToken(newToken);

      // Notify Redux + AsyncStorage via the saga
      _store?.dispatch({
        type: 'auth/refreshTokenRequest',
        payload: storedRefreshToken,
      });

      // Directly update slice state with the new pair (saga will also persist)
      _store?.dispatch({
        type: 'auth/refreshTokenSuccess',
        payload: { token: newToken, refreshToken: newRefreshToken },
      });

      // Unblock all queued requests with the new token
      processQueue(null, newToken);

      // Replay the original failed request
      originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
      return apiClient(originalRequest);
    } catch (refreshError: unknown) {
      // Refresh itself failed → force full logout
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
