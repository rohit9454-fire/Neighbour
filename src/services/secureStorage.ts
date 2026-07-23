/**
 * Secure Storage Service
 * 
 * Uses react-native-keychain for encrypted credential storage on iOS (Keychain)
 * and Android (Keystore). Falls back to AsyncStorage only when Keychain is unavailable.
 */
import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SERVICE_NAME = 'com.neighbourconnect';

// ─── Storage Keys ─────────────────────────────────────────────────────────────

export const STORAGE_KEYS = {
  USER: '@neighbour_user',
  TOKEN: '@neighbour_token',
  REFRESH_TOKEN: '@neighbour_refresh_token',
} as const;

// ─── Secure Token Storage (Keychain-backed) ──────────────────────────────────

export const secureStorage = {
  /**
   * Securely store authentication tokens using Keychain.
   * Both token and refreshToken are stored as a JSON string under a single
   * Keychain entry to minimize I/O operations.
   */
  async setTokens(token: string, refreshToken: string): Promise<void> {
    try {
      await Keychain.setGenericPassword(
        'auth_tokens',
        JSON.stringify({ token, refreshToken }),
        {
          service: SERVICE_NAME,
          accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
        },
      );
    } catch (error) {
      console.error('[SecureStorage] Failed to store tokens in Keychain:', error);
      // Fallback to AsyncStorage (less secure, but ensures app doesn't break)
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    }
  },

  /**
   * Retrieve authentication tokens from Keychain.
   * Returns null if tokens don't exist or Keychain access fails.
   */
  async getTokens(): Promise<{ token: string; refreshToken: string } | null> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: SERVICE_NAME,
      });

      if (credentials && credentials.password) {
        const parsed = JSON.parse(credentials.password);
        return {
          token: parsed.token,
          refreshToken: parsed.refreshToken,
        };
      }
      return null;
    } catch (error) {
      console.error('[SecureStorage] Failed to retrieve tokens from Keychain:', error);
      // Fallback: try AsyncStorage
      try {
        const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
        const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        if (token && refreshToken) {
          return { token, refreshToken };
        }
      } catch {
        // Ignore fallback errors
      }
      return null;
    }
  },

  /**
   * Delete tokens from Keychain. Called on logout.
   */
  async clearTokens(): Promise<void> {
    try {
      await Keychain.resetGenericPassword({ service: SERVICE_NAME });
    } catch (error) {
      console.error('[SecureStorage] Failed to clear tokens from Keychain:', error);
    }
    // Also clear AsyncStorage fallback
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch {
      // Ignore cleanup errors
    }
  },
};

// ─── User Profile Storage (AsyncStorage is acceptable for non-sensitive data) ─

export const userStorage = {
  async setUser(user: Record<string, unknown>): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  async getUser(): Promise<Record<string, unknown> | null> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    return data ? JSON.parse(data) : null;
  },

  async clearUser(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
  },
};
