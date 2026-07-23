import { call, put, takeLatest } from 'redux-saga/effects';
import { setSentryUser, clearSentryUser, captureError } from '../../utils/errorReporting';
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
import { secureStorage, userStorage } from '../../services/secureStorage';
import { User } from '../../types';

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

/** Persist all auth values to secure storage. */
function* persistAuthData(user: User, token: string, refreshToken: string) {
  // User profile goes to AsyncStorage (non-sensitive)
  yield call([userStorage, userStorage.setUser], user as unknown as Record<string, unknown>);
  // Tokens go to Keychain (encrypted)
  yield call([secureStorage, secureStorage.setTokens], token, refreshToken);
}

/** Clear all auth data from both secure storage and AsyncStorage. */
function* clearAuthData() {
  yield call([userStorage, userStorage.clearUser]);
  yield call([secureStorage, secureStorage.clearTokens]);
}

/**
 * Calls GET /auth/me and dispatches fetchMeSuccess with the fresh profile.
 * Also overwrites the stored user so auto-login always restores the latest profile.
 */
function* fetchAndStoreMe() {
  try {
    yield put(fetchMeRequest());
    const authUser: AuthUser = yield call(authService.getMe);
    const user = mapAuthUserToUser(authUser);
    yield call([userStorage, userStorage.setUser], user as unknown as Record<string, unknown>);
    yield put(fetchMeSuccess(user));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load profile.';
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
    const user = mapAuthUserToUser(response.user);

    yield* persistAuthData(user, response.token, response.refreshToken);
    setAuthToken(response.token);

    yield put(loginSuccess({
      user,
      token:        response.token,
      refreshToken: response.refreshToken,
    }));

    // Set Sentry user context so errors are tagged to the logged-in user
    setSentryUser(user.id ?? user.email, user.email);

    yield* fetchAndStoreMe();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sign up failed. Please try again.';
    captureError(error, { saga: 'handleSignUp' });
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

    // Set Sentry user context
    setSentryUser(user.id ?? user.email, user.email);

    yield* fetchAndStoreMe();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Login failed. Please try again.';
    captureError(error, { saga: 'handleLogin' });
    yield put(loginFailure(message));
  }
}

// ─── Fetch Me (manual dispatch) ───────────────────────────────────────────────

function* handleFetchMe() {
  try {
    const authUser: AuthUser = yield call(authService.getMe);
    const user = mapAuthUserToUser(authUser);
    yield call([userStorage, userStorage.setUser], user as unknown as Record<string, unknown>);
    yield put(fetchMeSuccess(user));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load profile.';
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

    const storedUser: Record<string, unknown> | null = yield call(
      [userStorage, userStorage.getUser],
    );
    const user: User = storedUser
      ? (storedUser as unknown as User)
      : mapAuthUserToUser(response.user);

    // Update stored tokens securely
    yield call([secureStorage, secureStorage.setTokens], response.token, response.refreshToken);
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
    const storedUser: Record<string, unknown> | null = yield call(
      [userStorage, userStorage.getUser],
    );
    const storedTokens: { token: string; refreshToken: string } | null = yield call(
      [secureStorage, secureStorage.getTokens],
    );

    if (storedUser && storedTokens) {
      setAuthToken(storedTokens.token);
      yield put(loginSuccess({
        user:         storedUser as unknown as User,
        token:        storedTokens.token,
        refreshToken: storedTokens.refreshToken,
      }));

      // Silently refresh profile in the background
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
    yield call([userStorage, userStorage.setUser], user as unknown as Record<string, unknown>);
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
  try {
    yield call(authService.logout);
  } catch {
    // Best-effort server logout — still clear local credentials
  } finally {
    yield* clearAuthData();
    clearAuthToken();
    clearSentryUser();
  }
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
