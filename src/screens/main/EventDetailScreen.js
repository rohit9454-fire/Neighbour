import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export default function EventDetailScreen({ route }) {
  const { event } = route.params;
  const [going, setGoing] = useState(false);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>{event.emoji}</Text>
        <Text style={styles.heroTitle}>{event.title}</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.infoRow}><Text style={styles.infoIcon}>📅</Text><Text style={styles.infoText}>{event.date}</Text></View>
        <View style={styles.infoRow}><Text style={styles.infoIcon}>📍</Text><Text style={styles.infoText}>{event.location}</Text></View>
        <View style={styles.infoRow}><Text style={styles.infoIcon}>👥</Text><Text style={styles.infoText}>{event.going} people going</Text></View>

        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.desc}>
          Join your neighbours for a fun community event. Everyone is welcome — bring your energy and let's make great memories together!
        </Text>

        <TouchableOpacity style={[styles.rsvpBtn, going && styles.rsvpBtnActive]} onPress={() => setGoing(!going)}>
          <Text style={styles.rsvpText}>{going ? '✅ You\'re Going!' : 'RSVP – I\'m Going'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  hero: { backgroundColor: '#4F46E5', alignItems: 'center', paddingVertical: 40 },
  heroEmoji: { fontSize: 64 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 12, textAlign: 'center', paddingHorizontal: 20 },
  body: { padding: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8 },
  infoIcon: { fontSize: 18, marginRight: 10 },
  infoText: { fontSize: 14, color: '#374151' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 16, marginBottom: 8 },
  desc: { fontSize: 14, color: '#6B7280', lineHeight: 22 },
  rsvpBtn: { backgroundColor: '#4F46E5', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  rsvpBtnActive: { backgroundColor: '#059669' },
  rsvpText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
