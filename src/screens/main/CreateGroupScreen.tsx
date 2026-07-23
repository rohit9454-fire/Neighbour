import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  createGroupRequest, clearCreateGroupState,
  selectIsCreatingGroup, selectCreateGroupError, selectLastCreatedGroupId,
} from '../../store/slices/groupsSlice';
import { GroupsStackParamList, GroupCategory } from '../../types';
import { C } from '../../theme';

type Props = NativeStackScreenProps<GroupsStackParamList, 'CreateGroup'>;

const CATS: { key: GroupCategory; emoji: string; label: string }[] = [
  { key: 'Community', emoji: '🏘️', label: 'Community' },
  { key: 'Sports',    emoji: '⚽',  label: 'Sports'    },
  { key: 'Culture',   emoji: '🎭',  label: 'Culture'   },
  { key: 'Social',    emoji: '🎉',  label: 'Social'    },
  { key: 'Hobby',     emoji: '🎨',  label: 'Hobby'     },
  { key: 'Other',     emoji: '📌',  label: 'Other'     },
];

const CAT_BG: Record<GroupCategory, string> = {
  Community: '#FEF3C7', Sports: '#DBEAFE', Culture: '#EDE9FE',
  Social: '#FCE7F3', Hobby: '#D1FAE5', Other: C.bgMuted,
};
const CAT_FG: Record<GroupCategory, string> = {
  Community: '#92400E', Sports: '#1D4ED8', Culture: '#6D28D9',
  Social: '#BE185D', Hobby: '#065F46', Other: C.textSecondary,
};

