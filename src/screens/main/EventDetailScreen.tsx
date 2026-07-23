import React, { useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Share,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HomeStackParamList } from '../../types';
import {
  markGoingRequest, clearGoingError, selectGoingIds,
} from '../../store/slices/eventsSlice';
import { RootState } from '../../store';
import { C } from '../../theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'EventDetail'>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CAT_BG:   Record<string, string> = {
  Sports: '#DBEAFE', Culture: '#EDE9FE', Social: '#FCE7F3', Hobby: '#D1FAE5', Other: C.bgMuted,
};
const CAT_FG:   Record<string, string> = {
  Sports: '#1D4ED8', Culture: '#6D28D9', Social: '#BE185D', Hobby: '#065F46', Other: C.textSecondary,
};
const CAT_EMOJI: Record<string, string> = {
  Sports: '⚽', Culture: '🎭', Social: '🎉', Hobby: '🎨', Other: '📌',
};

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long',
      year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function EventDetailScreen({ route, navigation }: Props): React.JSX.Element {
  const dispatch    = useDispatch();
  const { event }   = route.params;
  const goingIds   = useSelector(selectGoingIds);
  const goingError = useSelector((s: RootState) => s.events.rsvpError);
  const isMarking  = goingIds.includes(event.id);

  // Always read from the store so going count stays live after RSVP
  const live = useSelector((s: RootState) =>
    s.events.events.find(e => e.id === event.id),
  ) ?? event;

  const cat     = live.category ?? 'Other';
  const emoji   = live.emoji ?? CAT_EMOJI[cat];
  const catBg   = CAT_BG[cat]  ?? C.bgMuted;
  const catFg   = CAT_FG[cat]  ?? C.textSecondary;

  useEffect(() => {
    if (!goingError) return;
    Alert.alert('Could not mark as going', goingError, [
      { text: 'OK', onPress: () => dispatch(clearGoingError()) },
    ]);
  }, [goingError, dispatch]);

  const handleShare = async () => {
    await Share.share({
      message: `${live.title}\n📅 ${fmtDate(live.date)}\n📍 ${live.location}`,
    });
  };

  return (
    <SafeAreaView style={s.root} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <View style={s.hero}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={20} color={C.textWhite} />
          </TouchableOpacity>
          <TouchableOpacity style={s.shareBtn} onPress={handleShare}>
            <Icon name="share-variant" size={18} color={C.textWhite} />
          </TouchableOpacity>

          <Text style={s.heroEmoji}>{emoji}</Text>
          <View style={[s.catBadge, { backgroundColor: catBg }]}>
            <Text style={[s.catText, { color: catFg }]}>{cat}</Text>
          </View>
          <Text style={s.heroTitle}>{live.title}</Text>
        </View>

        {/* ── Info cards ───────────────────────────────────────────────────── */}
        <View style={s.body}>
          <View style={s.infoGrid}>
            <View style={s.infoItem}>
              <Icon name="calendar-clock" size={22} color={C.btnInactive} />
              <Text style={s.infoVal}>{fmtDate(live.date)}</Text>
              <Text style={s.infoLbl}>Date & Time</Text>
            </View>
            <View style={s.infoSep} />
            <View style={s.infoItem}>
              <Icon name="map-marker" size={22} color={C.btnInactive} />
              <Text style={s.infoVal} numberOfLines={2}>{live.location}</Text>
              <Text style={s.infoLbl}>Location</Text>
            </View>
            <View style={s.infoSep} />
            <View style={s.infoItem}>
              <Icon name="account-group" size={22} color={C.btnInactive} />
              <Text style={s.infoVal}>{live.going}</Text>
              <Text style={s.infoLbl}>Going</Text>
            </View>
          </View>

          {/* About */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>About</Text>
            <Text style={s.desc}>
              {live.description?.trim()
                ? live.description
                : "Join your neighbours for a fun community event. Everyone is welcome — bring your energy and let's make great memories together!"}
            </Text>
          </View>

          {/* Organiser */}
          {live.hostName ? (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Organiser</Text>
              <View style={s.hostRow}>
                <View style={s.hostAvatar}>
                  <Text style={s.hostAvatarTxt}>{live.hostName[0].toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={s.hostName}>{live.hostName}</Text>
                  <Text style={s.hostRole}>Event Host</Text>
                </View>
              </View>
            </View>
          ) : null}

          {/* Map placeholder */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Location</Text>
            <View style={s.mapCard}>
              <Icon name="map-outline" size={36} color={C.textMuted} />
              <Text style={s.mapLoc}>{live.location}</Text>
              <Text style={s.mapSub}>Map coming soon</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── Bottom RSVP bar ──────────────────────────────────────────────────── */}
      <View style={s.bar}>
        <View style={s.goingWrap}>
          <Text style={s.goingNum}>{live.going}</Text>
          <Text style={s.goingLbl}>going</Text>
        </View>
        <TouchableOpacity
          style={[s.rsvpBtn, live.isGoing && s.rsvpBtnActive, isMarking && s.rsvpBtnDisabled]}
          onPress={() => dispatch(markGoingRequest(live.id))}
          disabled={isMarking}
          activeOpacity={0.85}>
          {isMarking ? (
            <ActivityIndicator size="small" color={C.textWhite} />
          ) : (
            <>
              <Icon
                name={live.isGoing ? 'check-circle' : 'calendar-plus'}
                size={18} color={C.textWhite}
                style={{ marginRight: 8 }}
              />
              <Text style={s.rsvpTxt}>
                {live.isGoing ? "You're Going ✓" : "I'm Going"}
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
  shareBtn: {
    position: 'absolute', top: 52, right: 16,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  heroEmoji: { fontSize: 72, marginBottom: 12, marginTop: 8 },
  catBadge: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 10 },
  catText: { fontSize: 12, fontWeight: '700' },
  heroTitle: { fontSize: 22, fontWeight: '800', color: C.textWhite, textAlign: 'center', lineHeight: 28 },

  body: { padding: 20 },

  infoGrid: {
    flexDirection: 'row', backgroundColor: C.bgCard, borderRadius: 18,
    padding: 16, marginBottom: 24,
    shadowColor: C.shadow, shadowOpacity: 0.08, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  infoItem: { flex: 1, alignItems: 'center', gap: 6 },
  infoVal: { fontSize: 12, fontWeight: '700', color: C.textPrimary, textAlign: 'center' },
  infoLbl: { fontSize: 10, color: C.textMuted },
  infoSep: { width: 1, backgroundColor: C.divider, marginVertical: 4 },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.textPrimary, marginBottom: 10 },
  desc: { fontSize: 14, color: C.textSecondary, lineHeight: 22 },

  hostRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hostAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.btnInactive, justifyContent: 'center', alignItems: 'center',
  },
  hostAvatarTxt: { fontSize: 18, fontWeight: '700', color: C.textWhite },
  hostName: { fontSize: 15, fontWeight: '600', color: C.textPrimary },
  hostRole: { fontSize: 12, color: C.textMuted, marginTop: 2 },

  mapCard: {
    backgroundColor: C.bgCard, borderRadius: 16, height: 120,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: C.border, gap: 6,
  },
  mapLoc: { fontSize: 13, fontWeight: '600', color: C.textSecondary },
  mapSub: { fontSize: 11, color: C.textMuted },

  bar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: C.bgCard, borderTopWidth: 1, borderTopColor: C.divider, gap: 14,
  },
  goingWrap: { alignItems: 'center', minWidth: 44 },
  goingNum: { fontSize: 20, fontWeight: '800', color: C.textPrimary },
  goingLbl: { fontSize: 10, color: C.textMuted },
  rsvpBtn: {
    flex: 1, backgroundColor: C.btnInactive, borderRadius: 14, height: 50,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
  },
  rsvpBtnActive:   { backgroundColor: C.success },
  rsvpBtnDisabled: { opacity: 0.6 },
  rsvpTxt: { fontSize: 15, fontWeight: '700', color: C.textWhite },
});
