import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootState } from '../../store';
import { ActivitiesStackParamList } from '../../types';
import {
  clearUpdateActivityState,
  selectActivityById,
  updateActivityRequest,
} from '../../store/slices/activitiesSlice';
import { C } from '../../theme';

type Props = NativeStackScreenProps<ActivitiesStackParamList, 'EditActivity'>;

export default function EditActivityScreen({ route, navigation }: Props): React.JSX.Element {
  const { activityId } = route.params;
  const dispatch = useDispatch();
  const activity = useSelector(selectActivityById(activityId));
  const { isUpdating, updateError, lastUpdatedId } = useSelector(
    (state: RootState) => state.activities,
  );
  const [title, setTitle] = useState(activity?.title ?? '');
  const [description, setDescription] = useState(activity?.description ?? '');
  const [date, setDate] = useState(activity?.date.slice(0, 10) ?? '');

  useEffect(() => {
    if (!updateError) return;
    Alert.alert('Could not update activity', updateError, [
      { text: 'OK', onPress: () => dispatch(clearUpdateActivityState()) },
    ]);
  }, [dispatch, updateError]);

  useEffect(() => {
    if (lastUpdatedId !== activityId) return;
    Alert.alert('Activity updated', 'Your changes are now live.', [
      {
        text: 'OK',
        onPress: () => {
          dispatch(clearUpdateActivityState());
          navigation.goBack();
        },
      },
    ]);
  }, [activityId, dispatch, lastUpdatedId, navigation]);

  if (!activity) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>Activity not found</Text>
      </SafeAreaView>
    );
  }

  const handleSave = () => {
    if (!title.trim() || !description.trim() || !date.trim()) {
      Alert.alert('Validation Error', 'Title, description, and date are required.');
      return;
    }
    if (Number.isNaN(Date.parse(date))) {
      Alert.alert('Validation Error', 'Enter a valid date.');
      return;
    }

    const normalizedDate = new Date(date).toISOString();
    const changes = {
      ...(title.trim() !== activity.title ? { title: title.trim() } : {}),
      ...(description.trim() !== activity.description
        ? { description: description.trim() }
        : {}),
      ...(normalizedDate !== activity.date ? { date: normalizedDate } : {}),
    };

    if (Object.keys(changes).length === 0) {
      Alert.alert('No changes', 'Update at least one field before saving.');
      return;
    }

    dispatch(updateActivityRequest({ activityId, changes }));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} disabled={isUpdating}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Activity</Text>
        <TouchableOpacity onPress={handleSave} disabled={isUpdating}>
          {isUpdating ? <ActivityIndicator size="small" color={C.btnActive} /> : <Text style={styles.save}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Title</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Activity title" placeholderTextColor={C.textMuted} />

        <Text style={styles.label}>Description</Text>
        <TextInput style={[styles.input, styles.description]} value={description} onChangeText={setDescription} multiline textAlignVertical="top" placeholder="Describe your activity" placeholderTextColor={C.textMuted} />

        <Text style={styles.label}>Date</Text>
        <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={C.textMuted} autoCapitalize="none" />

        <TouchableOpacity style={[styles.submit, isUpdating && styles.submitDisabled]} onPress={handleSave} disabled={isUpdating}>
          {isUpdating ? <ActivityIndicator color={C.textWhite} /> : <Text style={styles.submitText}>Save Changes</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { alignItems: 'center', backgroundColor: C.bgCard, borderBottomColor: C.border, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { color: C.textPrimary, fontSize: 17, fontWeight: '700' },
  cancel: { color: C.textMuted, fontSize: 15 },
  save: { color: C.btnActive, fontSize: 15, fontWeight: '700' },
  content: { padding: 20 },
  label: { color: C.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 8 },
  input: { backgroundColor: C.bgCard, borderColor: C.border, borderRadius: 14, borderWidth: 1, color: C.textPrimary, fontSize: 15, marginBottom: 16, paddingHorizontal: 16, paddingVertical: 14 },
  description: { height: 120 },
  submit: { alignItems: 'center', backgroundColor: C.btnInactive, borderRadius: 16, marginTop: 12, paddingVertical: 17 },
  submitDisabled: { opacity: 0.7 },
  submitText: { color: C.textWhite, fontSize: 16, fontWeight: '700' },
  notFound: { color: C.textPrimary, fontSize: 16, marginTop: 40, textAlign: 'center' },
});
