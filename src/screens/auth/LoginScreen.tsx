import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import LottieView from 'lottie-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { AuthStackParamList } from '../../types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props): React.JSX.Element {
  const { login } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const handleLogin = (): void => {
    if (!email || !password) return Alert.alert('Error', 'Please fill all fields');
    login({ email, name: email.split('@')[0] });
  };

  return (
    <View style={styles.container}>
      <View style={styles.homebg}>
        <LottieView
          source={require('../../assets/lottie/Home_icon.json')}
          style={styles.lottie}
          autoPlay
          loop
          renderMode="HARDWARE"
        />
      </View>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Sign in to your community</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#9CA3AF"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#9CA3AF"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.btn} onPress={handleLogin}>
        <Text style={styles.btnText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
        <Text style={styles.link}>
          Don't have an account? <Text style={styles.linkBold}>Sign Up</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', justifyContent: 'center', padding: 24 },
  homebg: { height: 100, width: 100, backgroundColor: '#3e44f0', alignSelf: 'center', alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  lottie: { height: 100, width: 100 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827', textAlign: 'center', marginTop: 16 },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 32 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 12, padding: 14, fontSize: 15, color: '#111827', marginBottom: 14,
  },
  btn: { backgroundColor: '#4F46E5', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { textAlign: 'center', color: '#6B7280', marginTop: 20, fontSize: 14 },
  linkBold: { color: '#4F46E5', fontWeight: '700' },
});
