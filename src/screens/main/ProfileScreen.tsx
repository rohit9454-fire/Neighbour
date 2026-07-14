import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Switch,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootState } from '../../store';
import { logout } from '../../store/slices/authSlice';

const INTERESTS = [
  '🎾 Badminton', '🏏 Cricket', '🏃 Running', '🚴 Cycling',
  '🚗 Carpool', '👥 Study Group', '🐾 Dog Walking',
];

const APP_VERSION = '1.0.0';

export default function ProfileScreen(): React.JSX.Element {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const myJoined = useSelector((state: RootState) => state.activities.myJoined);
  const myCreated = useSelector((state: RootState) => state.activities.myCreated);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => dispatch(logout()) },
    ]);
  };

  const handleReport = () => Alert.alert('Report Problem', 'Thank you! Our team will look into it.');
  const handleBlocked = () => Alert.alert('Blocked Users', 'No blocked users.');
  const handlePrivacy = () => Alert.alert('Privacy', 'Your data is safe. We never share your exact address.');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Avatar & Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() ?? 'U'}</Text>
            </View>
            <View style={styles.cameraBtn}>
              <Text style={styles.cameraIcon}>📷</Text>
            </View>
          </View>
          <Text style={styles.name}>{user?.name ?? 'Neighbour'}</Text>
          <Text style={styles.society}>
            🏘️ {user?.society ?? 'Green Valley'} · {user?.sector ?? 'Sector 45'}
          </Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{myJoined.length}</Text>
            <Text style={styles.statLbl}>Joined</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{myCreated.length}</Text>
            <Text style={styles.statLbl}>Created</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statVal}>24</Text>
            <Text style={styles.statLbl}>Neighbours</Text>
          </View>
        </View>

        {/* Interests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INTERESTS</Text>
          <View style={styles.interestsWrap}>
            {(user?.interests ?? INTERESTS.slice(0, 4)).map((interest, i) => (
              <View key={i} style={styles.interestChip}>
                <Text style={styles.interestText}>{interest}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SETTINGS</Text>
          <View style={styles.menuCard}>
            <View style={styles.menuItemToggle}>
              <Text style={styles.menuIcon}>🔔</Text>
              <Text style={styles.menuText}>Notifications</Text>
              <Switch
                value={notifEnabled}
                onValueChange={setNotifEnabled}
                trackColor={{ false: '#1F2937', true: '#1E3A8A' }}
                thumbColor={notifEnabled ? '#2563EB' : '#374151'}
              />
            </View>
            <View style={styles.menuDivider} />
            <View style={styles.menuItemToggle}>
              <Text style={styles.menuIcon}>📍</Text>
              <Text style={styles.menuText}>Location Services</Text>
              <Switch
                value={locationEnabled}
                onValueChange={setLocationEnabled}
                trackColor={{ false: '#1F2937', true: '#1E3A8A' }}
                thumbColor={locationEnabled ? '#2563EB' : '#374151'}
              />
            </View>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={handlePrivacy}>
              <Text style={styles.menuIcon}>🔒</Text>
              <Text style={styles.menuText}>Privacy</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={handleBlocked}>
              <Text style={styles.menuIcon}>🚫</Text>
              <Text style={styles.menuText}>Blocked Users</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={handleReport}>
              <Text style={styles.menuIcon}>⚑</Text>
              <Text style={styles.menuText}>Report a Problem</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.version}>Version {APP_VERSION}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  content: { paddingBottom: 100 },

  profileSection: { alignItems: 'center', paddingTop: 24, paddingBottom: 20 },
  avatarWrap: { position: 'relative', marginBottom: 14 },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#1E3A8A', borderWidth: 3, borderColor: '#2563EB', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 34, fontWeight: '700', color: '#fff' },
  cameraBtn: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#000' },
  cameraIcon: { fontSize: 13 },
  name: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 4 },
  society: { fontSize: 13, color: '#9CA3AF', marginBottom: 4 },
  email: { fontSize: 12, color: '#4B5563' },

  statsRow: { flexDirection: 'row', backgroundColor: '#111', marginHorizontal: 20, borderRadius: 16, paddingVertical: 16, marginBottom: 24 },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: '700', color: '#2563EB' },
  statLbl: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#1F2937' },

  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#4B5563', letterSpacing: 1, marginBottom: 10 },

  interestsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  interestChip: { backgroundColor: '#111', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#1F2937' },
  interestText: { fontSize: 13, color: '#D1D5DB' },

  menuCard: { backgroundColor: '#111', borderRadius: 16, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 15 },
  menuItemToggle: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  menuIcon: { fontSize: 18, marginRight: 12 },
  menuText: { flex: 1, fontSize: 15, color: '#E5E7EB' },
  menuArrow: { fontSize: 20, color: '#374151' },
  menuDivider: { height: 1, backgroundColor: '#1A1A1A', marginLeft: 48 },

  logoutBtn: { marginHorizontal: 20, backgroundColor: '#1A0A0A', borderRadius: 16, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#3B1A1A', marginBottom: 12 },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#EF4444' },

  version: { textAlign: 'center', fontSize: 12, color: '#374151', marginBottom: 8 },
});
