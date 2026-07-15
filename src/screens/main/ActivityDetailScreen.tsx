import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Share } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSelector, useDispatch } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootState } from '../../store';
import { ActivitiesStackParamList } from '../../types';
import { selectActivityById, joinActivity, leaveActivity, selectIsJoined, selectIsCreated } from '../../store/slices/activitiesSlice';
import { addNotification } from '../../store/slices/notificationsSlice';
import { C } from '../../theme';

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
    return <SafeAreaView style={styles.container}><Text style={styles.notFound}>Activity not found</Text></SafeAreaView>;
  }

  const remaining = activity.maxParticipants - activity.participants.length;
  const isFull = remaining <= 0;
  const sanitize = (s: string) => s.replace(/[\r\n<>"'`]/g, ' ').trim();

  const handleJoin = () => {
    if (!user) return;
    dispatch(joinActivity({ activityId, userName: user.name }));
    dispatch(addNotification({
      id: Date.now().toString(), type: 'activity_joined',
      title: `You joined ${sanitize(activity.title)}`,
      body: `See you at ${sanitize(activity.location)} on ${activity.date} at ${activity.time}`,
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
    await Share.share({ message: `Join me for ${sanitize(activity.title)} on ${activity.date} at ${activity.time}! 📍 ${sanitize(activity.location)}` });
  };

  const handleReport = () => Alert.alert('Report Activity', 'Thank you for your report. We will review it shortly.');

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={20} color={C.textWhite} />
          </TouchableOpacity>
          <View style={styles.heroActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setBookmarked(b => !b)}>
              <Icon name={bookmarked ? 'bookmark' : 'bookmark-outline'} size={18} color={C.textWhite} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
              <Icon name="share-variant" size={18} color={C.textWhite} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={handleReport}>
              <Icon name="flag-outline" size={18} color={C.textWhite} />
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
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}><Icon name="calendar" size={20} color={C.btnInactive} /><Text style={styles.infoVal}>{activity.date}</Text><Text style={styles.infoLbl}>Date</Text></View>
            <View style={styles.infoItem}><Icon name="clock-outline" size={20} color={C.btnInactive} /><Text style={styles.infoVal}>{activity.time}</Text><Text style={styles.infoLbl}>Time</Text></View>
            <View style={styles.infoItem}><Icon name="timer-outline" size={20} color={C.btnInactive} /><Text style={styles.infoVal}>{activity.duration}</Text><Text style={styles.infoLbl}>Duration</Text></View>
            <View style={styles.infoItem}><Icon name="eye-outline" size={20} color={C.btnInactive} /><Text style={styles.infoVal}>{activity.visibility}</Text><Text style={styles.infoLbl}>Visibility</Text></View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{activity.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.locationRow}>
              <Icon name="map-marker" size={16} color={C.btnInactive} style={{ marginRight: 6 }} />
              <Text style={styles.locationText}>{activity.location}</Text>
              {activity.distance && <Text style={styles.distanceBadge}>{activity.distance}</Text>}
            </View>
            <View style={styles.mapPreview}>
              <Icon name="map" size={36} color={C.textMuted} />
              <Text style={styles.mapText}>Map Preview</Text>
              <Text style={styles.mapSub}>{activity.location}</Text>
            </View>
          </View>

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

          <View style={styles.section}>
            <View style={styles.participantsHeader}>
              <Text style={styles.sectionTitle}>Participants</Text>
              <Text style={styles.participantCount}>{activity.participants.length}/{activity.maxParticipants}</Text>
            </View>
            <View style={styles.participantsRow}>
              {activity.participants.slice(0, 6).map((p, i) => (
                <View key={p} style={[styles.participantAvatar, { marginLeft: i > 0 ? -8 : 0 }]}>
                  <Text style={styles.participantAvatarText}>{p[0]}</Text>
                </View>
              ))}
              {activity.participants.length > 6 && (
                <View style={[styles.participantAvatar, { marginLeft: -8, backgroundColor: C.bgMuted }]}>
                  <Text style={[styles.participantAvatarText, { color: C.textSecondary }]}>+{activity.participants.length - 6}</Text>
                </View>
              )}
            </View>
            <View style={styles.slotsBar}>
              <View style={[styles.slotsBarFill, { width: `${(activity.participants.length / activity.maxParticipants) * 100}%` as any }]} />
            </View>
            <Text style={styles.slotsText}>{remaining > 0 ? `${remaining} slots remaining` : 'Activity is full'}</Text>
          </View>

          {activity.rules && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Rules & Guidelines</Text>
              <View style={styles.rulesCard}>
                <Text style={styles.rulesText}>{activity.rules}</Text>
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.chatBtn}
            onPress={() => navigation.navigate('ActivityChat', { activityId, activityTitle: activity.title })}>
            <Icon name="chat" size={18} color={C.btnActive} style={{ marginRight: 8 }} />
            <Text style={styles.chatBtnText}>Open Activity Chat</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        {isJoined ? (
          <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave}>
            <Text style={styles.leaveBtnText}>Leave Activity</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.joinBtn, isFull && styles.joinBtnDisabled]} onPress={handleJoin} disabled={isFull}>
            <Text style={styles.joinBtnText}>{isFull ? 'Activity Full' : 'Join Activity →'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  notFound: { color: C.textPrimary, textAlign: 'center', marginTop: 40, fontSize: 16 },

  hero: { backgroundColor: C.btnActive, paddingTop: 56, paddingBottom: 28, paddingHorizontal: 20, position: 'relative' },
  backBtn: { position: 'absolute', top: 16, left: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  heroActions: { position: 'absolute', top: 16, right: 16, flexDirection: 'row', gap: 8, zIndex: 10 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  heroContent: { alignItems: 'center', marginTop: 8 },
  heroEmoji: { fontSize: 64, marginBottom: 12 },
  heroCategoryBadge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 10 },
  heroCategoryText: { fontSize: 12, color: C.textWhite, fontWeight: '600' },
  heroTitle: { fontSize: 22, fontWeight: '700', color: C.textWhite, textAlign: 'center', marginBottom: 8 },
  heroWeather: { fontSize: 14, color: 'rgba(255,255,255,0.75)' },

  body: { padding: 20 },
  infoGrid: { flexDirection: 'row', backgroundColor: C.bgCard, borderRadius: 16, padding: 16, marginBottom: 20, justifyContent: 'space-between', shadowColor: C.shadow, shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  infoItem: { alignItems: 'center', flex: 1 },
  infoVal: { fontSize: 12, fontWeight: '700', color: C.textPrimary, textAlign: 'center', marginTop: 4 },
  infoLbl: { fontSize: 10, color: C.textMuted, marginTop: 2 },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.textPrimary, marginBottom: 10 },
  description: { fontSize: 14, color: C.textSecondary, lineHeight: 22 },

  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  locationText: { fontSize: 14, color: C.textSecondary, flex: 1 },
  distanceBadge: { backgroundColor: C.bgMuted, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, fontSize: 12, color: C.btnActive, fontWeight: '600' },
  mapPreview: { backgroundColor: C.bgCard, borderRadius: 16, height: 140, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: C.border },
  mapText: { fontSize: 14, fontWeight: '600', color: C.textMuted, marginTop: 8 },
  mapSub: { fontSize: 12, color: C.textMuted, marginTop: 4 },

  organizerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  organizerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.btnInactive, justifyContent: 'center', alignItems: 'center' },
  organizerAvatarText: { fontSize: 18, fontWeight: '700', color: C.textWhite },
  organizerName: { fontSize: 15, fontWeight: '600', color: C.textPrimary },
  organizerRole: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  youBadge: { marginLeft: 'auto' as any, backgroundColor: C.bgMuted, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  youBadgeText: { fontSize: 11, color: C.btnActive, fontWeight: '600' },

  participantsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  participantCount: { fontSize: 13, color: C.textMuted },
  participantsRow: { flexDirection: 'row', marginBottom: 12 },
  participantAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.btnInactive, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: C.bg },
  participantAvatarText: { fontSize: 12, fontWeight: '700', color: C.textWhite },
  slotsBar: { height: 6, backgroundColor: C.bgMuted, borderRadius: 3, marginBottom: 6, overflow: 'hidden' },
  slotsBarFill: { height: '100%', backgroundColor: C.btnInactive, borderRadius: 3 },
  slotsText: { fontSize: 12, color: C.textMuted },

  rulesCard: { backgroundColor: C.bgCard, borderRadius: 14, padding: 14, borderLeftWidth: 3, borderLeftColor: C.btnInactive },
  rulesText: { fontSize: 13, color: C.textSecondary, lineHeight: 20 },

  chatBtn: { backgroundColor: C.bgMuted, borderRadius: 14, padding: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 80, borderWidth: 1, borderColor: C.border },
  chatBtnText: { fontSize: 14, color: C.btnActive, fontWeight: '600' },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.border },
  joinBtn: { backgroundColor: C.btnInactive, borderRadius: 16, height: 56, justifyContent: 'center', alignItems: 'center' },
  joinBtnDisabled: { backgroundColor: C.bgMuted },
  joinBtnText: { fontSize: 16, fontWeight: '700', color: C.textWhite },
  leaveBtn: { backgroundColor: C.dangerBg, borderRadius: 16, height: 56, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: C.danger },
  leaveBtnText: { fontSize: 16, fontWeight: '700', color: C.danger },
});
