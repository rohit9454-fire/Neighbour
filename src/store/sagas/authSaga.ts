import { call, put, takeLatest } from 'redux-saga/effects';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginRequest, signUpRequest, loginSuccess, loginFailure, logout, checkAutoLogin, autoLoginCheckedDone } from '../slices/authSlice';
import { User } from '../../types';

const USER_KEY = '@neighbour_user';

function* handleLogin(action: ReturnType<typeof loginRequest>) {
  try {
    const { email, password } = action.payload;
    if (!email || !password) throw new Error('Invalid credentials');
    const user: User = { email, name: email.split('@')[0] };
    yield call([AsyncStorage, AsyncStorage.setItem], USER_KEY, JSON.stringify(user));
    yield put(loginSuccess(user));
  } catch {
    yield put(loginFailure());
  }
}

function* handleSignUp(action: ReturnType<typeof signUpRequest>) {
  try {
    const { name, email, password } = action.payload;
    if (!name || !email || !password) throw new Error('Invalid data');
    const user: User = { email, name };
    yield call([AsyncStorage, AsyncStorage.setItem], USER_KEY, JSON.stringify(user));
    yield put(loginSuccess(user));
  } catch {
    yield put(loginFailure());
  }
}

function* handleAutoLogin() {
  try {
    const stored: string | null = yield call([AsyncStorage, AsyncStorage.getItem], USER_KEY);
    if (stored) {
      yield put(loginSuccess(JSON.parse(stored)));
    } else {
      yield put(autoLoginCheckedDone());
    }
  } catch {
    yield put(autoLoginCheckedDone());
  }
}

function* handleLogout() {
  yield call([AsyncStorage, AsyncStorage.removeItem], USER_KEY);
}

export function* authSaga() {
  yield takeLatest(loginRequest.type, handleLogin);
  yield takeLatest(signUpRequest.type, handleSignUp);
  yield takeLatest(checkAutoLogin.type, handleAutoLogin);
  yield takeLatest(logout.type, handleLogout);
}
