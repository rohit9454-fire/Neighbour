/**
 * NetworkBanner
 * 
 * Displays an animated offline/reconnected banner at the top of the screen.
 * Appears when the device loses internet connectivity and briefly shows a
 * success message when connection is restored.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { C } from '../theme';

export default function NetworkBanner(): React.JSX.Element | null {
  const { isConnected } = useNetworkStatus();
  const slideAnim = useRef(new Animated.Value(-56)).current;
  const [showRestored, setShowRestored] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isConnected) {
      // Coming offline: track that we've been offline and slide banner in
      setWasOffline(true);
      setShowRestored(false);
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else if (wasOffline) {
      // Coming back online after being offline: show "restored" briefly
      setShowRestored(true);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();

      // Hide after 2.5 seconds
      hideTimerRef.current = setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: -56,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setShowRestored(false);
          setWasOffline(false);
        });
      }, 2500);
    }

    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  // Nothing to show if we haven't been offline
  if (isConnected && !wasOffline) {
    return null;
  }

  const isRestored = showRestored && isConnected;

  return (
    <Animated.View
      style={[
        styles.banner,
        isRestored ? styles.bannerOnline : styles.bannerOffline,
        { transform: [{ translateY: slideAnim }] },
      ]}
      accessibilityRole="alert"
      accessibilityLabel={isRestored ? 'Connection restored' : 'No internet connection'}>
      <Icon
        name={isRestored ? 'wifi-check' : 'wifi-off'}
        size={16}
        color="#fff"
        style={styles.icon}
      />
      <Text style={styles.text}>
        {isRestored ? 'Connection restored' : 'No internet connection'}
      </Text>
      {!isRestored && (
        <View style={styles.dot} />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    paddingHorizontal: 16,
  },
  bannerOffline: {
    backgroundColor: '#1F2937', // dark gray
  },
  bannerOnline: {
    backgroundColor: C.success,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginLeft: 8,
  },
});
