import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ListRenderItemInfo,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSelector, useDispatch } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootState } from '../../store';
import { ActivitiesStackParamList, Activity } from '../../types';
import {
  selectMyJoined, selectMyCreated, leaveActivity,
  cancelActivity, deleteActivity,
} from '../../store/slices/activitiesSlice';

type Props = NativeStackScreenProps<ActivitiesStackParamList, 'MyActivities'>;
type TabKey = 'Joined' | 'Created' | 'Completed' | 'Cancelled';
const TABS: TabKey[] = ['Joined', 'Created', 'Completed', 'Cancelled'];

const STATUS_COLOR: Record<string, string> = {
  upcoming: '#4ADE80', completed: '#60A5FA', cancelled: '#F87171',
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
      { text: 'Leave', style: 'destructive', onPress: () => user && dispatch(leaveActivity({ activityId: activity.id, userName: user.name })) },
    ]);
  };

  const handleCancel = (activity: Activity) => {
    Alert.alert('Cancel Activity', `Cancel "${activity.title}"? This cannot be undone.`, [
      { text: 'No', style: 'cancel' },
      { text: 'Cancel Activity', style: 'destructive', onPress: () => dispatch(cancelActivity(activity.id)) },
    ]);
  };

  const handleDelete = (activity: Activity) => {
    Alert.alert('Delete Activity', `Delete "${activity.title}"?`, [
      { text: 'No', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => dispatch(deleteActivity(activity.id)) },
    ]);
  };

  const renderItem = ({ item }: ListRenderItemInfo<Activity>) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.cardEmoji}>{item.emoji}</Text>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.cardMeta}>📅 {item.date} · {item.time}</Text>
          <Text style={styles.cardMeta}>📍 {item.location}</Text>
          <Text style={styles.cardMeta}>👥 {item.participants.length}/{item.maxParticipants} participants</Text>
        </View>
        <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[item.status] ?? '#6B7280' }]} />
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('ActivityDetail', { activityId: item.id })}>
          <Text style={styles.actionBtnText}>View</Text>
        </TouchableOpacity>

        {activeTab === 'Created' && item.status === 'upcoming' && (
          <>
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleCancel(item)}>
              <Text style={[styles.actionBtnText, { color: '#F87171' }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item)}>
              <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Delete</Text>
            </TouchableOpacity>
          </>
        )}

        {activeTab === 'Joined' && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleLeave(item)}>
            <Text style={[styles.actionBtnText, { color: '#F87171' }]}>Leave</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('ActivityChat', { activityId: item.id, activityTitle: item.title })}>
          <Text style={[styles.actionBtnText, { color: '#93C5FD' }]}>Chat</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const data = getData();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Activities</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList<Activity>
        data={data}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyText}>No {activeTab.toLowerCase()} activities</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  backText: { fontSize: 22, color: '#fff' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },

  tabsRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8, gap: 8 },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 12, backgroundColor: '#111', alignItems: 'center', borderWidth: 1, borderColor: '#1F2937' },
  tabActive: { backgroundColor: '#1E3A8A', borderColor: '#2563EB' },
  tabText: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  tabTextActive: { color: '#93C5FD', fontWeight: '700' },

  card: { backgroundColor: '#111', borderRadius: 16, padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  cardEmoji: { fontSize: 32, marginRight: 12 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 4 },
  cardMeta: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },

  cardActions: { flexDirection: 'row', gap: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#1F2937' },
  actionBtn: { backgroundColor: '#1A1A1A', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#2A2A2A' },
  actionBtnText: { fontSize: 12, color: '#D1D5DB', fontWeight: '600' },

  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: '#6B7280' },
});
