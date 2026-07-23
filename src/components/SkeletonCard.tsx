/**
 * SkeletonCard
 *
 * Reusable shimmer-style placeholder cards used as loading states across
 * the app. Provides two variants:
 *   - "activity"  — tall card matching the ActivityCard layout
 *   - "compact"   — shorter card for list rows (e.g. MyActivities, Chat)
 *
 * Uses CSS-style animated opacity to simulate a shimmer without a third-party
 * library, keeping the dependency tree lean.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { C } from '../theme';

interface SkeletonCardProps {
  variant?: 'activity' | 'compact';
}

export default function SkeletonCard({ variant = 'activity' }: SkeletonCardProps): React.JSX.Element {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  if (variant === 'compact') {
    return (
      <Animated.View style={[styles.card, { opacity }]}>
        <View style={styles.circle} />
        <View style={styles.lines}>
          <View style={[styles.line, { width: '65%' }]} />
          <View style={[styles.line, { width: '45%', marginTop: 8 }]} />
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.card, styles.cardTall, { opacity }]}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <View style={[styles.line, { width: '35%', height: 12 }]} />
        <View style={[styles.line, { width: '20%', height: 12 }]} />
      </View>
      {/* Body */}
      <View style={styles.body}>
        <View style={styles.emoji} />
        <View style={styles.lines}>
          <View style={[styles.line, { width: '75%', height: 14 }]} />
          <View style={[styles.line, { width: '55%', marginTop: 8 }]} />
          <View style={[styles.line, { width: '60%', marginTop: 6 }]} />
          <View style={[styles.line, { width: '40%', marginTop: 6 }]} />
        </View>
      </View>
      {/* Footer */}
      <View style={styles.footer}>
        <View style={[styles.line, { width: '25%', height: 28, borderRadius: 8 }]} />
        <View style={[styles.line, { width: '20%', height: 10 }]} />
        <View style={[styles.line, { width: '22%', height: 32, borderRadius: 10 }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.bgCard,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: C.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTall: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  circle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.bgMuted,
    marginRight: 12,
  },
  emoji: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: C.bgMuted,
    marginRight: 14,
  },
  lines: { flex: 1 },
  line: {
    height: 10,
    backgroundColor: C.bgMuted,
    borderRadius: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.divider,
  },
});
