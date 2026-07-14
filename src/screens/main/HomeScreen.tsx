import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ListRenderItemInfo, Animated,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSelector, useDispatch } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootState } from '../../store';
import { HomeStackParamList, Activity } from '../../types';
import {
  selectAllActivities, joinActivity, selectIsJoined,
} from '../../store/slices/activitiesSlice';
import { selectUnreadCount } from '../../store/slices/notificationsSlice';

type Props = NativeStackScreenProps<HomeStackParamList, 'HomeMain'>;

const BULLETINS = [
  { id: 'b1', emoji: '🔧', text: 'Water supply off Sunday 8–12 AM for maintenance.' },
  { id: 'b2', emoji: '🎉', text: 'Society Annual Day on July 15th. Register by July 10.' },
  { id: 'b3', emoji: '🚗', text: 'Parking slots re-allotment starts Monday. Check notice board.' },
];

const ACTIVE_USERS = ['Rahul', 'Priya', 'Vikram', 'Neha', 'Amit', 'Dev'];

function SkeletonCard(): React.JSX.Element {
  return (
    <View style={sk.card}>
      <View style={sk.circle} />
      <View style={sk.lines}>
        <View style={sk.line1} />
        <View style={sk.line2} />
        <View style={sk.line3} />
      </View>
    </View>
  );
}

