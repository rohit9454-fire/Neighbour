import React, { useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props): React.JSX.Element {
  const animationRef = useRef<LottieView>(null);
  const hasNavigated = useRef<boolean>(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      animationRef.current?.play();
    }, 100);
    return () => clearTimeout(timeout);
  }, []);

  const handleAnimationFinish = useCallback((): void => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    navigation.replace('Login');
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>NeighbourConnect</Text>
      <Text style={styles.subtitle}>Connect · Play · Celebrate</Text>
      <LottieView
        ref={animationRef}
        source={require('../../assets/lottie/splash.json')}
        style={styles.lottie}
        autoPlay={false}
        loop={false}
        onAnimationFinish={handleAnimationFinish}
        renderMode="HARDWARE"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 32, fontWeight: '800', color: '#3d22e9', letterSpacing: 1 },
  subtitle: { fontSize: 16, color: '#5170ec', marginTop: 8, marginBottom: 24 },
  lottie: { width: 350, height: 350 },
});
