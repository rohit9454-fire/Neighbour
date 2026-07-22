import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { loginRequest, clearError } from '../../store/slices/authSlice';
import { RootState } from '../../store';
import { AuthStackParamList } from '../../types';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { LoginStyles as styles } from './LoginStyles';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props): React.JSX.Element {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);

  // Show API error as an alert
  useEffect(() => {
    if (error) {
      Alert.alert('Login Failed', error, [
        { text: 'OK', onPress: () => dispatch(clearError()) },
      ]);
    }
  }, [error, dispatch]);

  // Clear any stale error when screen mounts
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleLogin = (): void => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      Alert.alert('Validation Error', 'Please fill in all fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      Alert.alert('Validation Error', 'Please enter a valid email address.');
      return;
    }

    dispatch(loginRequest({ email: trimmedEmail, password: trimmedPassword }));
  };

  return (
    <LinearGradient colors={['#004AC6', '#F8FAFF', '#FFFFFF']} style={styles.container}>
      <View style={styles.subContainer}>

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

        <View style={styles.card}>
          {/* Email */}
          <View style={styles.inputContainer}>
            <Icon name="mail-outline" size={22} color="#8B92B8" />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <Icon name="lock-closed" size={22} color="#8B92B8" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={secure}
              editable={!loading}
            />
            <TouchableOpacity onPress={() => setSecure(s => !s)} disabled={loading}>
              <Icon name={secure ? 'eye-off' : 'eye'} size={22} color="#8B92B8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Forgot Password */}
        <TouchableOpacity
          activeOpacity={0.7}
          disabled={loading}
          onPress={() =>
            Alert.alert(
              'Reset Password',
              'Please contact support or use the reset link sent to your registered email.',
            )
          }>
          <Text style={styles.forgot}>Forgot Password?</Text>
        </TouchableOpacity>

        {/* Login Button */}
        <TouchableOpacity
          style={[styles.btn, loading && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}>
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.btnText}>Login</Text>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.line} />
        </View>

        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')} disabled={loading}>
            <Text style={styles.signupButton}>Create Account</Text>
          </TouchableOpacity>
        </View>

      </View>
    </LinearGradient>
  );
}