function ActivityCard({
  item, onPress, onJoin, joined,
}: {
  item: Activity; onPress: () => void; onJoin: () => void; joined: boolean;
}): React.JSX.Element {
  const remaining = item.maxParticipants - item.participants.length;
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.cardHeader}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
        {item.weather ? <Text style={styles.weatherBadge}>{item.weather}</Text> : null}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardEmoji}>{item.emoji}</Text>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.cardMeta}>📍 {item.location}</Text>
          <Text style={styles.cardMeta}>📅 {item.date} · {item.time}</Text>
          <Text style={styles.cardMeta}>⏱ {item.duration}</Text>
          <View style={styles.cardFooterRow}>
            <Text style={styles.hostText}>👤 {item.host}</Text>
            <Text style={styles.slotText}>
              {item.participants.length}/{item.maxParticipants} joined
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.cardActions}>
        <View style={[styles.slotBadge, remaining <= 2 && styles.slotBadgeRed]}>
          <Text style={[styles.slotBadgeText, remaining <= 2 && styles.slotBadgeTextRed]}>
            {remaining > 0 ? `${remaining} slots left` : 'Full'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.joinBtn, joined && styles.joinBtnJoined]}
          onPress={onJoin}
          activeOpacity={0.8}>
          <Text style={[styles.joinBtnText, joined && styles.joinBtnTextJoined]}>
            {joined ? '✓ Joined' : 'Join'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation }: Props): React.JSX.Element {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const activities = useSelector(selectAllActivities);
  const unreadCount = useSelector(selectUnreadCount);
  const myJoinedIds = useSelector((state: RootState) => state.activities.myJoined);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  const handleJoin = (activity: Activity) => {
    if (!user) return;
    dispatch(joinActivity({ activityId: activity.id, userName: user.name }));
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const header = (
    <>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}, {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={styles.locality}>
            📍 {user?.society ?? 'Green Valley'}, {user?.sector ?? 'Sector 45'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.notifBtn}
          onPress={() => navigation.navigate('Notifications')}>
          <Text style={styles.notifIcon}>🔔</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Hero Banner */}
      <View style={styles.heroBanner}>
        <Text style={styles.heroEmoji}>🏘️</Text>
        <View style={styles.heroText}>
          <Text style={styles.heroTitle}>Your Neighbourhood</Text>
          <Text style={styles.heroSub}>
            {activities.filter(a => a.status === 'upcoming').length} activities happening nearby
          </Text>
        </View>
        <TouchableOpacity
          style={styles.heroBtn}
          onPress={() => navigation.navigate('ActivityDetail', { activityId: activities[0]?.id })}>
          <Text style={styles.heroBtnText}>Explore →</Text>
        </TouchableOpacity>
      </View>

      {/* Weather Widget */}
      <View style={styles.weatherCard}>
        <Text style={styles.weatherTitle}>☀️ Today's Weather</Text>
        <View style={styles.weatherRow}>
          <View style={styles.weatherItem}><Text style={styles.weatherVal}>28°C</Text><Text style={styles.weatherLbl}>Now</Text></View>
          <View style={styles.weatherItem}><Text style={styles.weatherVal}>32°C</Text><Text style={styles.weatherLbl}>Afternoon</Text></View>
          <View style={styles.weatherItem}><Text style={styles.weatherVal}>26°C</Text><Text style={styles.weatherLbl}>Evening</Text></View>
          <View style={styles.weatherItem}><Text style={styles.weatherVal}>💧 60%</Text><Text style={styles.weatherLbl}>Humidity</Text></View>
        </View>
      </View>

      {/* Active Users */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Neighbours</Text>
        <View style={styles.activeRow}>
          {ACTIVE_USERS.map((name, i) => (
            <View key={name} style={[styles.activeAvatar, { marginLeft: i > 0 ? -10 : 0 }]}>
              <Text style={styles.activeAvatarText}>{name[0]}</Text>
            </View>
          ))}
          <Text style={styles.activeMore}>+12 online</Text>
        </View>
      </View>

      {/* Community Bulletin */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Community Bulletin 📢</Text>
        {BULLETINS.map(b => (
          <View key={b.id} style={styles.bulletinItem}>
            <Text style={styles.bulletinEmoji}>{b.emoji}</Text>
            <Text style={styles.bulletinText}>{b.text}</Text>
          </View>
        ))}
      </View>

      {/* Nearby Activities Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Nearby Activities</Text>
        <TouchableOpacity onPress={() => {}}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const empty = (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>🏘️</Text>
      <Text style={styles.emptyTitle}>No activities yet</Text>
      <Text style={styles.emptySub}>Be the first to create one!</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList<Activity>
        data={loading ? [] : activities.filter(a => a.status === 'upcoming')}
        keyExtractor={item => item.id}
        ListHeaderComponent={header}
        ListEmptyComponent={loading ? (
          <View style={{ paddingHorizontal: 16 }}>
            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </View>
        ) : empty}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
        }
        renderItem={({ item }: ListRenderItemInfo<Activity>) => (
          <ActivityCard
            item={item}
            joined={myJoinedIds.includes(item.id)}
            onPress={() => navigation.navigate('ActivityDetail', { activityId: item.id })}
            onJoin={() => handleJoin(item)}
          />
        )}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const sk = StyleSheet.create({
  card: { flexDirection: 'row', backgroundColor: '#1A1A1A', borderRadius: 16, padding: 16, marginBottom: 12, alignItems: 'center' },
  circle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#2A2A2A', marginRight: 12 },
  lines: { flex: 1, gap: 8 },
  line1: { height: 14, backgroundColor: '#2A2A2A', borderRadius: 7, width: '70%' },
  line2: { height: 10, backgroundColor: '#2A2A2A', borderRadius: 5, width: '50%' },
  line3: { height: 10, backgroundColor: '#2A2A2A', borderRadius: 5, width: '40%' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  // Top Bar
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16,
  },
  greeting: { fontSize: 20, fontWeight: '700', color: '#fff' },
  locality: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  notifBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center' },
  notifIcon: { fontSize: 18 },
  badge: { position: 'absolute', top: 4, right: 4, backgroundColor: '#EF4444', borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center' },
  badgeText: { fontSize: 9, color: '#fff', fontWeight: '700' },

  // Hero
  heroBanner: {
    marginHorizontal: 20, marginBottom: 16, backgroundColor: '#1E3A8A',
    borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center',
  },
  heroEmoji: { fontSize: 36, marginRight: 12 },
  heroText: { flex: 1 },
  heroTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  heroSub: { fontSize: 12, color: '#93C5FD', marginTop: 2 },
  heroBtn: { backgroundColor: '#2563EB', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  heroBtnText: { fontSize: 12, color: '#fff', fontWeight: '600' },

  // Weather
  weatherCard: {
    marginHorizontal: 20, marginBottom: 16, backgroundColor: '#0F172A',
    borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#1E293B',
  },
  weatherTitle: { fontSize: 13, fontWeight: '600', color: '#94A3B8', marginBottom: 12 },
  weatherRow: { flexDirection: 'row', justifyContent: 'space-between' },
  weatherItem: { alignItems: 'center' },
  weatherVal: { fontSize: 14, fontWeight: '700', color: '#fff' },
  weatherLbl: { fontSize: 10, color: '#64748B', marginTop: 2 },

  // Sections
  section: { marginHorizontal: 20, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, marginBottom: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 10 },
  seeAll: { fontSize: 13, color: '#2563EB', fontWeight: '600' },

  // Active Users
  activeRow: { flexDirection: 'row', alignItems: 'center' },
  activeAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#000' },
  activeAvatarText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  activeMore: { marginLeft: 12, fontSize: 12, color: '#9CA3AF' },

  // Bulletin
  bulletinItem: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#111', borderRadius: 12, padding: 12, marginBottom: 8 },
  bulletinEmoji: { fontSize: 16, marginRight: 10, marginTop: 1 },
  bulletinText: { flex: 1, fontSize: 13, color: '#D1D5DB', lineHeight: 18 },

  // Activity Card
  card: {
    marginHorizontal: 16, marginBottom: 12, backgroundColor: '#111',
    borderRadius: 20, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  categoryBadge: { backgroundColor: '#1E3A8A', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  categoryText: { fontSize: 11, color: '#93C5FD', fontWeight: '600' },
  weatherBadge: { fontSize: 12, color: '#9CA3AF' },
  cardBody: { flexDirection: 'row', alignItems: 'flex-start' },
  cardEmoji: { fontSize: 40, marginRight: 14 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 4 },
  cardMeta: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  cardFooterRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  hostText: { fontSize: 11, color: '#6B7280' },
  slotText: { fontSize: 11, color: '#6B7280' },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#1F1F1F' },
  slotBadge: { backgroundColor: '#1A2A1A', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  slotBadgeRed: { backgroundColor: '#2A1A1A' },
  slotBadgeText: { fontSize: 11, color: '#4ADE80', fontWeight: '600' },
  slotBadgeTextRed: { color: '#F87171' },
  joinBtn: { backgroundColor: '#2563EB', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 9 },
  joinBtnJoined: { backgroundColor: '#1A2A1A', borderWidth: 1, borderColor: '#4ADE80' },
  joinBtnText: { fontSize: 13, color: '#fff', fontWeight: '700' },
  joinBtnTextJoined: { color: '#4ADE80' },

  // Empty
  emptyState: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
});
