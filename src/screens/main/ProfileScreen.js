import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const stats = [
    { label: 'Events Joined', value: '8' },
    { label: 'Groups', value: '3' },
    { label: 'Neighbours', value: '24' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.statsRow}>
        {stats.map((s) => (
          <View key={s.label} style={styles.statBox}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        {['Edit Profile', 'My Events', 'Notifications', 'Settings'].map((item) => (
          <TouchableOpacity key={item} style={styles.menuItem}>
            <Text style={styles.menuText}>{item}</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { backgroundColor: '#4F46E5', alignItems: 'center', paddingVertical: 36, paddingTop: 50 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#4F46E5' },
  name: { fontSize: 22, fontWeight: '800', color: '#fff' },
  email: { fontSize: 13, color: '#C7D2FE', marginTop: 4 },
  statsRow: { flexDirection: 'row', backgroundColor: '#fff', margin: 16, borderRadius: 14, overflow: 'hidden' },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 16, borderRightWidth: 1, borderRightColor: '#F3F4F6' },
  statValue: { fontSize: 22, fontWeight: '800', color: '#4F46E5' },
  statLabel: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  section: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 14, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  menuText: { fontSize: 15, color: '#111827' },
  arrow: { fontSize: 20, color: '#9CA3AF' },
  logoutBtn: { margin: 16, backgroundColor: '#FEE2E2', borderRadius: 12, padding: 16, alignItems: 'center' },
  logoutText: { color: '#DC2626', fontWeight: '700', fontSize: 15 },
});
