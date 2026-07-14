import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Share,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSelector, useDispatch } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootState } from '../../store';
import { ActivitiesStackParamList } from '../../types';
import {
  selectActivityById, joinActivity, leaveActivity,
  selectIsJoined, selectIsCreated,
} from '../../store/slices/activitiesSlice';
import { addNotification } from '../../store/slices/notificationsSlice';

type Props = NativeStackScreenProps<ActivitiesStackParamList, 'ActivityDetail'>;

export default function ActivityDetailScreen({ route, navigation }: Props): React.JSX.Element {
  const { activityId } = route.params;
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const activity = useSelector(selectActivityById(activityId));
  const isJoined = useSelector(selectIsJoined(activityId));
  const isCreated = useSelector(selectIsCreated(activityId));
  const [bookmarked, setBookmarked] = useState(false);

  if (!activity) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>Activity not found</Text>
      </SafeAreaView>
    );
  }

  const remaining = activity.maxParticipants - activity.participants.length;
  const isFull = remaining <= 0;

  const handleJoin = () => {
    if (!user) return;
    dispatch(joinActivity({ activityId, userName: user.name }));
    dispatch(addNotification({
      id: Date.now().toString(), type: 'activity_joined',
      title: `You joined ${activity.title}`,
      body: `See you at ${activity.location} on ${activity.date} at ${activity.time}`,
      timestamp: new Date().toISOString(), read: false, activityId,
    }));
  };

  const handleLeave = () => {
    Alert.alert('Leave Activity', 'Are you sure you want to leave?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: () => user && dispatch(leaveActivity({ activityId, userName: user.name })) },
    ]);
  };

  const handleShare = async () => {
    await Share.share({ message: `Join me for ${activity.title} on ${activity.date} at ${activity.time}! 📍 ${activity.location}` });
  };

  const handleReport = () => {
    Alert.alert('Report Activity', 'Thank you for your report. We will review it shortly.');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.heroActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setBookmarked(b => !b)}>
              <Text style={styles.iconBtnText}>{bookmarked ? '🔖' : '🏷️'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
              <Text style={styles.iconBtnText}>↗️</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={handleReport}>
              <Text style={styles.iconBtnText}>⚑</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.heroContent}>
            <Text style={styles.heroEmoji}>{activity.emoji}</Text>
            <View style={styles.heroCategoryBadge}>
              <Text style={styles.heroCategoryText}>{activity.category}</Text>
            </View>
            <Text style={styles.heroTitle}>{activity.title}</Text>
            {activity.weather && <Text style={styles.heroWeather}>{activity.weather}</Text>}
          </View>
        </View>

        <View style={styles.body}>
          {/* Quick Info */}
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}><Text style={styles.infoIcon}>📅</Text><Text style={styles.infoVal}>{activity.date}</Text><Text style={styles.infoLbl}>Date</Text></View>
            <View style={styles.infoItem}><Text style={styles.infoIcon}>🕐</Text><Text style={styles.infoVal}>{activity.time}</Text><Text style={styles.infoLbl}>Time</Text></View>
            <View style={styles.infoItem}><Text style={styles.infoIcon}>⏱</Text><Text style={styles.infoVal}>{activity.duration}</Text><Text style={styles.infoLbl}>Duration</Text></View>
            <View style={styles.infoItem}><Text style={styles.infoIcon}>👁</Text><Text style={styles.infoVal}>{activity.visibility}</Text><Text style={styles.infoLbl}>Visibility</Text></View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{activity.description}</Text>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.locationRow}>
              <Text style={styles.locationText}>📍 {activity.location}</Text>
              {activity.distance && <Text style={styles.distanceBadge}>{activity.distance}</Text>}
            </View>
            {/* Map Preview Placeholder */}
            <View style={styles.mapPreview}>
              <Text style={styles.mapEmoji}>🗺️</Text>
              <Text style={styles.mapText}>Map Preview</Text>
              <Text style={styles.mapSub}>{activity.location}</Text>
            </View>
          </View>

          {/* Organizer */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Organizer</Text>
            <View style={styles.organizerRow}>
              <View style={styles.organizerAvatar}>
                <Text style={styles.organizerAvatarText}>{activity.host[0]}</Text>
              </View>
              <View>
                <Text style={styles.organizerName}>{activity.host}</Text>
                <Text style={styles.organizerRole}>Activity Host</Text>
              </View>
              {isCreated && <View style={styles.youBadge}><Text style={styles.youBadgeText}>You</Text></View>}
            </View>
          </View>

          {/* Participants */}
          <View style={styles.section}>
            <View style={styles.participantsHeader}>
              <Text style={styles.sectionTitle}>Participants</Text>
              <Text style={styles.participantCount}>
                {activity.participants.length}/{activity.maxParticipants}
              </Text>
            </View>
            <View style={styles.participantsRow}>
              {activity.participants.slice(0, 6).map((p, i) => (
                <View key={p} style={[styles.participantAvatar, { marginLeft: i > 0 ? -8 : 0 }]}>
                  <Text style={styles.participantAvatarText}>{p[0]}</Text>
                </View>
              ))}
              {activity.participants.length > 6 && (
                <View style={[styles.participantAvatar, { marginLeft: -8, backgroundColor: '#374151' }]}>
                  <Text style={styles.participantAvatarText}>+{activity.participants.length - 6}</Text>
                </View>
              )}
            </View>
            <View style={styles.slotsBar}>
              <View style={[styles.slotsBarFill, { width: `${(activity.participants.length / activity.maxParticipants) * 100}%` as any }]} />
            </View>
            <Text style={styles.slotsText}>
              {remaining > 0 ? `${remaining} slots remaining` : 'Activity is full'}
            </Text>
          </View>

          {/* Rules */}
          {activity.rules && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Rules & Guidelines</Text>
              <View style={styles.rulesCard}>
                <Text style={styles.rulesText}>{activity.rules}</Text>
              </View>
            </View>
          )}

          {/* Chat Button */}
          <TouchableOpacity
            style={styles.chatBtn}
            onPress={() => navigation.navigate('ActivityChat', { activityId, activityTitle: activity.title })}>
            <Text style={styles.chatBtnText}>💬 Open Activity Chat</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        {isJoined ? (
          <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave}>
            <Text style={styles.leaveBtnText}>Leave Activity</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.joinBtn, isFull && styles.joinBtnDisabled]}
            onPress={handleJoin}
            disabled={isFull}>
            <Text style={styles.joinBtnText}>{isFull ? 'Activity Full' : 'Join Activity →'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  notFound: { color: '#fff', textAlign: 'center', marginTop: 40, fontSize: 16 },

  hero: { backgroundColor: '#0F172A', paddingTop: 56, paddingBottom: 28, paddingHorizontal: 20, position: 'relative' },
  backBtn: { position: 'absolute', top: 16, left: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  backIcon: { fontSize: 18, color: '#fff' },
  heroActions: { position: 'absolute', top: 16, right: 16, flexDirection: 'row', gap: 8, zIndex: 10 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center' },
  iconBtnText: { fontSize: 16 },
  heroContent: { alignItems: 'center', marginTop: 8 },
  heroEmoji: { fontSize: 64, marginBottom: 12 },
  heroCategoryBadge: { backgroundColor: '#1E3A8A', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 10 },
  heroCategoryText: { fontSize: 12, color: '#93C5FD', fontWeight: '600' },
  heroTitle: { fontSize: 22, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 8 },
  heroWeather: { fontSize: 14, color: '#94A3B8' },

  body: { padding: 20 },

  infoGrid: { flexDirection: 'row', backgroundColor: '#111', borderRadius: 16, padding: 16, marginBottom: 20, justifyContent: 'space-between' },
  infoItem: { alignItems: 'center', flex: 1 },
  infoIcon: { fontSize: 18, marginBottom: 4 },
  infoVal: { fontSize: 12, fontWeight: '700', color: '#fff', textAlign: 'center' },
  infoLbl: { fontSize: 10, color: '#6B7280', marginTop: 2 },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 10 },
  description: { fontSize: 14, color: '#9CA3AF', lineHeight: 22 },

  locationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  locationText: { fontSize: 14, color: '#D1D5DB', flex: 1 },
  distanceBadge: { backgroundColor: '#1E3A8A', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, fontSize: 12, color: '#93C5FD', fontWeight: '600' },
  mapPreview: { backgroundColor: '#111', borderRadius: 16, height: 140, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#1F2937' },
  mapEmoji: { fontSize: 36, marginBottom: 8 },
  mapText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  mapSub: { fontSize: 12, color: '#4B5563', marginTop: 4 },

  organizerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  organizerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center' },
  organizerAvatarText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  organizerName: { fontSize: 15, fontWeight: '600', color: '#fff' },
  organizerRole: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  youBadge: { marginLeft: 'auto' as any, backgroundColor: '#1E3A8A', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  youBadgeText: { fontSize: 11, color: '#93C5FD', fontWeight: '600' },

  participantsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  participantCount: { fontSize: 13, color: '#6B7280' },
  participantsRow: { flexDirection: 'row', marginBottom: 12 },
  participantAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#000' },
  participantAvatarText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  slotsBar: { height: 6, backgroundColor: '#1F2937', borderRadius: 3, marginBottom: 6, overflow: 'hidden' },
  slotsBarFill: { height: '100%', backgroundColor: '#2563EB', borderRadius: 3 },
  slotsText: { fontSize: 12, color: '#6B7280' },

  rulesCard: { backgroundColor: '#111', borderRadius: 14, padding: 14, borderLeftWidth: 3, borderLeftColor: '#2563EB' },
  rulesText: { fontSize: 13, color: '#9CA3AF', lineHeight: 20 },

  chatBtn: { backgroundColor: '#111', borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 80, borderWidth: 1, borderColor: '#1F2937' },
  chatBtnText: { fontSize: 14, color: '#93C5FD', fontWeight: '600' },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#000', borderTopWidth: 1, borderTopColor: '#111' },
  joinBtn: { backgroundColor: '#2563EB', borderRadius: 16, height: 56, justifyContent: 'center', alignItems: 'center' },
  joinBtnDisabled: { backgroundColor: '#1F2937' },
  joinBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  leaveBtn: { backgroundColor: '#1A0A0A', borderRadius: 16, height: 56, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#EF4444' },
  leaveBtnText: { fontSize: 16, fontWeight: '700', color: '#EF4444' },
});
