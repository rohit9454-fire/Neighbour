import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootState } from '../../store';
import { ActivitiesStackParamList, ActivityCategory, ActivityVisibility } from '../../types';
import { addActivity } from '../../store/slices/activitiesSlice';
import { C } from '../../theme';

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
      id: Date.now().toString(), title: title.trim(), category,
      description: description.trim(), location: location.trim(),
      date: date.trim(), time: time.trim(), duration: duration.trim() || '1 hr',
      maxParticipants: parseInt(maxParticipants, 10), participants: [],
      host: user?.name ?? 'You', emoji: CATEGORY_EMOJIS[category],
      visibility, status: 'upcoming', createdAt: new Date().toISOString(), distance: '0.0 km',
    }));
    Alert.alert('Activity Created!', 'Your activity is now live.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Activity</Text>
          <TouchableOpacity onPress={handleCreate}>
            <Text style={styles.postText}>Post</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.imagePicker}>
          <Icon name="camera-plus-outline" size={32} color={C.textMuted} style={{ marginBottom: 8 }} />
          <Text style={styles.imagePickerText}>Add Cover Photo</Text>
          <Text style={styles.imagePickerSub}>Tap to upload from gallery</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Title *</Text>
        <TextInput style={styles.input} placeholder="e.g. Morning Badminton Session" placeholderTextColor={C.textMuted} value={title} onChangeText={setTitle} />

        <Text style={styles.label}>Category *</Text>
        <View style={styles.chipsWrap}>
          {CATEGORIES.map(c => (
            <TouchableOpacity key={c} style={[styles.chip, category === c && styles.chipActive]} onPress={() => setCategory(c)}>
              <Text style={styles.chipEmoji}>{CATEGORY_EMOJIS[c]}</Text>
              <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Description *</Text>
        <TextInput style={[styles.input, styles.textArea]} placeholder="Describe your activity..." placeholderTextColor={C.textMuted} value={description} onChangeText={setDescription} multiline numberOfLines={4} textAlignVertical="top" />

        <Text style={styles.label}>Location *</Text>
        <View style={styles.locationWrap}>
          <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} placeholder="e.g. Community Sports Hall" placeholderTextColor={C.textMuted} value={location} onChangeText={setLocation} />
          <TouchableOpacity style={styles.mapPickerBtn}><Icon name="map-marker" size={22} color={C.btnInactive} /></TouchableOpacity>
        </View>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Date *</Text>
            <TextInput style={styles.input} placeholder="e.g. Today / 22 Jun" placeholderTextColor={C.textMuted} value={date} onChangeText={setDate} />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Time *</Text>
            <TextInput style={styles.input} placeholder="e.g. 6:30 AM" placeholderTextColor={C.textMuted} value={time} onChangeText={setTime} />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Duration</Text>
            <TextInput style={styles.input} placeholder="e.g. 1.5 hrs" placeholderTextColor={C.textMuted} value={duration} onChangeText={setDuration} />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Max Participants *</Text>
            <TextInput style={styles.input} placeholder="e.g. 10" placeholderTextColor={C.textMuted} value={maxParticipants} onChangeText={setMaxParticipants} keyboardType="number-pad" />
          </View>
        </View>

        <Text style={styles.label}>Visibility</Text>
        <View style={styles.visibilityRow}>
          {VISIBILITIES.map(v => (
            <TouchableOpacity key={v} style={[styles.visibilityChip, visibility === v && styles.visibilityChipActive]} onPress={() => setVisibility(v)}>
              <Text style={[styles.visibilityText, visibility === v && styles.visibilityTextActive]}>{v}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} activeOpacity={0.85}>
          <Text style={styles.submitText}>Create Activity </Text>
          <Icon name="arrow-right" size={18} color={C.textWhite} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  cancelText: { fontSize: 15, color: C.textMuted },
  headerTitle: { fontSize: 17, fontWeight: '700', color: C.textPrimary },
  postText: { fontSize: 15, color: C.btnInactive, fontWeight: '700' },
  imagePicker: { backgroundColor: C.bgCard, borderRadius: 16, height: 140, justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: C.border, borderStyle: 'dashed' },
  imagePickerText: { fontSize: 14, fontWeight: '600', color: C.textMuted },
  imagePickerSub: { fontSize: 12, color: C.textMuted, marginTop: 4 },
  label: { fontSize: 13, fontWeight: '600', color: C.textSecondary, marginBottom: 8, marginTop: 4 },
  input: { backgroundColor: C.bgCard, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, color: C.textPrimary, marginBottom: 16, borderWidth: 1, borderColor: C.border },
  textArea: { height: 100, paddingTop: 14 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border },
  chipActive: { backgroundColor: C.bgMuted, borderColor: C.btnActive },
  chipEmoji: { fontSize: 14 },
  chipText: { fontSize: 12, color: C.textMuted },
  chipTextActive: { color: C.btnActive, fontWeight: '600' },
  locationWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  mapPickerBtn: { width: 50, height: 50, backgroundColor: C.bgCard, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: C.border },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  visibilityRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  visibilityChip: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border },
  visibilityChipActive: { backgroundColor: C.bgMuted, borderColor: C.btnActive },
  visibilityText: { fontSize: 12, color: C.textMuted, fontWeight: '500' },
  visibilityTextActive: { color: C.btnActive, fontWeight: '700' },
  submitBtn: { backgroundColor: C.btnInactive, borderRadius: 16, height: 56, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  submitText: { fontSize: 16, fontWeight: '700', color: C.textWhite },
});
