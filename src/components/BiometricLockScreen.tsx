import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, StatusBar,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import ReactNativeBiometrics from 'react-native-biometrics';
import { RootState } from '../store';
import { biometricAuthSuccess, logout, loginRequest } from '../store/slices/authSlice';
import { biometricStorage } from '../services/secureStorage';
import { detectBiometricType, BiometricTypeInfo } from '../services/biometricTypeService';

const rnBiometrics = new ReactNativeBiometrics({ allowDeviceCredentials: true });

export default function BiometricLockScreen(): React.JSX.Element {
  const dispatch = useDispatch();
  const { loading } = useSelector((state: RootState) => state.auth);

  const [biometricInfo, setBiometricInfo] = useState<BiometricTypeInfo | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const promptInProgress = useRef(false);

  const triggerPrompt = async () => {
    if (promptInProgress.current || loading) return;
    promptInProgress.current = true;
    setIsAuthenticating(true);

    try {
      const { success, error } = await rnBiometrics.simplePrompt({
        promptMessage: 'Verify your identity to continue',
        cancelButtonText: 'Cancel',
      });

      if (!success) {
        console.log('[BiometricLock] Not successful:', error);
        return;
      }

      const credentials = await biometricStorage.getCredentials();
      if (!credentials) {
        dispatch(biometricAuthSuccess());
        return;
      }

      dispatch(loginRequest({ email: credentials.email, password: credentials.password }));
    } catch (err) {
      console.warn('[BiometricLock] Prompt error:', err);
    } finally {
      promptInProgress.current = false;
      setIsAuthenticating(false);
    }
  };

  // On mount: detect biometric type then auto-trigger prompt
  useEffect(() => {
    detectBiometricType().then(info => {
      setBiometricInfo(info);
      if (info.available) {
        triggerPrompt();
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isBusy = isAuthenticating || loading;
  const icon = biometricInfo?.icon ?? 'finger-print-outline';
  const label = biometricInfo?.label ?? 'Biometrics';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0F2E" />

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Icon name={icon} size={64} color="#FFFFFF" />
        </View>

        <Text style={styles.title}>App Locked</Text>
        <Text style={styles.subtitle}>Verify your identity to continue</Text>

        <TouchableOpacity
          style={[styles.btn, isBusy && styles.btnDisabled]}
          onPress={triggerPrompt}
          disabled={isBusy}
          activeOpacity={0.8}>
          {isBusy ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Icon name={icon} size={20} color="#fff" />
              <Text style={styles.btnText}>Use {label}</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => dispatch(logout())}
          disabled={isBusy}>
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#0A0F2E',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 24,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#2563EB',
    paddingHorizontal: 36,
    paddingVertical: 16,
    borderRadius: 18,
    minWidth: 220,
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  logoutBtn: {
    marginTop: 24,
    padding: 12,
  },
  logoutText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 15,
  },
});
