import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import LottieView from 'lottie-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDispatch } from 'react-redux';
import { loginRequest } from '../../store/slices/authSlice';
import { AuthStackParamList } from '../../types';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { LoginStyles as styles } from './LoginStyles';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props): React.JSX.Element {
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);


  const handleLogin = (): void => {
    if (!email || !password) return Alert.alert('Error', 'Please fill all fields');
    dispatch(loginRequest({ email, password }));
  };

  return (
    <LinearGradient
      colors={['#004AC6', '#F8FAFF', '#FFFFFF']}
      style={styles.container}
    >
      <View style={styles.subContainer}>

        <View style={styles.homebg}>
          <LottieView source={require('../../assets/lottie/Home_icon.json')} style={styles.lottie} autoPlay loop renderMode="HARDWARE" />
        </View>

        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to your community</Text>

        <View style={styles.card}>
          <View style={styles.inputContainer}>
            <Icon
              name="mail-outline"
              size={22}
              color="#8B92B8"
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <View style={styles.inputContainer}>
            <Icon
              name="lock-closed"
              size={22}
              color="#8B92B8"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={secure}
            />
            <TouchableOpacity onPress={() => setSecure(!secure)}>
              <Icon
                name={secure ? "eye-off" : "eye"}
                size={22}
                color="#8B92B8"
              />
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
        // onPress={() => navigation.navigate('ForgotPassword')} 
        >
          <Text style={styles.forgot}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btn} onPress={handleLogin}>
          <Text style={styles.btnText}>Login</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.line} />
        </View>

        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Don't have an account?</Text>

          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.signupButton}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}


