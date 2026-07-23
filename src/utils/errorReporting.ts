/**
 * Error Reporting Utility
 *
 * Thin wrapper around Sentry so the rest of the codebase never imports
 * Sentry directly. If Sentry is not configured (no DSN), errors are
 * silently no-ops in development and logged to the console.
 */
import * as Sentry from '@sentry/react-native';

/**
 * Capture an exception in Sentry.
 * Use this in saga catch blocks instead of console.error.
 */
export function captureError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  if (__DEV__) {
    // Always log to console in development for DX
    console.error('[Error]', error, context ?? '');
  }

  if (!(error instanceof Error)) {
    Sentry.captureMessage(
      typeof error === 'string' ? error : JSON.stringify(error),
      { level: 'error', extra: context },
    );
    return;
  }

  Sentry.withScope(scope => {
    if (context) scope.setExtras(context);
    Sentry.captureException(error);
  });
}

/**
 * Set Sentry user context after login.
 * Call this from authSaga after loginSuccess.
 */
export function setSentryUser(id: string, email: string): void {
  Sentry.setUser({ id, email });
}

/**
 * Clear Sentry user context on logout.
 */
export function clearSentryUser(): void {
  Sentry.setUser(null);
}

/**
 * Add a breadcrumb for important navigation / state transitions.
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>,
): void {
  Sentry.addBreadcrumb({ message, category, data, level: 'info' });
}
