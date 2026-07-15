import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ListRenderItemInfo } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSelector, useDispatch } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootState } from '../../store';
import { HomeStackParamList, AppNotification, NotificationType } from '../../types';
import { markAsRead, markAllAsRead, deleteNotification } from '../../store/slices/notificationsSlice';
import { C } from '../../theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'Notifications'>;

const TYPE_ICON: Record<NotificationType, string> = {
  activity_joined: 'account-check', reminder: 'alarm', activity_updated: 'pencil',
  chat: 'chat', community_bulletin: 'bullhorn',
};

function getGroup(timestamp: string): 'Today' | 'Yesterday' | 'Earlier' {
  const diffHrs = (Date.now() - new Date(timestamp).getTime()) / (1000 * 60 * 60);
  if (diffHrs < 24) return 'Today';
  if (diffHrs < 48) return 'Yesterday';
  return 'Earlier';
}

export default function NotificationsScreen({ navigation }: Props): React.JSX.Element {
  const dispatch = useDispatch();
  const notifications = useSelector((state: RootState) => state.notifications.notifications);

  const grouped: Record<string, AppNotification[]> = { Today: [], Yesterday: [], Earlier: [] };
  notifications.forEach(n => grouped[getGroup(n.timestamp)].push(n));
  const sections = (['Today', 'Yesterday', 'Earlier'] as const).filter(g => grouped[g].length > 0);

  const handlePress = (n: AppNotification) => {
    dispatch(markAsRead(n.id));
    if (n.activityId) navigation.navigate('ActivityDetail', { activityId: n.activityId });
  };

  const renderItem = ({ item }: ListRenderItemInfo<AppNotification>) => (
    <TouchableOpacity
      style={[styles.item, !item.read && styles.itemUnread]}
      onPress={() => handlePress(item)}
      activeOpacity={0.8}>
      <View style={styles.iconWrap}>
        <Icon name={TYPE_ICON[item.type]} size={20} color={C.btnInactive} />
        {!item.read && <View style={styles.unreadDot} />}
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemBody} numberOfLines={2}>{item.body}</Text>
        <Text style={styles.itemTime}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      <TouchableOpacity style={styles.deleteBtn} onPress={() => dispatch(deleteNotification(item.id))}>
        <Icon name="close" size={16} color={C.textMuted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={() => dispatch(markAllAsRead())}>
          <Text style={styles.markAllText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={sections}
        keyExtractor={s => s}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item: section }) => (
          <View>
            <Text style={styles.groupLabel}>{section}</Text>
            {grouped[section].map(n => renderItem({ item: n } as ListRenderItemInfo<AppNotification>))}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="bell-off-outline" size={48} color={C.textMuted} />
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.bgCard },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.textPrimary },
  markAllText: { fontSize: 13, color: C.btnInactive, fontWeight: '600' },

  groupLabel: { fontSize: 12, fontWeight: '700', color: C.textMuted, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, letterSpacing: 0.5 },

  item: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.divider, backgroundColor: C.bgCard },
  itemUnread: { backgroundColor: C.bgMuted },
  iconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.bgInput, justifyContent: 'center', alignItems: 'center', marginRight: 12, position: 'relative' },
  unreadDot: { position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: 4, backgroundColor: C.btnActive },
  itemContent: { flex: 1 },
  itemTitle: { fontSize: 14, fontWeight: '600', color: C.textPrimary, marginBottom: 3 },
  itemBody: { fontSize: 12, color: C.textSecondary, lineHeight: 18 },
  itemTime: { fontSize: 11, color: C.textMuted, marginTop: 4 },
  deleteBtn: { padding: 4 },

  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, color: C.textMuted },
});
