import React, { useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ListRenderItemInfo, Alert,
} from 'react-native';import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Group, GroupsStackParamList } from '../../types';
import {
  fetchGroupsRequest, fetchGroupsRefresh,
  joinGroupRequest, clearJoinError,
  selectAllGroups, selectGroupsLoading, selectGroupsRefreshing,
  selectGroupsError, selectJoiningIds, selectJoinedIds, selectJoinError,
} from '../../store/slices/groupsSlice';
import { RootState } from '../../store';
import { C } from '../../theme';

type Props = NativeStackScreenProps<GroupsStackParamList, 'GroupsMain'>;

// ─── Category helpers ─────────────────────────────────────────────────────────

const CAT_EMOJI: Record<string, string> = {
  Sports: '⚽', Culture: '🎭', Social: '🎉',
  Hobby: '🎨', Community: '🏘️', Other: '📌',
};
const CAT_BG: Record<string, string> = {
  Sports: '#DBEAFE', Culture: '#EDE9FE', Social: '#FCE7F3',
  Hobby: '#D1FAE5', Community: '#FEF3C7', Other: C.bgMuted,
};
const CAT_FG: Record<string, string> = {
  Sports: '#1D4ED8', Culture: '#6D28D9', Social: '#BE185D',
  Hobby: '#065F46', Community: '#92400E', Other: C.textSecondary,
};

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard(): React.JSX.Element {
  return (
    <View style={sk.card}>
      <View style={sk.avatar} />
      <View style={sk.lines}>
        <View style={[sk.line, { width: '60%' }]} />
        <View style={[sk.line, { width: '40%', marginTop: 8 }]} />
      </View>
      <View style={sk.btn} />
    </View>
  );
}

const sk = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.bgCard, borderRadius: 18,
    padding: 16, marginBottom: 12,
  },
  avatar: { width: 52, height: 52, borderRadius: 14, backgroundColor: C.bgMuted, marginRight: 14 },
  lines: { flex: 1 },
  line: { height: 10, backgroundColor: C.bgMuted, borderRadius: 6 },
  btn: { width: 56, height: 34, borderRadius: 10, backgroundColor: C.bgMuted },
});

// ─── Group card ───────────────────────────────────────────────────────────────

interface GroupCardProps {
  item: Group;
  joined: boolean;
  joining: boolean;
  onPress: () => void;
  onJoin: () => void;
}

