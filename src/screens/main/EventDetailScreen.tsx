import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList, Event } from '../../types';

type Props = NativeStackScreenProps<HomeStackParamList, 'EventDetail'>;

export default function EventDetailScreen({ route, navigation }: Props): React.JSX.Element {
  const { event } = route.params as { event: Event };
  const [going, setGoing] = useState(false);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.hero}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
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
        <TouchableOpacity
          style={[styles.rsvpBtn, going && styles.rsvpBtnActive]}
          onPress={() => setGoing(!going)}>
          <Text style={styles.rsvpText}>{going ? "✅ You're Going!" : "RSVP – I'm Going"}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  hero: { backgroundColor: '#0F172A', alignItems: 'center', paddingVertical: 40, paddingTop: 56 },
  backBtn: { position: 'absolute', top: 16, left: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center' },
  backText: { fontSize: 18, color: '#fff' },
  heroEmoji: { fontSize: 64 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 12, textAlign: 'center', paddingHorizontal: 20 },
  body: { padding: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 12, padding: 14, marginBottom: 8 },
  infoIcon: { fontSize: 18, marginRight: 10 },
  infoText: { fontSize: 14, color: '#D1D5DB' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginTop: 16, marginBottom: 8 },
  desc: { fontSize: 14, color: '#9CA3AF', lineHeight: 22 },
  rsvpBtn: { backgroundColor: '#2563EB', borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 24 },
  rsvpBtnActive: { backgroundColor: '#059669' },
  rsvpText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
