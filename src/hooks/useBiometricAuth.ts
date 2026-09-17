import { useState, useCallback, useEffect } from 'react';
import ReactNativeBiometrics from 'react-native-biometrics';
import { detectBiometricType, BiometricTypeInfo } from '../services/biometricTypeService';

const rnBiometrics = new ReactNativeBiometrics({ allowDeviceCredentials: true });

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
}

interface UseBiometricAuthReturn extends BiometricTypeInfo {
  authenticate: (promptMessage?: string) => Promise<BiometricAuthResult>;
}

const DEFAULT_INFO: BiometricTypeInfo = {
  available: false,
  type: null,
  hasFingerprint: false,
  hasFace: false,
  label: 'Biometrics',
  icon: 'finger-print-outline',
};

export function useBiometricAuth(): UseBiometricAuthReturn {
  const [info, setInfo] = useState<BiometricTypeInfo>(DEFAULT_INFO);

  useEffect(() => {
    detectBiometricType().then(setInfo);
  }, []);

  const authenticate = useCallback(
    async (promptMessage = 'Sign in to NeighbourConnect'): Promise<BiometricAuthResult> => {
      try {
        const result = await rnBiometrics.simplePrompt({
          promptMessage,
          cancelButtonText: 'Cancel',
          fallbackPromptMessage: 'Use device passcode',
        });
        return { success: result.success, error: result.error };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Biometric authentication failed',
        };
      }
    },
    [],
  );

  return { ...info, authenticate };
}
