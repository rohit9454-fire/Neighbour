import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { signUpRequest, clearError } from '../../store/slices/authSlice';
import { RootState } from '../../store';
import { AuthStackParamList } from '../../types';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { LoginStyles as styles } from './LoginStyles';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

export default function SignUpScreen({ navigation }: Props): React.JSX.Element {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);

  // Show error alert whenever the saga sets an error in Redux
  useEffect(() => {
    if (error) {
      Alert.alert('Sign Up Failed', error, [
        { text: 'OK', onPress: () => dispatch(clearError()) },
      ]);
    }
  }, [error, dispatch]);

  // Clear any stale error when screen mounts
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleSignUp = (): void => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPassword) {
      Alert.alert('Validation Error', 'Please fill in all fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      Alert.alert('Validation Error', 'Please enter a valid email address.');
      return;
    }

    if (trimmedPassword.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters.');
      return;
    }

    dispatch(signUpRequest({ name: trimmedName, email: trimmedEmail, password: trimmedPassword }));
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

        <Text style={styles.title}>Join Your Community</Text>
        <Text style={styles.subtitle}>Create your NeighbourConnect account</Text>

        <View style={styles.card}>
          {/* Full Name */}
          <View style={styles.inputContainer}>
            <Icon name="person-outline" size={22} color="#8B92B8" />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
              editable={!loading}
              autoCapitalize="words"
            />
          </View>

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
          <View style={[styles.inputContainer, { marginBottom: 0 }]}>
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

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.btn, loading && { opacity: 0.7 }]}
          onPress={handleSignUp}
          disabled={loading}
          activeOpacity={0.8}>
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.btnText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.line} />
        </View>

        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} disabled={loading}>
            <Text style={styles.signupButton}>Login</Text>
          </TouchableOpacity>
        </View>

      </View>
    </LinearGradient>
  );
}
