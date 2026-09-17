import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, AppState, AppStateStatus } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import {
  checkAutoLogin,
  requireBiometricAuth,
  setBackgroundedAt,
} from '../store/slices/authSlice';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import BiometricLockScreen from '../components/BiometricLockScreen';

const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export default function RootNavigator(): React.JSX.Element {
  const dispatch = useDispatch();
  const { user, autoLoginChecked, loading, requiresBiometric, backgroundedAt } = useSelector(
    (state: RootState) => state.auth,
  );
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const backgroundedAtRef = useRef<number | null>(backgroundedAt);

  // ── Initial auto-login check ───────────────────────────────────────────────
  useEffect(() => {
    dispatch(checkAutoLogin());
  }, [dispatch]);

  // Keep ref in sync with Redux state
  useEffect(() => {
    backgroundedAtRef.current = backgroundedAt;
  }, [backgroundedAt]);

  // ── AppState listener — banking-style lock logic ───────────────────────────
  useEffect(() => {
    if (!user) return; // Only track when logged in

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      const prev = appState.current;
      appState.current = nextState;

      if (nextState === 'background' || nextState === 'inactive') {
        dispatch(setBackgroundedAt(Date.now()));
      } else if (nextState === 'active') {
        if (prev === 'background' || prev === 'inactive') {
          const elapsed = backgroundedAtRef.current
            ? Date.now() - backgroundedAtRef.current
            : Infinity;

          if (elapsed >= LOCK_TIMEOUT_MS) {
            dispatch(requireBiometricAuth());
          } else {
            dispatch(setBackgroundedAt(null));
          }
        }
      }
    });

    return () => subscription.remove();
  }, [user, dispatch]);

  // ── Lock on fresh app launch when user session exists ─────────────────────
  // Handled in authSaga handleAutoLogin — requireBiometricAuth is dispatched
  // there when biometric credentials exist, so no extra logic needed here.

  if (!autoLoginChecked || loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#4F46E5' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AppNavigator /> : <AuthNavigator />}
      {/* Lock screen overlays everything when biometric is required */}
      {user && requiresBiometric && <BiometricLockScreen />}
    </NavigationContainer>
  );
}