function GroupCard({ item, joined, joining, onPress, onJoin }: GroupCardProps): React.JSX.Element {
  const cat   = item.category ?? 'Other';
  const emoji = item.emoji ?? CAT_EMOJI[cat] ?? '📌';
  const bg    = CAT_BG[cat]  ?? C.bgMuted;
  const fg    = CAT_FG[cat]  ?? C.textSecondary;

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.85}>
      {/* Emoji box */}
      <View style={[s.emojiBox, { backgroundColor: bg }]}>
        <Text style={s.emojiTxt}>{emoji}</Text>
      </View>

      {/* Info */}
      <View style={s.info}>
        <Text style={s.name} numberOfLines={1}>{item.name}</Text>
        <View style={s.metaRow}>
          <View style={[s.catPill, { backgroundColor: bg }]}>
            <Text style={[s.catPillTxt, { color: fg }]}>{cat}</Text>
          </View>
          <View style={s.memberRow}>
            <Icon name="account-multiple" size={12} color={C.textMuted} />
            <Text style={s.memberTxt}>{item.members} members</Text>
          </View>
        </View>
      </View>

      {/* Join button */}
      <TouchableOpacity
        style={[s.joinBtn, joined && s.joinBtnDone]}
        onPress={onJoin}
        disabled={joining || joined}
        activeOpacity={0.8}>
        <Text style={[s.joinTxt, joined && s.joinTxtDone]}>
          {joining ? '...' : joined ? '✓ Joined' : 'Join'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function GroupsScreen({ navigation }: Props): React.JSX.Element {
  const dispatch    = useDispatch();
  const groups      = useSelector(selectAllGroups);
  const loading     = useSelector(selectGroupsLoading);
  const refreshing  = useSelector(selectGroupsRefreshing);
  const error       = useSelector(selectGroupsError);
  const joiningIds  = useSelector(selectJoiningIds);
  const joinedIds   = useSelector(selectJoinedIds);
  const joinError   = useSelector(selectJoinError);

  useEffect(() => {
    dispatch(fetchGroupsRequest());
  }, [dispatch]);

  useEffect(() => {
    if (!joinError) return;
    Alert.alert('Could not join group', joinError, [
      { text: 'OK', onPress: () => dispatch(clearJoinError()) },
    ]);
  }, [joinError, dispatch]);

  const onRefresh = useCallback(() => {
    dispatch(fetchGroupsRefresh());
  }, [dispatch]);

  const renderItem = ({ item }: ListRenderItemInfo<Group>) => (
    <GroupCard
      item={item}
      joined={joinedIds.includes(item.id)}
      joining={joiningIds.includes(item.id)}
      onPress={() => navigation.navigate('GroupDetail', { group: item })}
      onJoin={() => dispatch(joinGroupRequest(item.id))}
    />
  );

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Community Groups</Text>
          {groups.length > 0 && (
            <Text style={s.headerSub}>{groups.length} groups in your neighbourhood</Text>
          )}
        </View>
        <TouchableOpacity
          style={s.createBtn}
          onPress={() => navigation.navigate('CreateGroup')}>
          <Icon name="plus" size={16} color={C.btnActive} />
          <Text style={s.createBtnTxt}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Error banner */}
      {error && !loading && (
        <View style={s.errorBanner}>
          <Icon name="alert-circle-outline" size={16} color={C.danger} />
          <Text style={s.errorTxt}>{error}</Text>
          <TouchableOpacity onPress={() => dispatch(fetchGroupsRequest())}>
            <Text style={s.retryTxt}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* List */}
      {loading && groups.length === 0 ? (
        // Skeleton while initial load
        <FlatList
          data={[1, 2, 3, 4, 5]}
          keyExtractor={i => String(i)}
          contentContainerStyle={s.list}
          renderItem={() => <SkeletonCard />}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList<Group>
          data={groups}
          keyExtractor={item => item.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={C.btnActive}
              colors={[C.btnActive]}
            />
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyEmoji}>🏘️</Text>
              <Text style={s.emptyTitle}>No groups yet</Text>
              <Text style={s.emptySub}>Be the first to create a community group!</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16,
    backgroundColor: C.btnActive,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: C.textWhite },
  headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.textWhite, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  createBtnTxt: { color: C.btnActive, fontWeight: '700', fontSize: 13 },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.dangerBg, paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: C.danger,
  },
  errorTxt:  { flex: 1, fontSize: 13, color: C.danger },
  retryTxt:  { fontSize: 13, color: C.danger, fontWeight: '700' },

  list: { padding: 16, paddingBottom: 40 },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.bgCard, borderRadius: 18,
    padding: 14, marginBottom: 12,
    shadowColor: C.shadow, shadowOpacity: 0.08,
    shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  emojiBox: {
    width: 52, height: 52, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  emojiTxt: { fontSize: 26 },
  info:     { flex: 1, marginRight: 8 },
  name:     { fontSize: 15, fontWeight: '700', color: C.textPrimary, marginBottom: 6 },
  metaRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  catPill:  { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  catPillTxt: { fontSize: 10, fontWeight: '700' },
  memberRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  memberTxt:  { fontSize: 11, color: C.textMuted },

  joinBtn: {
    backgroundColor: C.bgMuted, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: C.btnActive,
  },
  joinBtnDone: { backgroundColor: C.successBg, borderColor: C.success },
  joinTxt:     { fontSize: 12, color: C.btnActive, fontWeight: '700' },
  joinTxtDone: { color: C.success },

  empty:      { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.textPrimary },
  emptySub:   { fontSize: 13, color: C.textMuted, textAlign: 'center', paddingHorizontal: 32 },
});
