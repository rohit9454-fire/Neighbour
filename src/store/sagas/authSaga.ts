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
  requireBiometricAuth,
  setBiometricEnrolled,
} from '../slices/authSlice';
import { authService, AuthResponse, AuthUser, UserStats, setAuthToken, clearAuthToken } from '../../services';
import { UpdateProfilePayload } from '../../services/authService';
import { secureStorage, userStorage, biometricStorage } from '../../services/secureStorage';
import { detectBiometricType } from '../../services/biometricTypeService';
import { User } from '../../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sanitize(input: string): string {
  return input.replace(/[\r\n\t]/g, '').trim();
}

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

function* persistAuthData(user: User, token: string, refreshToken: string) {
  yield call([userStorage, userStorage.setUser], user as unknown as Record<string, unknown>);
  yield call([secureStorage, secureStorage.setTokens], token, refreshToken);
}

// After a fresh credential login, enroll biometrics if available
function* enrollBiometricsIfAvailable(email: string, password: string): Generator {
  try {
    const info: Awaited<ReturnType<typeof detectBiometricType>> =
      yield call(detectBiometricType);
    if (info.available) {
      yield call([biometricStorage, biometricStorage.saveCredentials], email, password);
      yield call([secureStorage, secureStorage.setBiometricEnrolled], true);
      yield put(setBiometricEnrolled(true));
    }
  } catch {
    // best-effort
  }
}

function* clearAuthData() {
  yield call([userStorage, userStorage.clearUser]);
  yield call([secureStorage, secureStorage.clearTokens]);
}

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

    yield put(loginSuccess({ user, token: response.token, refreshToken: response.refreshToken }));
    setSentryUser(user.id ?? user.email, user.email);
    yield* fetchAndStoreMe();
    // Enroll biometrics after signup (first install — credentials only for this session)
    yield* enrollBiometricsIfAvailable(email, password);
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

    yield put(loginSuccess({ user, token: response.token, refreshToken: response.refreshToken }));
    setSentryUser(user.id ?? user.email, user.email);
    yield* fetchAndStoreMe();
    // Enroll / refresh biometric credentials after every credential login
    yield* enrollBiometricsIfAvailable(email, password);
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
    const response: AuthResponse = yield call(authService.refresh, { refreshToken: currentRefreshToken });

    const storedUser: Record<string, unknown> | null = yield call([userStorage, userStorage.getUser]);
    const user: User = storedUser
      ? (storedUser as unknown as User)
      : mapAuthUserToUser(response.user);

    yield call([secureStorage, secureStorage.setTokens], response.token, response.refreshToken);
    setAuthToken(response.token);

    yield put(refreshTokenSuccess({ token: response.token, refreshToken: response.refreshToken }));
    yield put(loginSuccess({ user, token: response.token, refreshToken: response.refreshToken }));
  } catch {
    yield* clearAuthData();
    clearAuthToken();
    yield put(refreshTokenFailure());
  }
}

// ─── Auto Login ───────────────────────────────────────────────────────────────

function* handleAutoLogin() {
  try {
    const storedUser: Record<string, unknown> | null = yield call([userStorage, userStorage.getUser]);
    const storedTokens: { token: string; refreshToken: string } | null = yield call(
      [secureStorage, secureStorage.getTokens],
    );

    if (storedUser && storedTokens) {
      setAuthToken(storedTokens.token);

      const biometricEnrolled: boolean = yield call(
        [secureStorage, secureStorage.isBiometricEnrolled],
      );

      yield put(loginSuccess({
        user:             storedUser as unknown as User,
        token:            storedTokens.token,
        refreshToken:     storedTokens.refreshToken,
        biometricEnrolled,
      }));

      // Require biometric re-auth on fresh launch only if enrolled
      if (biometricEnrolled) {
        yield put(requireBiometricAuth());
      }

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
    yield call([biometricStorage, biometricStorage.clearCredentials]);
    yield call([secureStorage, secureStorage.setBiometricEnrolled], false);
    clearAuthToken();
    clearSentryUser();
  }
}

// ─── Root Auth Saga ───────────────────────────────────────────────────────────

export function* authSaga() {
  yield takeLatest(signUpRequest.type,        handleSignUp);
  yield takeLatest(loginRequest.type,         handleLogin);
  yield takeLatest(fetchMeRequest.type,       handleFetchMe);
  yield takeLatest(refreshTokenRequest.type,  handleRefreshToken);
  yield takeLatest(checkAutoLogin.type,       handleAutoLogin);
  yield takeLatest(updateProfileRequest.type, handleUpdateProfile);
  yield takeLatest(fetchStatsRequest.type,    handleFetchStats);
  yield takeLatest(logout.type,               handleLogout);
}
