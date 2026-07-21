import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Share } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSelector, useDispatch } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootState } from '../../store';
import { ActivitiesStackParamList } from '../../types';
import {
  clearJoinActivityState,
  clearLeaveActivityState,
  clearDeleteActivityState,
  deleteActivityRequest,
  joinActivityRequest,
  leaveActivityRequest,
  selectActivityById,
  selectIsCreated,
  selectIsJoined,
} from '../../store/slices/activitiesSlice';
import { addNotification } from '../../store/slices/notificationsSlice';
import { C } from '../../theme';

type Props = NativeStackScreenProps<ActivitiesStackParamList, 'ActivityDetail'>;

export default function ActivityDetailScreen({ route, navigation }: Props): React.JSX.Element {
  const { activityId } = route.params;
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const activity = useSelector(selectActivityById(activityId));
  const joinedLocally = useSelector(selectIsJoined(activityId));
  const isCreated = useSelector(selectIsCreated(activityId));
  const {
    joiningIds, joinError, lastJoinedId, leavingIds, leaveError,
    isDeleting, deleteError, lastDeletedId,
  } = useSelector(
    (state: RootState) => state.activities,
  );
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    if (lastJoinedId !== activityId || !activity || !user) return;

    dispatch(addNotification({
      id: Date.now().toString(), type: 'activity_joined',
      title: `You joined ${activity.title}`,
      body: `See you at ${activity.location} on ${activity.date} at ${activity.time}`,
      timestamp: new Date().toISOString(), read: false, activityId,
    }));
    dispatch(clearJoinActivityState());
  }, [activity, activityId, dispatch, lastJoinedId, user]);

  useEffect(() => {
    if (lastDeletedId !== activityId) return;

    dispatch(clearDeleteActivityState());
    navigation.goBack();
  }, [activityId, dispatch, lastDeletedId, navigation]);

  useEffect(() => {
    if (!deleteError) return;

    Alert.alert('Could not delete activity', deleteError, [
      { text: 'OK', onPress: () => dispatch(clearDeleteActivityState()) },
    ]);
  }, [deleteError, dispatch]);

  useEffect(() => {
    if (!leaveError) return;

    Alert.alert('Could not leave activity', leaveError, [
      { text: 'OK', onPress: () => dispatch(clearLeaveActivityState()) },
    ]);
  }, [dispatch, leaveError]);

  if (!activity) {
    return <SafeAreaView style={styles.container}><Text style={styles.notFound}>Activity not found</Text></SafeAreaView>;
  }

  const remaining = activity.maxParticipants - activity.participants.length;
  const isFull = remaining <= 0;
  const isOwner = isCreated || activity.hostId === user?.id || activity.host.id === user?.id;
  const isJoined = joinedLocally || activity.participants.some(
    participant => participant.userId === user?.id,
  );
  const isJoining = joiningIds.includes(activityId);
  const isLeaving = leavingIds.includes(activityId);
  const sanitize = (s: string) => s.replace(/[\r\n<>"'`]/g, ' ').trim();

  const handleJoin = () => {
    dispatch(joinActivityRequest(activityId));
  };

  const handleShare = async () => {
    await Share.share({ message: `Join me for ${sanitize(activity.title)} on ${activity.date} at ${activity.time}! 📍 ${sanitize(activity.location)}` });
  };

  const handleReport = () => Alert.alert('Report Activity', 'Thank you for your report. We will review it shortly.');

  const handleLeave = () => {
    Alert.alert('Leave Activity', 'Are you sure you want to leave?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: () => dispatch(leaveActivityRequest({
          activityId,
          userId: user?.id ?? '',
        })),
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Activity',
      'This will permanently remove the activity for all participants.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => dispatch(deleteActivityRequest(activityId)),
        },
      ],
    );
  };

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

          {isOwner && (
            <View style={styles.ownerActions}>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => navigation.navigate('EditActivity', { activityId })}
                disabled={isDeleting}>
                <Icon name="pencil-outline" size={18} color={C.btnActive} />
                <Text style={styles.editBtnText}>Edit Activity</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteBtn, isDeleting && styles.deleteBtnDisabled]}
                onPress={handleDelete}
                disabled={isDeleting}>
                <Icon name="delete-outline" size={18} color={C.danger} />
                <Text style={styles.deleteBtnText}>{isDeleting ? 'Deleting…' : 'Delete Activity'}</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.locationRow}>
              <Icon name="map-marker" size={16} color={C.btnInactive} style={{ marginRight: 6 }} />
              <Text style={styles.locationText}>{activity.location}</Text>
              {activity.distance && <Text style={styles.distanceBadge}>{activity.distance} km</Text>}
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
                <Text style={styles.organizerAvatarText}>{activity.host.name[0]}</Text>
              </View>
              <View>
                <Text style={styles.organizerName}>{activity.host.name}</Text>
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
                <View key={p.userId} style={[styles.participantAvatar, { marginLeft: i > 0 ? -8 : 0 }]}>
                  <Text style={styles.participantAvatarText}>{p.user.name[0]}</Text>
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
        {isOwner ? (
          <View style={styles.joinedBtn}>
            <Text style={styles.joinedBtnText}>Your Activity</Text>
          </View>
        ) : isJoined ? (
          <TouchableOpacity
            style={[styles.leaveBtn, isLeaving && styles.leaveBtnDisabled]}
            onPress={handleLeave}
            disabled={isLeaving}>
            <Text style={styles.leaveBtnText}>{isLeaving ? 'Leaving…' : 'Leave Activity'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.joinBtn, isFull && styles.joinBtnDisabled]} onPress={handleJoin} disabled={isFull || isJoining}>
            <Text style={styles.joinBtnText}>{isFull ? 'Activity Full' : isJoining ? 'Joining…' : 'Join Activity →'}</Text>
          </TouchableOpacity>
        )}
        {joinError && <Text style={styles.joinError}>{joinError}</Text>}
        {leaveError && <Text style={styles.joinError}>{leaveError}</Text>}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  notFound: { color: C.textPrimary, textAlign: 'center', marginTop: 40, fontSize: 16 },

  hero: { 
    backgroundColor: C.btnActive, 
    paddingTop: 56, 
    paddingBottom: 28, 
    paddingHorizontal: 20, 
    position: 'relative' 
  },
  backBtn: { position: 'absolute', top: 50, left: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  heroActions: { position: 'absolute', top: 50, right: 16, flexDirection: 'row', gap: 8, zIndex: 10 },
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
  editBtn: { backgroundColor: C.bgCard, borderRadius: 14, padding: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  editBtnText: { fontSize: 14, color: C.btnActive, fontWeight: '600' },
  ownerActions: { gap: 12, marginBottom: 12 },
  deleteBtn: { backgroundColor: C.dangerBg, borderRadius: 14, padding: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: C.danger },
  deleteBtnDisabled: { opacity: 0.7 },
  deleteBtnText: { fontSize: 14, color: C.danger, fontWeight: '600' },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.border },
  joinBtn: { backgroundColor: C.btnInactive, borderRadius: 16, height: 56, justifyContent: 'center', alignItems: 'center' },
  joinBtnDisabled: { backgroundColor: C.bgMuted },
  joinBtnText: { fontSize: 16, fontWeight: '700', color: C.textWhite },
  joinedBtn: { backgroundColor: C.successBg, borderColor: C.success, borderRadius: 16, borderWidth: 1, height: 56, justifyContent: 'center', alignItems: 'center' },
  joinedBtnText: { color: C.success, fontSize: 16, fontWeight: '700' },
  joinError: { color: C.danger, fontSize: 12, marginTop: 8, textAlign: 'center' },
  leaveBtn: { backgroundColor: C.dangerBg, borderRadius: 16, height: 56, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: C.danger },
  leaveBtnDisabled: { opacity: 0.7 },
  leaveBtnText: { fontSize: 16, fontWeight: '700', color: C.danger },
});
