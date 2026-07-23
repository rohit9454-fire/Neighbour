import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import * as Sentry from '@sentry/react-native';
import { store } from './src/store';
import RootNavigator from './src/navigation/RootNavigator';
import NetworkBanner from './src/components/NetworkBanner';
import { networkService } from './src/services/networkService';

// ─── Sentry initialisation ─────────────────────────────────────────────────────
// DSN is intentionally left as an env-configurable value.
// Set SENTRY_DSN in your .env file for production builds.
Sentry.init({
  dsn: '',   // Set your DSN here or via a build-time constant
  tracesSampleRate: __DEV__ ? 1.0 : 0.2,
  enabled: !__DEV__,
  environment: __DEV__ ? 'development' : 'production',
});

function App() {
  useEffect(() => {
    networkService.initialize();
    return () => networkService.cleanup();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />
        <Provider store={store}>
          <RootNavigator />
          {/* Overlay banner — rendered outside NavigationContainer so it
              appears on every screen including auth screens */}
          <NetworkBanner />
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// Wrap with Sentry error boundary so unhandled JS errors are captured and
// reported, rather than silently crashing the app.
export default Sentry.wrap(App);
