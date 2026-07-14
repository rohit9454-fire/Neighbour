import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { AuthStackParamList } from '../../types';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

export default function SignUpScreen({ navigation }: Props): React.JSX.Element {
  const { login } = useAuth();
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const handleSignUp = (): void => {
    if (!name || !email || !password) return Alert.alert('Error', 'Please fill all fields');
    login({ email, name });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🏘️</Text>
      <Text style={styles.title}>Join Your Community</Text>
      <Text style={styles.subtitle}>Create your NeighbourConnect account</Text>

      <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#9CA3AF" value={name} onChangeText={setName} />
      <TextInput
        style={styles.input} placeholder="Email" placeholderTextColor="#9CA3AF"
        value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"
      />
      <TextInput
        style={styles.input} placeholder="Password" placeholderTextColor="#9CA3AF"
        value={password} onChangeText={setPassword} secureTextEntry
      />

      <TouchableOpacity style={styles.btn} onPress={handleSignUp}>
        <Text style={styles.btnText}>Create Account</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.link}>
          Already have an account? <Text style={styles.linkBold}>Login</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', justifyContent: 'center', padding: 24 },
  logo: { fontSize: 52, textAlign: 'center', marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827', textAlign: 'center' },
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
