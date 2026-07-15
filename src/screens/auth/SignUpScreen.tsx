import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import LottieView from 'lottie-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDispatch } from 'react-redux';
import { signUpRequest } from '../../store/slices/authSlice';
import { AuthStackParamList } from '../../types';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { LoginStyles as styles } from './LoginStyles';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

export default function SignUpScreen({ navigation }: Props): React.JSX.Element {
  const dispatch = useDispatch();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);

  const handleSignUp = (): void => {
    if (!name || !email || !password) return Alert.alert('Error', 'Please fill all fields');
    dispatch(signUpRequest({ name, email, password }));
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

        <Text style={styles.title}>Join Your Community</Text>
        <Text style={styles.subtitle}>Create your NeighbourConnect account</Text>

        <View style={styles.card}>
          <View style={styles.inputContainer}>
            <Icon name="person-outline" size={22} color="#8B92B8" />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
            />
          </View>
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
            />
          </View>
          <View style={[styles.inputContainer, { marginBottom: 0 }]}>
            <Icon name="lock-closed" size={22} color="#8B92B8" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={secure}
            />
            <TouchableOpacity onPress={() => setSecure(!secure)}>
              <Icon name={secure ? 'eye-off' : 'eye'} size={22} color="#8B92B8" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.btn} onPress={handleSignUp}>
          <Text style={styles.btnText}>Create Account</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.line} />
        </View>

        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.signupButton}>Login</Text>
          </TouchableOpacity>
        </View>

      </View>
    </LinearGradient>
  );
}
