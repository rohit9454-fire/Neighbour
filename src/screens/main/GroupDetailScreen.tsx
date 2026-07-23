import React, { useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GroupsStackParamList } from '../../types';
import {
  joinGroupRequest, clearJoinError,
  selectJoiningIds, selectJoinedIds, selectJoinError,
} from '../../store/slices/groupsSlice';
import { RootState } from '../../store';
import { C } from '../../theme';

type Props = NativeStackScreenProps<GroupsStackParamList, 'GroupDetail'>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function fmtDate(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch { return iso; }
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function GroupDetailScreen({ route, navigation }: Props): React.JSX.Element {
  const dispatch   = useDispatch();
  const { group }  = route.params;

  // Always read the live version from the store so member count stays in sync
  const live = useSelector((state: RootState) =>
    state.groups.groups.find(g => g.id === group.id),
  ) ?? group;

  const joiningIds = useSelector(selectJoiningIds);
  const joinedIds  = useSelector(selectJoinedIds);
  const joinError  = useSelector(selectJoinError);
  const isJoining  = joiningIds.includes(live.id);
  const isJoined   = joinedIds.includes(live.id);

  const cat   = live.category ?? 'Other';
  const emoji = live.emoji ?? CAT_EMOJI[cat] ?? '📌';
  const bg    = CAT_BG[cat]  ?? C.bgMuted;
  const fg    = CAT_FG[cat]  ?? C.textSecondary;

  useEffect(() => {
    if (!joinError) return;
    Alert.alert('Could not join group', joinError, [
      { text: 'OK', onPress: () => dispatch(clearJoinError()) },
    ]);
  }, [joinError, dispatch]);

  return (
    <SafeAreaView style={s.root} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <View style={s.hero}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={20} color={C.textWhite} />
          </TouchableOpacity>

          <View style={[s.emojiBox, { backgroundColor: bg }]}>
            <Text style={s.heroEmoji}>{emoji}</Text>
          </View>

          <View style={[s.catBadge, { backgroundColor: bg }]}>
            <Text style={[s.catTxt, { color: fg }]}>{cat}</Text>
          </View>

          <Text style={s.heroTitle}>{live.name}</Text>
        </View>

        {/* ── Stats row ─────────────────────────────────────────────────── */}
        <View style={s.body}>
          <View style={s.statsRow}>
            <View style={s.statCard}>
              <Icon name="account-multiple" size={24} color={C.btnInactive} />
              <Text style={s.statNum}>{live.members}</Text>
              <Text style={s.statLbl}>Members</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statCard}>
              <Icon name="tag-outline" size={24} color={C.btnInactive} />
              <Text style={s.statNum}>{cat}</Text>
              <Text style={s.statLbl}>Category</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statCard}>
              <Icon name="calendar-plus" size={24} color={C.btnInactive} />
              <Text style={s.statNum}>{fmtDate(live.createdAt).split(' ')[2] ?? '—'}</Text>
              <Text style={s.statLbl}>Since</Text>
            </View>
          </View>

          {/* ── About ─────────────────────────────────────────────────── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>About</Text>
            <Text style={s.desc}>
              {live.description?.trim()
                ? live.description
                : `A vibrant community group for neighbours who share a passion for ${cat.toLowerCase()}. Join us to connect, plan events, and make great memories together!`}
            </Text>
          </View>

          {/* ── Details ───────────────────────────────────────────────── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Details</Text>
            <View style={s.detailCard}>
              <View style={s.detailRow}>
                <Icon name="calendar-outline" size={16} color={C.btnInactive} style={s.detailIcon} />
                <Text style={s.detailLbl}>Created</Text>
                <Text style={s.detailVal}>{fmtDate(live.createdAt)}</Text>
              </View>
              <View style={s.detailDivider} />
              <View style={s.detailRow}>
                <Icon name="account-multiple-outline" size={16} color={C.btnInactive} style={s.detailIcon} />
                <Text style={s.detailLbl}>Members</Text>
                <Text style={s.detailVal}>{live.members} people</Text>
              </View>
              <View style={s.detailDivider} />
              <View style={s.detailRow}>
                <Icon name="earth" size={16} color={C.btnInactive} style={s.detailIcon} />
                <Text style={s.detailLbl}>Visibility</Text>
                <Text style={s.detailVal}>Public</Text>
              </View>
            </View>
          </View>

          {/* ── Upcoming events placeholder ────────────────────────────── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Upcoming Events</Text>
            <View style={s.placeholderCard}>
              <Icon name="calendar-clock" size={32} color={C.textMuted} />
              <Text style={s.placeholderTxt}>No events scheduled yet</Text>
              <Text style={s.placeholderSub}>Events created by this group will appear here</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── Bottom join bar ───────────────────────────────────────────────── */}
      <View style={s.bar}>
        <View style={s.memberCount}>
          <Text style={s.memberNum}>{live.members}</Text>
          <Text style={s.memberLbl}>members</Text>
        </View>
        <TouchableOpacity
          style={[s.joinBtn, isJoined && s.joinBtnDone, isJoining && s.joinBtnLoading]}
          onPress={() => !isJoined && dispatch(joinGroupRequest(live.id))}
          disabled={isJoining || isJoined}
          activeOpacity={0.85}>
          {isJoining ? (
            <ActivityIndicator size="small" color={C.textWhite} />
          ) : (
            <>
              <Icon
                name={isJoined ? 'check-circle' : 'account-plus'}
                size={18} color={C.textWhite}
                style={{ marginRight: 8 }}
              />
              <Text style={s.joinTxt}>
                {isJoined ? 'Joined ✓' : 'Join Group'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  hero: {
    backgroundColor: C.btnActive,
    paddingTop: 60, paddingBottom: 32, paddingHorizontal: 20,
    alignItems: 'center',
  },
  backBtn: {
    position: 'absolute', top: 52, left: 16,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  emojiBox: {
    width: 80, height: 80, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  heroEmoji:  { fontSize: 40 },
  catBadge:   { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 10 },
  catTxt:     { fontSize: 12, fontWeight: '700' },
  heroTitle:  { fontSize: 24, fontWeight: '800', color: C.textWhite, textAlign: 'center' },

  body: { padding: 20 },

  statsRow: {
    flexDirection: 'row', backgroundColor: C.bgCard, borderRadius: 18,
    padding: 16, marginBottom: 24,
    shadowColor: C.shadow, shadowOpacity: 0.08,
    shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  statCard:    { flex: 1, alignItems: 'center', gap: 6 },
  statDivider: { width: 1, backgroundColor: C.divider, marginVertical: 4 },
  statNum:     { fontSize: 13, fontWeight: '700', color: C.textPrimary, textAlign: 'center' },
  statLbl:     { fontSize: 10, color: C.textMuted },

  section:      { marginBottom: 24 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.textPrimary, marginBottom: 10 },
  desc:         { fontSize: 14, color: C.textSecondary, lineHeight: 22 },

  detailCard: {
    backgroundColor: C.bgCard, borderRadius: 16,
    borderWidth: 1, borderColor: C.border,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  detailIcon: { marginRight: 12 },
  detailLbl:  { flex: 1, fontSize: 13, color: C.textSecondary },
  detailVal:  { fontSize: 13, fontWeight: '600', color: C.textPrimary },
  detailDivider: { height: 1, backgroundColor: C.divider, marginHorizontal: 16 },

  placeholderCard: {
    backgroundColor: C.bgCard, borderRadius: 16, height: 120,
    justifyContent: 'center', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: C.border,
  },
  placeholderTxt: { fontSize: 13, fontWeight: '600', color: C.textSecondary },
  placeholderSub: { fontSize: 11, color: C.textMuted, textAlign: 'center', paddingHorizontal: 24 },

  bar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: C.bgCard,
    borderTopWidth: 1, borderTopColor: C.divider, gap: 14,
  },
  memberCount: { alignItems: 'center', minWidth: 48 },
  memberNum:   { fontSize: 20, fontWeight: '800', color: C.textPrimary },
  memberLbl:   { fontSize: 10, color: C.textMuted },
  joinBtn: {
    flex: 1, backgroundColor: C.btnInactive, borderRadius: 14, height: 50,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
  },
  joinBtnDone:    { backgroundColor: C.success },
  joinBtnLoading: { opacity: 0.6 },
  joinTxt:        { fontSize: 15, fontWeight: '700', color: C.textWhite },
});
