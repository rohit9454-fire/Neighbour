import { call, put, takeLatest } from 'redux-saga/effects';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  loginRequest,
  signUpRequest,
  loginSuccess,
  loginFailure,
  fetchMeRequest,
  fetchMeSuccess,
  fetchMeFailure,
  refreshTokenRequest,
  refreshTokenSuccess,
  refreshTokenFailure,
  updateProfileRequest,
  updateProfileSuccess,
  updateProfileFailure,
  fetchStatsRequest,
  fetchStatsSuccess,
  fetchStatsFailure,
  logout,
  checkAutoLogin,
  autoLoginCheckedDone,
} from '../slices/authSlice';
import { authService, AuthResponse, AuthUser, UserStats, setAuthToken, clearAuthToken } from '../../services';
import { UpdateProfilePayload } from '../../services/authService';
import { User } from '../../types';

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const USER_KEY          = '@neighbour_user';
const TOKEN_KEY         = '@neighbour_token';
const REFRESH_TOKEN_KEY = '@neighbour_refresh_token';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sanitize(input: string): string {
  return input.replace(/[\r\n\t]/g, '').trim();
}

/** Map the API AuthUser shape → our Redux User shape. */
function mapAuthUserToUser(authUser: AuthUser): User {
  return {
    id:        authUser.id,
    name:      authUser.name,
    email:     authUser.email,
    society:   authUser.society ?? undefined,
    sector:    authUser.sector ?? undefined,
    interests: authUser.interests ?? [],
    avatarUrl: authUser.avatarUrl ?? undefined,
    role:      authUser.role,
  };
}

/** Persist all three auth values to AsyncStorage. */
function* persistAuthData(user: User, token: string, refreshToken: string) {
  yield call([AsyncStorage, AsyncStorage.setItem], USER_KEY, JSON.stringify(user));
  yield call([AsyncStorage, AsyncStorage.setItem], TOKEN_KEY, token);
  yield call([AsyncStorage, AsyncStorage.setItem], REFRESH_TOKEN_KEY, refreshToken);
}

/** Clear all three auth values from AsyncStorage. */
function* clearAuthData() {
  yield call([AsyncStorage, AsyncStorage.removeItem], USER_KEY);
  yield call([AsyncStorage, AsyncStorage.removeItem], TOKEN_KEY);
  yield call([AsyncStorage, AsyncStorage.removeItem], REFRESH_TOKEN_KEY);
}

/**
 * Calls GET /auth/me and dispatches fetchMeSuccess with the fresh profile.
 * Also overwrites the stored user in AsyncStorage so auto-login always
 * restores the latest profile data.
 *
 * On failure it dispatches fetchMeFailure — session stays alive.
 */
function* fetchAndStoreMe() {
  try {
    yield put(fetchMeRequest());

    const authUser: AuthUser = yield call(authService.getMe);
    const user = mapAuthUserToUser(authUser);

    // Overwrite persisted user with fresh data from the server
    yield call([AsyncStorage, AsyncStorage.setItem], USER_KEY, JSON.stringify(user));

    yield put(fetchMeSuccess(user));
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to load profile.';
    yield put(fetchMeFailure(message));
  }
}

// ─── Sign Up ──────────────────────────────────────────────────────────────────

function* handleSignUp(action: ReturnType<typeof signUpRequest>) {
  try {
    const name     = sanitize(action.payload.name);
    const email    = sanitize(action.payload.email);
    const password = sanitize(action.payload.password);

    if (!name || !email || !password) {
      yield put(loginFailure('Please fill in all fields.'));
      return;
    }

    const response: AuthResponse = yield call(authService.signUp, { name, email, password });

    // Map response user as initial state, then fetch full profile
    const user = mapAuthUserToUser(response.user);

    yield* persistAuthData(user, response.token, response.refreshToken);
    setAuthToken(response.token);

    // Commit initial state to Redux immediately so the app can navigate
    yield put(loginSuccess({
      user,
      token:        response.token,
      refreshToken: response.refreshToken,
    }));

    // Then fetch the authoritative profile from /auth/me and overwrite
    yield* fetchAndStoreMe();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sign up failed. Please try again.';
    yield put(loginFailure(message));
  }
}

// ─── Login ────────────────────────────────────────────────────────────────────

function* handleLogin(action: ReturnType<typeof loginRequest>) {
  try {
    const email    = sanitize(action.payload.email);
    const password = sanitize(action.payload.password);

    if (!email || !password) {
      yield put(loginFailure('Please fill in all fields.'));
      return;
    }

    const response: AuthResponse = yield call(authService.login, { email, password });

    const user = mapAuthUserToUser(response.user);

    yield* persistAuthData(user, response.token, response.refreshToken);
    setAuthToken(response.token);

    yield put(loginSuccess({
      user,
      token:        response.token,
      refreshToken: response.refreshToken,
    }));

    // Fetch full profile from /auth/me and overwrite with fresh data
    yield* fetchAndStoreMe();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Login failed. Please try again.';
    yield put(loginFailure(message));
  }
}

