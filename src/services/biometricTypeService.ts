import { NativeModules, Platform } from 'react-native';
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';

export type BiometricType = 'FaceID' | 'TouchID' | 'Fingerprint' | 'Face' | 'Both' | 'Biometrics' | null;

export interface BiometricTypeInfo {
  available: boolean;
  type: BiometricType;
  hasFingerprint: boolean;
  hasFace: boolean;
  label: string;
  icon: string; // Ionicons name
}

const rnBiometrics = new ReactNativeBiometrics({ allowDeviceCredentials: false });

export async function detectBiometricType(): Promise<BiometricTypeInfo> {
  const unavailable: BiometricTypeInfo = {
    available: false,
    type: null,
    hasFingerprint: false,
    hasFace: false,
    label: 'Biometrics',
    icon: 'finger-print-outline',
  };

  try {
    if (Platform.OS === 'ios') {
      // iOS — library correctly returns FaceID or TouchID
      const { available, biometryType } = await rnBiometrics.isSensorAvailable();
      if (!available) return unavailable;

      const isFace = biometryType === BiometryTypes.FaceID;
      return {
        available: true,
        type: biometryType as BiometricType,
        hasFingerprint: biometryType === BiometryTypes.TouchID,
        hasFace: isFace,
        label: isFace ? 'Face ID' : 'Touch ID',
        icon: isFace ? 'scan-outline' : 'finger-print-outline',
      };
    }

    // Android — use our native module to detect hardware features
    const { BiometricTypeModule } = NativeModules;
    if (!BiometricTypeModule) {
      // Fallback if native module not available
      const { available } = await rnBiometrics.isSensorAvailable();
      return available
        ? { available: true, type: 'Biometrics', hasFingerprint: true, hasFace: false, label: 'Fingerprint', icon: 'finger-print-outline' }
        : unavailable;
    }

    const { hasFingerprint, hasFace } = await BiometricTypeModule.getEnrolledBiometrics();

    if (!hasFingerprint && !hasFace) return unavailable;

    if (hasFace && hasFingerprint) {
      return {
        available: true,
        type: 'Both',
        hasFingerprint: true,
        hasFace: true,
        label: 'Face or Fingerprint',
        icon: 'scan-outline',
      };
    }

    if (hasFace) {
      return {
        available: true,
        type: 'Face',
        hasFingerprint: false,
        hasFace: true,
        label: 'Face Unlock',
        icon: 'scan-outline',
      };
    }

    return {
      available: true,
      type: 'Fingerprint',
      hasFingerprint: true,
      hasFace: false,
      label: 'Fingerprint',
      icon: 'finger-print-outline',
    };
  } catch {
    return unavailable;
  }
}
