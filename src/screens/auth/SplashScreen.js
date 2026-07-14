import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const timer = setTimeout(() => navigation.replace('Login'), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🏘️</Text>
      <Text style={styles.title}>NeighbourConnect</Text>
      <Text style={styles.subtitle}>Connect · Play · Celebrate</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center' },
  emoji: { fontSize: 72, marginBottom: 16 },
  title: { fontSize: 32, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  subtitle: { fontSize: 16, color: '#C7D2FE', marginTop: 8 },
});
