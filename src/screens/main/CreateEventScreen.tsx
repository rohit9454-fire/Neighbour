import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDispatch } from 'react-redux';
import { addEventRequest } from '../../store/slices/eventsSlice';
import { HomeStackParamList, EventCategory } from '../../types';

type Props = NativeStackScreenProps<HomeStackParamList, 'CreateEvent'>;

const CATEGORIES: EventCategory[] = ['Sports', 'Culture', 'Social', 'Hobby', 'Other'];

export default function CreateEventScreen({ navigation }: Props): React.JSX.Element {
  const dispatch = useDispatch();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<EventCategory>('Sports');

  const handleCreate = (): void => {
    if (!title || !date || !location) return Alert.alert('Error', 'Please fill all fields');
    dispatch(addEventRequest({ title, date, location, category, emoji: '' }));
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.label}>Event Title</Text>
      <TextInput style={styles.input} placeholder="e.g. Sunday Football Match" placeholderTextColor="#9CA3AF" value={title} onChangeText={setTitle} />

      <Text style={styles.label}>Date & Time</Text>
      <TextInput style={styles.input} placeholder="e.g. Sun, 22 Jun · 7:00 AM" placeholderTextColor="#9CA3AF" value={date} onChangeText={setDate} />

      <Text style={styles.label}>Location</Text>
      <TextInput style={styles.input} placeholder="e.g. Central Park Ground" placeholderTextColor="#9CA3AF" value={location} onChangeText={setLocation} />

      <Text style={styles.label}>Category</Text>
      <View style={styles.chips}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity key={c} style={[styles.chip, category === c && styles.chipActive]} onPress={() => setCategory(c)}>
            <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.btn} onPress={handleCreate}>
        <Text style={styles.btnText}>Create Event</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, fontSize: 15, color: '#111827' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  chipActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  chipText: { fontSize: 13, color: '#6B7280' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  btn: { backgroundColor: '#4F46E5', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 28 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
