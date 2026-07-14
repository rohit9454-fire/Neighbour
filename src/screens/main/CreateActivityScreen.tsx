import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootState } from '../../store';
import { ActivitiesStackParamList, ActivityCategory, ActivityVisibility } from '../../types';
import { addActivity } from '../../store/slices/activitiesSlice';

type Props = NativeStackScreenProps<ActivitiesStackParamList, 'CreateActivity'>;

const CATEGORIES: ActivityCategory[] = ['Sports', 'Fitness', 'Cycling', 'Study', 'Meetups', 'Pets', 'Food', 'Other'];
const CATEGORY_EMOJIS: Record<ActivityCategory, string> = {
  Sports: '🏅', Fitness: '🏃', Cycling: '🚴', Study: '📚',
  Meetups: '👥', Pets: '🐾', Food: '🍲', Other: '✨',
};
const VISIBILITIES: ActivityVisibility[] = ['Public', 'Private', 'Society Only'];

export default function CreateActivityScreen({ navigation }: Props): React.JSX.Element {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ActivityCategory>('Sports');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [visibility, setVisibility] = useState<ActivityVisibility>('Public');

  const validate = (): string | null => {
    if (!title.trim()) return 'Title is required';
    if (!description.trim()) return 'Description is required';
    if (!location.trim()) return 'Location is required';
    if (!date.trim()) return 'Date is required';
    if (!time.trim()) return 'Time is required';
    const max = parseInt(maxParticipants, 10);
    if (isNaN(max) || max <= 0) return 'Max participants must be greater than 0';
    return null;
  };

  const handleCreate = () => {
    const error = validate();
    if (error) return Alert.alert('Validation Error', error);
    dispatch(addActivity({
      id: Date.now().toString(),
      title: title.trim(),
      category,
      description: description.trim(),
      location: location.trim(),
      date: date.trim(),
      time: time.trim(),
      duration: duration.trim() || '1 hr',
      maxParticipants: parseInt(maxParticipants, 10),
      participants: [],
      host: user?.name ?? 'You',
      emoji: CATEGORY_EMOJIS[category],
      visibility,
      status: 'upcoming',
      createdAt: new Date().toISOString(),
      distance: '0.0 km',
    }));
    Alert.alert('Activity Created!', 'Your activity is now live.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Activity</Text>
          <TouchableOpacity onPress={handleCreate}>
            <Text style={styles.postText}>Post</Text>
          </TouchableOpacity>
        </View>

        {/* Image Upload */}
        <TouchableOpacity style={styles.imagePicker}>
          <Text style={styles.imagePickerEmoji}>📷</Text>
          <Text style={styles.imagePickerText}>Add Cover Photo</Text>
          <Text style={styles.imagePickerSub}>Tap to upload from gallery</Text>
        </TouchableOpacity>

        {/* Title */}
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Morning Badminton Session"
          placeholderTextColor="#4B5563"
          value={title}
          onChangeText={setTitle}
        />

        {/* Category */}
        <Text style={styles.label}>Category *</Text>
        <View style={styles.chipsWrap}>
          {CATEGORIES.map(c => (
            <TouchableOpacity
              key={c}
              style={[styles.chip, category === c && styles.chipActive]}
              onPress={() => setCategory(c)}>
              <Text style={styles.chipEmoji}>{CATEGORY_EMOJIS[c]}</Text>
              <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Description */}
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe your activity..."
          placeholderTextColor="#4B5563"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Location */}
        <Text style={styles.label}>Location *</Text>
        <View style={styles.locationWrap}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="e.g. Community Sports Hall"
            placeholderTextColor="#4B5563"
            value={location}
            onChangeText={setLocation}
          />
          <TouchableOpacity style={styles.mapPickerBtn}>
            <Text style={styles.mapPickerText}>📍</Text>
          </TouchableOpacity>
        </View>

        {/* Date & Time */}
        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Date *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Today / 22 Jun"
              placeholderTextColor="#4B5563"
              value={date}
              onChangeText={setDate}
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Time *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 6:30 AM"
              placeholderTextColor="#4B5563"
              value={time}
              onChangeText={setTime}
            />
          </View>
        </View>

        {/* Duration & Max Participants */}
        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Duration</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 1.5 hrs"
              placeholderTextColor="#4B5563"
              value={duration}
              onChangeText={setDuration}
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Max Participants *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 10"
              placeholderTextColor="#4B5563"
              value={maxParticipants}
              onChangeText={setMaxParticipants}
              keyboardType="number-pad"
            />
          </View>
        </View>

        {/* Visibility */}
        <Text style={styles.label}>Visibility</Text>
        <View style={styles.visibilityRow}>
          {VISIBILITIES.map(v => (
            <TouchableOpacity
              key={v}
              style={[styles.visibilityChip, visibility === v && styles.visibilityChipActive]}
              onPress={() => setVisibility(v)}>
              <Text style={[styles.visibilityText, visibility === v && styles.visibilityTextActive]}>{v}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Submit */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} activeOpacity={0.85}>
          <Text style={styles.submitText}>Create Activity →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  content: { paddingHorizontal: 20, paddingBottom: 40 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  cancelText: { fontSize: 15, color: '#6B7280' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  postText: { fontSize: 15, color: '#2563EB', fontWeight: '700' },

  imagePicker: { backgroundColor: '#111', borderRadius: 16, height: 140, justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#1F2937', borderStyle: 'dashed' },
  imagePickerEmoji: { fontSize: 32, marginBottom: 8 },
  imagePickerText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  imagePickerSub: { fontSize: 12, color: '#374151', marginTop: 4 },

  label: { fontSize: 13, fontWeight: '600', color: '#9CA3AF', marginBottom: 8, marginTop: 4 },
  input: { backgroundColor: '#111', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, color: '#fff', marginBottom: 16, borderWidth: 1, borderColor: '#1F2937' },
  textArea: { height: 100, paddingTop: 14 },

  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#111', borderWidth: 1, borderColor: '#1F2937' },
  chipActive: { backgroundColor: '#1E3A8A', borderColor: '#2563EB' },
  chipEmoji: { fontSize: 14 },
  chipText: { fontSize: 12, color: '#6B7280' },
  chipTextActive: { color: '#93C5FD', fontWeight: '600' },

  locationWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  mapPickerBtn: { width: 50, height: 50, backgroundColor: '#111', borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#1F2937' },
  mapPickerText: { fontSize: 20 },

  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },

  visibilityRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  visibilityChip: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', backgroundColor: '#111', borderWidth: 1, borderColor: '#1F2937' },
  visibilityChipActive: { backgroundColor: '#1E3A8A', borderColor: '#2563EB' },
  visibilityText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  visibilityTextActive: { color: '#93C5FD', fontWeight: '700' },

  submitBtn: { backgroundColor: '#2563EB', borderRadius: 16, height: 56, justifyContent: 'center', alignItems: 'center' },
  submitText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
