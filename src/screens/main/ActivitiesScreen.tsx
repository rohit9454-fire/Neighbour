import React, { useState, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, RefreshControl, ListRenderItemInfo,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSelector, useDispatch } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootState } from '../../store';
import { ActivitiesStackParamList, Activity, ActivityCategory } from '../../types';
import { selectAllActivities, joinActivity, selectIsJoined } from '../../store/slices/activitiesSlice';

type Props = NativeStackScreenProps<ActivitiesStackParamList, 'ActivitiesMain'>;

type FilterKey = 'All' | 'Today' | 'Tomorrow' | ActivityCategory;
type SortKey = 'Newest' | 'Popular' | 'Distance' | 'Available Slots';

const FILTERS: FilterKey[] = ['All', 'Today', 'Tomorrow', 'Sports', 'Fitness', 'Cycling', 'Study', 'Meetups', 'Pets', 'Food'];
const SORTS: SortKey[] = ['Newest', 'Popular', 'Distance', 'Available Slots'];

function EmptyActivities({ onCreate }: { onCreate: () => void }): React.JSX.Element {
  const SUGGESTED = ['🎾 Sports', '🏃 Fitness', '🚴 Cycling', '📚 Study', '🐾 Pets', '🍲 Food'];
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIllustration}>🏘️</Text>
      <Text style={styles.emptyTitle}>No activities found</Text>
      <Text style={styles.emptySub}>Be the first to create one in your neighbourhood!</Text>
      <TouchableOpacity style={styles.createFirstBtn} onPress={onCreate}>
        <Text style={styles.createFirstText}>+ Create First Activity</Text>
      </TouchableOpacity>
      <Text style={styles.exploreTitle}>Explore Nearby Areas</Text>
      <View style={styles.suggestedRow}>
        {SUGGESTED.map(s => (
          <View key={s} style={styles.suggestedChip}>
            <Text style={styles.suggestedText}>{s}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function ActivitiesScreen({ navigation }: Props): React.JSX.Element {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const activities = useSelector(selectAllActivities);
  const myJoinedIds = useSelector((state: RootState) => state.activities.myJoined);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('All');
  const [activeSort, setActiveSort] = useState<SortKey>('Newest');
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;

  const filtered = useMemo(() => {
    let list = activities.filter(a => a.status === 'upcoming');
    if (search) list = list.filter(a => a.title.toLowerCase().includes(search.toLowerCase()) || a.location.toLowerCase().includes(search.toLowerCase()));
    if (activeFilter === 'Today') list = list.filter(a => a.date === 'Today');
    else if (activeFilter === 'Tomorrow') list = list.filter(a => a.date === 'Tomorrow');
    else if (activeFilter !== 'All') list = list.filter(a => a.category === activeFilter);
    if (activeSort === 'Popular') list = [...list].sort((a, b) => b.participants.length - a.participants.length);
    else if (activeSort === 'Available Slots') list = [...list].sort((a, b) => (b.maxParticipants - b.participants.length) - (a.maxParticipants - a.participants.length));
    else if (activeSort === 'Distance') list = [...list].sort((a, b) => parseFloat(a.distance ?? '99') - parseFloat(b.distance ?? '99'));
    return list;
  }, [activities, search, activeFilter, activeSort]);

  const paginated = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = paginated.length < filtered.length;

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderItem = ({ item }: ListRenderItemInfo<Activity>) => {
    const joined = myJoinedIds.includes(item.id);
    const remaining = item.maxParticipants - item.participants.length;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ActivityDetail', { activityId: item.id })}
        activeOpacity={0.85}>
        <View style={styles.cardTop}>
          <Text style={styles.cardEmoji}>{item.emoji}</Text>
          <View style={styles.cardMid}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.cardMeta}>📍 {item.location}</Text>
            <Text style={styles.cardMeta}>📅 {item.date} · {item.time} · ⏱ {item.duration}</Text>
            <Text style={styles.cardMeta}>👤 {item.host}</Text>
          </View>
        </View>
        <View style={styles.cardBottom}>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryPillText}>{item.category}</Text>
          </View>
          <Text style={styles.slotInfo}>
            {item.participants.length}/{item.maxParticipants} · {remaining > 0 ? `${remaining} left` : 'Full'}
          </Text>
          <TouchableOpacity
            style={[styles.joinBtn, joined && styles.joinBtnJoined]}
            onPress={() => user && dispatch(joinActivity({ activityId: item.id, userName: user.name }))}>
            <Text style={[styles.joinBtnText, joined && styles.joinBtnTextJoined]}>
              {joined ? '✓ Joined' : 'Join'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Activities</Text>
        <TouchableOpacity style={styles.myBtn} onPress={() => navigation.navigate('MyActivities')}>
          <Text style={styles.myBtnText}>My Activities</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search activities..."
          placeholderTextColor="#6B7280"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={styles.clearSearch}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={f => f}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        renderItem={({ item: f }) => (
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
            onPress={() => { setActiveFilter(f); setPage(1); }}>
            <Text style={[styles.filterChipText, activeFilter === f && styles.filterChipTextActive]}>{f}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Sort */}
      <FlatList
        horizontal
        data={SORTS}
        keyExtractor={s => s}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sortList}
        renderItem={({ item: s }) => (
          <TouchableOpacity
            style={[styles.sortChip, activeSort === s && styles.sortChipActive]}
            onPress={() => setActiveSort(s)}>
            <Text style={[styles.sortChipText, activeSort === s && styles.sortChipTextActive]}>{s}</Text>
          </TouchableOpacity>
        )}
      />

      {/* List */}
      <FlatList<Activity>
        data={paginated}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
        ListEmptyComponent={<EmptyActivities onCreate={() => navigation.navigate('CreateActivity')} />}
        onEndReached={() => hasMore && setPage(p => p + 1)}
        onEndReachedThreshold={0.3}
        ListFooterComponent={hasMore ? (
          <View style={styles.loadMore}>
            <Text style={styles.loadMoreText}>Loading more...</Text>
          </View>
        ) : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff' },
  myBtn: { backgroundColor: '#1E3A8A', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  myBtnText: { fontSize: 12, color: '#93C5FD', fontWeight: '600' },

  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 14, marginHorizontal: 16, marginBottom: 12, paddingHorizontal: 14, paddingVertical: 10 },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#fff' },
  clearSearch: { fontSize: 14, color: '#6B7280', paddingLeft: 8 },

  filterList: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  filterChip: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: '#111', borderWidth: 1, borderColor: '#222' },
  filterChipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  filterChipText: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
  filterChipTextActive: { color: '#fff', fontWeight: '700' },

  sortList: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  sortChip: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, backgroundColor: '#0A0A0A', borderWidth: 1, borderColor: '#1F1F1F' },
  sortChipActive: { borderColor: '#2563EB' },
  sortChipText: { fontSize: 11, color: '#6B7280' },
  sortChipTextActive: { color: '#2563EB', fontWeight: '600' },

  card: { backgroundColor: '#111', borderRadius: 18, padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: 'row', marginBottom: 12 },
  cardEmoji: { fontSize: 38, marginRight: 14 },
  cardMid: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 4 },
  cardMeta: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#1F1F1F' },
  categoryPill: { backgroundColor: '#1E3A8A', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  categoryPillText: { fontSize: 11, color: '#93C5FD', fontWeight: '600' },
  slotInfo: { fontSize: 12, color: '#6B7280' },
  joinBtn: { backgroundColor: '#2563EB', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  joinBtnJoined: { backgroundColor: '#0A1A0A', borderWidth: 1, borderColor: '#4ADE80' },
  joinBtnText: { fontSize: 12, color: '#fff', fontWeight: '700' },
  joinBtnTextJoined: { color: '#4ADE80' },

  loadMore: { alignItems: 'center', paddingVertical: 16 },
  loadMoreText: { fontSize: 13, color: '#6B7280' },

  emptyContainer: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 32 },
  emptyIllustration: { fontSize: 80, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  createFirstBtn: { backgroundColor: '#2563EB', borderRadius: 16, paddingHorizontal: 28, paddingVertical: 14, marginBottom: 32 },
  createFirstText: { fontSize: 15, color: '#fff', fontWeight: '700' },
  exploreTitle: { fontSize: 14, fontWeight: '600', color: '#9CA3AF', marginBottom: 12 },
  suggestedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  suggestedChip: { backgroundColor: '#111', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#222' },
  suggestedText: { fontSize: 13, color: '#D1D5DB' },
});
