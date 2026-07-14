import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ListRenderItemInfo } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Group, GroupsStackParamList } from '../../types';

type Props = NativeStackScreenProps<GroupsStackParamList, 'GroupsMain'>;

const GROUPS: Group[] = [
  { id: '1', emoji: '⚽', name: 'Sunday Football Club', members: 18, category: 'Sports' },
  { id: '2', emoji: '🎭', name: 'Cultural Society', members: 42, category: 'Culture' },
  { id: '3', emoji: '🏏', name: 'Cricket Lovers', members: 25, category: 'Sports' },
  { id: '4', emoji: '🎨', name: 'Art & Craft Circle', members: 15, category: 'Hobby' },
  { id: '5', emoji: '🍕', name: 'Food & Potluck Gang', members: 30, category: 'Social' },
];

export default function GroupsScreen({ navigation }: Props): React.JSX.Element {
  const renderItem = ({ item }: ListRenderItemInfo<Group>) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('GroupDetail', { group: item })}>
      <Text style={styles.emoji}>{item.emoji}</Text>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.meta}>{item.members} members · {item.category}</Text>
      </View>
      <TouchableOpacity style={styles.joinBtn}>
        <Text style={styles.joinText}>Join</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community Groups</Text>
        <TouchableOpacity style={styles.createBtn} onPress={() => navigation.navigate('CreateGroup')}>
          <Text style={styles.createBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <FlatList<Group>
        data={GROUPS}
        keyExtractor={(item: Group) => item.id}
        contentContainerStyle={{ padding: 12 }}
        renderItem={renderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#4F46E5' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  createBtn: { backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  createBtnText: { color: '#4F46E5', fontWeight: '700', fontSize: 13 },
  card: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 14,
    marginBottom: 10, alignItems: 'center', elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  emoji: { fontSize: 36, marginRight: 12 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: '#111827' },
  meta: { fontSize: 12, color: '#6B7280', marginTop: 3 },
  joinBtn: { backgroundColor: '#EEF2FF', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  joinText: { color: '#4F46E5', fontWeight: '700', fontSize: 13 },
});
