import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export default function GroupDetailScreen({ route }) {
  const { group } = route.params;
  const [joined, setJoined] = useState(false);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>{group.emoji}</Text>
        <Text style={styles.heroTitle}>{group.name}</Text>
        <Text style={styles.heroMeta}>{group.members} members · {group.category}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.sectionTitle}>About this Group</Text>
        <Text style={styles.desc}>
          A vibrant community group for neighbours who share a passion for {group.category.toLowerCase()}. Join us to connect, plan events, and have fun together!
        </Text>

        <Text style={styles.sectionTitle}>Upcoming Events</Text>
        <View style={styles.eventCard}>
          <Text style={styles.eventTitle}>Next Meetup</Text>
          <Text style={styles.eventMeta}>📅 Coming soon · 📍 TBD</Text>
        </View>

        <TouchableOpacity style={[styles.joinBtn, joined && styles.joinBtnActive]} onPress={() => setJoined(!joined)}>
          <Text style={styles.joinText}>{joined ? '✅ Joined!' : 'Join Group'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  hero: { backgroundColor: '#4F46E5', alignItems: 'center', paddingVertical: 40 },
  heroEmoji: { fontSize: 64 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 12 },
  heroMeta: { fontSize: 13, color: '#C7D2FE', marginTop: 4 },
  body: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 8, marginTop: 16 },
  desc: { fontSize: 14, color: '#6B7280', lineHeight: 22 },
  eventCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14 },
  eventTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  eventMeta: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  joinBtn: { backgroundColor: '#4F46E5', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  joinBtnActive: { backgroundColor: '#059669' },
  joinText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
