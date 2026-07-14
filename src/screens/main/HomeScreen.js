import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';

const EVENTS = [
  { id: '1', emoji: '⚽', title: 'Sunday Football Match', date: 'Sun, 22 Jun · 7:00 AM', location: 'Central Park Ground', going: 12 },
  { id: '2', emoji: '🎭', title: 'Cultural Evening', date: 'Sat, 28 Jun · 6:00 PM', location: 'Community Hall', going: 34 },
  { id: '3', emoji: '🏏', title: 'Cricket Tournament', date: 'Sun, 29 Jun · 8:00 AM', location: 'Sports Complex', going: 22 },
  { id: '4', emoji: '🎉', title: 'Neighbourhood BBQ', date: 'Fri, 4 Jul · 5:00 PM', location: 'Block C Garden', going: 18 },
];

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hey, {user?.name} 👋</Text>
          <Text style={styles.sub}>What's happening nearby?</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('CreateEvent')}>
          <Text style={styles.addBtnText}>+ Event</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={EVENTS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('EventDetail', { event: item })}>
            <Text style={styles.cardEmoji}>{item.emoji}</Text>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardMeta}>📅 {item.date}</Text>
              <Text style={styles.cardMeta}>📍 {item.location}</Text>
            </View>
            <View style={styles.goingBadge}>
              <Text style={styles.goingText}>{item.going} going</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#4F46E5' },
  greeting: { fontSize: 20, fontWeight: '800', color: '#fff' },
  sub: { fontSize: 13, color: '#C7D2FE', marginTop: 2 },
  addBtn: { backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { color: '#4F46E5', fontWeight: '700', fontSize: 13 },
  card: {
    flexDirection: 'row', backgroundColor: '#fff', margin: 12, marginBottom: 0,
    borderRadius: 14, padding: 14, alignItems: 'center', elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  cardEmoji: { fontSize: 36, marginRight: 12 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 },
  cardMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  goingBadge: { backgroundColor: '#EEF2FF', borderRadius: 10, padding: 6 },
  goingText: { fontSize: 11, color: '#4F46E5', fontWeight: '600' },
});
