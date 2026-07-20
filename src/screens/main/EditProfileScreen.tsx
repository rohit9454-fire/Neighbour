import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { updateProfileRequest, clearError } from '../../store/slices/authSlice';
import { ProfileStackParamList } from '../../types';
import { C } from '../../theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'EditProfile'>;

const INTEREST_OPTIONS = ['Sports', 'Fitness', 'Cycling', 'Study', 'Pets', 'Food', 'Meetups', 'Other'];

export default function EditProfileScreen({ navigation }: Props): React.JSX.Element {
  const dispatch = useDispatch();
  const { user, isUpdatingProfile, error } = useSelector((state: RootState) => state.auth);

  const [name, setName] = useState(user?.name ?? '');
  const [society, setSociety] = useState(user?.society ?? '');
  const [sector, setSector] = useState(user?.sector ?? '');
  const [interests, setInterests] = useState<string[]>(user?.interests ?? []);

  useEffect(() => {
    if (error) {
      Alert.alert('Update Failed', error, [{ text: 'OK', onPress: () => dispatch(clearError()) }]);
    }
  }, [error, dispatch]);

  const toggleInterest = (item: string) => {
    setInterests(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item],
    );
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Name cannot be empty.');
      return;
    }
    dispatch(updateProfileRequest({
      name: name.trim(),
      society: society.trim() || undefined,
      sector: sector.trim() || undefined,
      interests,
    }));
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Icon name="arrow-left" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={isUpdatingProfile}>
          {isUpdatingProfile
            ? <ActivityIndicator size="small" color={C.btnActive} />
            : <Text style={styles.saveBtn}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={C.textMuted}
          autoCapitalize="words"
        />

        <Text style={styles.label}>Society</Text>
        <TextInput
          style={styles.input}
          value={society}
          onChangeText={setSociety}
          placeholder="e.g. Green Valley Apartments"
          placeholderTextColor={C.textMuted}
        />

        <Text style={styles.label}>Sector</Text>
        <TextInput
          style={styles.input}
          value={sector}
          onChangeText={setSector}
          placeholder="e.g. Sector 45"
          placeholderTextColor={C.textMuted}
        />

        <Text style={styles.label}>Interests</Text>
        <View style={styles.chipsWrap}>
          {INTEREST_OPTIONS.map(item => {
            const selected = interests.includes(item);
            return (
              <TouchableOpacity
                key={item}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => toggleInterest(item)}
                activeOpacity={0.7}>
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.divider, backgroundColor: C.bgCard },
  headerTitle: { fontSize: 17, fontWeight: '700', color: C.textPrimary },
  saveBtn: { fontSize: 15, fontWeight: '700', color: C.btnActive },
  content: { padding: 20, paddingBottom: 60 },
  label: { fontSize: 12, fontWeight: '700', color: C.textMuted, letterSpacing: 0.8, marginBottom: 8, marginTop: 20 },
  input: { backgroundColor: C.bgCard, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: C.textPrimary, borderWidth: 1, borderColor: C.border },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border },
  chipSelected: { backgroundColor: C.btnActive, borderColor: C.btnActive },
  chipText: { fontSize: 13, color: C.textSecondary, fontWeight: '500' },
  chipTextSelected: { color: C.textWhite, fontWeight: '700' },
});
