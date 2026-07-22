import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ListRenderItemInfo } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSelector, useDispatch } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootState } from '../../store';
import { ActivitiesStackParamList, Activity } from '../../types';
import { selectMyJoined, selectMyCreated, leaveActivityRequest, cancelActivityRequest, deleteActivityRequest } from '../../store/slices/activitiesSlice';
import { C } from '../../theme';

type Props = NativeStackScreenProps<ActivitiesStackParamList, 'MyActivities'>;
type TabKey = 'Joined' | 'Created' | 'Completed' | 'Cancelled';
const TABS: TabKey[] = ['Joined', 'Created', 'Completed', 'Cancelled'];

const STATUS_COLOR: Record<string, string> = {
  upcoming: C.success, completed: '#2563EB', cancelled: C.danger,
};

export default function MyActivitiesScreen({ navigation }: Props): React.JSX.Element {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const allActivities = useSelector((state: RootState) => state.activities.activities);
  const myJoined = useSelector(selectMyJoined);
  const myCreated = useSelector(selectMyCreated);
  const [activeTab, setActiveTab] = useState<TabKey>('Joined');

  const getData = (): Activity[] => {
    if (activeTab === 'Joined') return myJoined.filter(a => a.status === 'upcoming');
    if (activeTab === 'Created') return myCreated.filter(a => a.status === 'upcoming');
    if (activeTab === 'Completed') return allActivities.filter(a => a.status === 'completed');
    return allActivities.filter(a => a.status === 'cancelled');
  };

  const handleLeave = (activity: Activity) => {
    Alert.alert('Leave Activity', `Leave "${activity.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: () => user && dispatch(leaveActivityRequest({ activityId: activity.id, userId: user.id ?? '' })) },
    ]);
  };

  const handleCancel = (activity: Activity) => {
    Alert.alert('Cancel Activity', `Cancel "${activity.title}"?`, [
      { text: 'No', style: 'cancel' },
      { text: 'Cancel Activity', style: 'destructive', onPress: () => dispatch(cancelActivityRequest(activity.id)) },
    ]);
  };

  const handleDelete = (activity: Activity) => {
    Alert.alert('Delete Activity', `Delete "${activity.title}"?`, [
      { text: 'No', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => dispatch(deleteActivityRequest(activity.id)) },
    ]);
  };

  const renderItem = ({ item }: ListRenderItemInfo<Activity>) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.cardEmoji}>{item.emoji}</Text>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.cardMeta}><Icon name="calendar" size={12} color={C.textSecondary} /> {item.date} · {item.time}</Text>
          <Text style={styles.cardMeta}><Icon name="map-marker" size={12} color={C.textSecondary} /> {item.location}</Text>
          <Text style={styles.cardMeta}><Icon name="account-group" size={12} color={C.textSecondary} /> {item.participants.length}/{item.maxParticipants} participants</Text>
        </View>
        <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[item.status] ?? C.textMuted }]} />
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('ActivityDetail', { activityId: item.id })}>
          <Text style={styles.actionBtnText}>View</Text>
        </TouchableOpacity>
        {activeTab === 'Created' && item.status === 'upcoming' && (
          <>
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleCancel(item)}>
              <Text style={[styles.actionBtnText, { color: C.danger }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item)}>
              <Text style={[styles.actionBtnText, { color: C.danger }]}>Delete</Text>
            </TouchableOpacity>
          </>
        )}
        {activeTab === 'Joined' && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleLeave(item)}>
            <Text style={[styles.actionBtnText, { color: C.danger }]}>Leave</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('ActivityChat', { activityId: item.id, activityTitle: item.title })}>
          <Icon name="chat-outline" size={14} color={C.btnInactive} style={{ marginRight: 4 }} />
          <Text style={[styles.actionBtnText, { color: C.btnInactive }]}>Chat</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Activities</Text>
        <View style={{ width: 32 }} />
      </View>
      <View style={styles.tabsRow}>
        {TABS.map(tab => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList<Activity>
        data={getData()} keyExtractor={item => item.id} renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="inbox-remove-outline" size={48} color={C.textMuted} />
            <Text style={styles.emptyText}>No {activeTab.toLowerCase()} activities</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.textPrimary },
  tabsRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8, gap: 8 },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 12, backgroundColor: C.bgCard, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  tabActive: { backgroundColor: C.btnActive, borderColor: C.btnActive },
  tabText: { fontSize: 11, color: C.textMuted, fontWeight: '500' },
  tabTextActive: { color: C.textWhite, fontWeight: '700' },
  card: { backgroundColor: C.bgCard, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: C.shadow, shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  cardEmoji: { fontSize: 32, marginRight: 12 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.textPrimary, marginBottom: 4 },
  cardMeta: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  cardActions: { flexDirection: 'row', gap: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.divider },
  actionBtn: { backgroundColor: C.bgMuted, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, flexDirection: 'row', alignItems: 'center' },
  actionBtnText: { fontSize: 12, color: C.textSecondary, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: C.textMuted },
});