// ─── Fetch Me (manual dispatch) ───────────────────────────────────────────────
/**
 * Handles explicit fetchMeRequest dispatches from anywhere in the app
 * (e.g. pull-to-refresh on ProfileScreen).
 * Note: fetchAndStoreMe() also dispatches fetchMeRequest internally, so
 * we guard against double-processing with takeLatest (cancels previous run).
 */
function* handleFetchMe() {
  try {
    const authUser: AuthUser = yield call(authService.getMe);
    const user = mapAuthUserToUser(authUser);

    yield call([AsyncStorage, AsyncStorage.setItem], USER_KEY, JSON.stringify(user));
    yield put(fetchMeSuccess(user));
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to load profile.';
    yield put(fetchMeFailure(message));
  }
}

// ─── Refresh Token ────────────────────────────────────────────────────────────

function* handleRefreshToken(action: ReturnType<typeof refreshTokenRequest>) {
  try {
    const currentRefreshToken = action.payload;

    const response: AuthResponse = yield call(authService.refresh, {
      refreshToken: currentRefreshToken,
    });

    const storedUser: string | null = yield call(
      [AsyncStorage, AsyncStorage.getItem],
      USER_KEY,
    );
    const user: User = storedUser
      ? JSON.parse(storedUser)
      : mapAuthUserToUser(response.user);

    yield call([AsyncStorage, AsyncStorage.setItem], TOKEN_KEY, response.token);
    yield call([AsyncStorage, AsyncStorage.setItem], REFRESH_TOKEN_KEY, response.refreshToken);

    setAuthToken(response.token);

    yield put(refreshTokenSuccess({
      token:        response.token,
      refreshToken: response.refreshToken,
    }));

    yield put(loginSuccess({
      user,
      token:        response.token,
      refreshToken: response.refreshToken,
    }));
  } catch {
    yield* clearAuthData();
    clearAuthToken();
    yield put(refreshTokenFailure());
  }
}

// ─── Auto Login ───────────────────────────────────────────────────────────────

function* handleAutoLogin() {
  try {
    const storedUser: string | null = yield call(
      [AsyncStorage, AsyncStorage.getItem],
      USER_KEY,
    );
    const storedToken: string | null = yield call(
      [AsyncStorage, AsyncStorage.getItem],
      TOKEN_KEY,
    );
    const storedRefreshToken: string | null = yield call(
      [AsyncStorage, AsyncStorage.getItem],
      REFRESH_TOKEN_KEY,
    );

    if (storedUser && storedToken && storedRefreshToken) {
      // Restore session from storage immediately so the app can navigate
      setAuthToken(storedToken);
      yield put(loginSuccess({
        user:         JSON.parse(storedUser),
        token:        storedToken,
        refreshToken: storedRefreshToken,
      }));

      // Silently fetch fresh profile in the background — the 401 interceptor
      // will auto-refresh the token if it has expired before this call lands
      yield* fetchAndStoreMe();
    } else {
      yield put(autoLoginCheckedDone());
    }
  } catch {
    yield put(autoLoginCheckedDone());
  }
}

// ─── Update Profile ───────────────────────────────────────────────────────────

function* handleUpdateProfile(action: ReturnType<typeof updateProfileRequest>) {
  try {
    const authUser: AuthUser = yield call(authService.updateMe, action.payload as UpdateProfilePayload);
    const user = mapAuthUserToUser(authUser);
    yield call([AsyncStorage, AsyncStorage.setItem], USER_KEY, JSON.stringify(user));
    yield put(updateProfileSuccess(user));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update profile.';
    yield put(updateProfileFailure(message));
  }
}

function* handleFetchStats() {
  try {
    const stats: UserStats = yield call(authService.getMyStats);
    yield put(fetchStatsSuccess(stats));
  } catch {
    yield put(fetchStatsFailure());
  }
}

// ─── Logout ───────────────────────────────────────────────────────────────────

function* handleLogout() {
  yield* clearAuthData();
  clearAuthToken();
}

// ─── Root Auth Saga ───────────────────────────────────────────────────────────

export function* authSaga() {
  yield takeLatest(signUpRequest.type,          handleSignUp);
  yield takeLatest(loginRequest.type,           handleLogin);
  yield takeLatest(fetchMeRequest.type,         handleFetchMe);
  yield takeLatest(refreshTokenRequest.type,    handleRefreshToken);
  yield takeLatest(checkAutoLogin.type,         handleAutoLogin);
  yield takeLatest(updateProfileRequest.type,   handleUpdateProfile);
  yield takeLatest(fetchStatsRequest.type,      handleFetchStats);
  yield takeLatest(logout.type,                 handleLogout);
}