export default function CreateGroupScreen({ navigation }: Props): React.JSX.Element {
  const dispatch      = useDispatch();
  const isCreating    = useSelector(selectIsCreatingGroup);
  const createError   = useSelector(selectCreateGroupError);
  const lastCreatedId = useSelector(selectLastCreatedGroupId);

  const [name, setName]         = useState('');
  const [category, setCategory] = useState<GroupCategory>('Community');
  const [desc, setDesc]         = useState('');

  // Show API error
  useEffect(() => {
    if (!createError) return;
    Alert.alert('Could not create group', createError, [
      { text: 'OK', onPress: () => dispatch(clearCreateGroupState()) },
    ]);
  }, [createError, dispatch]);

  // Navigate on success
  useEffect(() => {
    if (!lastCreatedId) return;
    Alert.alert('Group Created! 🎉', 'Your group is now live.', [
      { text: 'OK', onPress: () => { dispatch(clearCreateGroupState()); navigation.goBack(); } },
    ]);
  }, [lastCreatedId, dispatch, navigation]);

  const handleCreate = () => {
    if (!name.trim()) return Alert.alert('Validation Error', 'Group name is required.');
    dispatch(createGroupRequest({
      name:        name.trim(),
      category,
      description: desc.trim() || undefined,
    }));
  };

  const selectedCat = CATS.find(c => c.key === category)!;

  return (
    <SafeAreaView style={s.root}>
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={s.cancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>New Group</Text>
          <TouchableOpacity onPress={handleCreate} disabled={isCreating}>
            {isCreating
              ? <ActivityIndicator size="small" color={C.btnInactive} />
              : <Text style={s.post}>Create</Text>}
          </TouchableOpacity>
        </View>

        {/* Preview card */}
        <View style={s.preview}>
          <View style={[s.previewEmoji, { backgroundColor: CAT_BG[category] }]}>
            <Text style={s.previewEmojiTxt}>{selectedCat.emoji}</Text>
          </View>
          <View style={s.previewInfo}>
            <Text style={s.previewName} numberOfLines={1}>
              {name.trim() || 'Group Name'}
            </Text>
            <View style={[s.previewCat, { backgroundColor: CAT_BG[category] }]}>
              <Text style={[s.previewCatTxt, { color: CAT_FG[category] }]}>{category}</Text>
            </View>
          </View>
        </View>

        {/* Name */}
        <Text style={s.label}>Group Name *</Text>
        <TextInput
          style={s.input}
          placeholder="e.g. Sunday Football Club"
          placeholderTextColor={C.textMuted}
          value={name} onChangeText={setName} maxLength={80}
          autoFocus
        />

        {/* Category */}
        <Text style={s.label}>Category *</Text>
        <View style={s.catGrid}>
          {CATS.map(({ key, emoji, label }) => {
            const active = category === key;
            return (
              <TouchableOpacity
                key={key}
                style={[
                  s.catCard,
                  active && { borderColor: CAT_FG[key], backgroundColor: CAT_BG[key] },
                ]}
                onPress={() => setCategory(key)}>
                <Text style={s.catCardEmoji}>{emoji}</Text>
                <Text style={[s.catCardTxt, active && { color: CAT_FG[key], fontWeight: '700' }]}>
                  {label}
                </Text>
                {active && (
                  <View style={[s.catCheck, { backgroundColor: CAT_FG[key] }]}>
                    <Icon name="check" size={10} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Description */}
        <Text style={s.label}>Description</Text>
        <TextInput
          style={[s.input, s.textArea]}
          placeholder="What is this group about?"
          placeholderTextColor={C.textMuted}
          value={desc} onChangeText={setDesc}
          multiline numberOfLines={4}
          textAlignVertical="top" maxLength={300}
        />
        <Text style={s.charCount}>{desc.length}/300</Text>

        {/* Submit */}
        <TouchableOpacity
          style={[s.submitBtn, isCreating && { opacity: 0.7 }]}
          onPress={handleCreate} disabled={isCreating} activeOpacity={0.85}>
          {isCreating
            ? <ActivityIndicator color={C.textWhite} />
            : <>
                <Icon name="account-group-outline" size={20} color={C.textWhite} />
                <Text style={s.submitTxt}>Create Group</Text>
              </>}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.bg },
  content: { paddingHorizontal: 20, paddingBottom: 60 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 16,
  },
  cancel:      { fontSize: 15, color: C.textMuted },
  headerTitle: { fontSize: 17, fontWeight: '700', color: C.textPrimary },
  post:        { fontSize: 15, color: C.btnInactive, fontWeight: '700' },

  preview: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.bgCard, borderRadius: 18,
    padding: 16, marginBottom: 24, gap: 14,
    shadowColor: C.shadow, shadowOpacity: 0.08,
    shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  previewEmoji: {
    width: 60, height: 60, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  previewEmojiTxt: { fontSize: 30 },
  previewInfo:     { flex: 1 },
  previewName:     { fontSize: 16, fontWeight: '700', color: C.textPrimary, marginBottom: 6 },
  previewCat:      { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  previewCatTxt:   { fontSize: 11, fontWeight: '700' },

  label: { fontSize: 13, fontWeight: '600', color: C.textSecondary, marginBottom: 8, marginTop: 4 },

  input: {
    backgroundColor: C.bgCard, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 14, color: C.textPrimary,
    marginBottom: 16, borderWidth: 1, borderColor: C.border,
  },
  textArea: { height: 100, paddingTop: 14 },
  charCount: { fontSize: 11, color: C.textMuted, textAlign: 'right', marginTop: -12, marginBottom: 16 },

  catGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 10, marginBottom: 20,
  },
  catCard: {
    width: '30%', aspectRatio: 1,
    backgroundColor: C.bgCard, borderRadius: 16,
    borderWidth: 1.5, borderColor: C.border,
    justifyContent: 'center', alignItems: 'center', gap: 4,
  },
  catCardEmoji: { fontSize: 22 },
  catCardTxt:   { fontSize: 11, color: C.textSecondary, fontWeight: '500' },
  catCheck: {
    position: 'absolute', top: 6, right: 6,
    width: 18, height: 18, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center',
  },

  submitBtn: {
    backgroundColor: C.btnInactive, borderRadius: 16, height: 56,
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: 10, marginTop: 8,
  },
  submitTxt: { fontSize: 16, fontWeight: '700', color: C.textWhite },
});
