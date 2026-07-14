import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types';

interface AuthState {
  user: User | null;
  loading: boolean;
  autoLoginChecked: boolean;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  autoLoginChecked: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginRequest: (state, _action: PayloadAction<{ email: string; password: string }>) => {
      state.loading = true;
    },
    signUpRequest: (state, _action: PayloadAction<{ name: string; email: string; password: string }>) => {
      state.loading = true;
    },
    loginSuccess: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.loading = false;
      state.autoLoginChecked = true;
    },
    loginFailure: (state) => {
      state.loading = false;
      state.autoLoginChecked = true;
    },
    logout: (state) => {
      state.user = null;
    },
    checkAutoLogin: (state) => {
      state.loading = true;
    },
    autoLoginCheckedDone: (state) => {
      state.autoLoginChecked = true;
      state.loading = false;
    },
  },
});

export const { loginRequest, signUpRequest, loginSuccess, loginFailure, logout, checkAutoLogin, autoLoginCheckedDone } = authSlice.actions;
export default authSlice.reducer;
