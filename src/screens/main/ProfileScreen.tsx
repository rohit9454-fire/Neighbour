import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Switch } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootState } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { C } from '../../theme';

const INTERESTS = ['🎾 Badminton', '🏏 Cricket', '🏃 Running', '🚴 Cycling', '🚗 Carpool', '👥 Study Group', '🐾 Dog Walking'];
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
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
          <Text style={styles.society}>🏘️ {user?.society ?? 'Green Valley'} · {user?.sector ?? 'Sector 45'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SETTINGS</Text>
          <View style={styles.menuCard}>
            <View style={styles.menuItemToggle}>
              <Text style={styles.menuIcon}>🔔</Text>
              <Text style={styles.menuText}>Notifications</Text>
              <Switch value={notifEnabled} onValueChange={setNotifEnabled}
                trackColor={{ false: C.border, true: C.bgMuted }}
                thumbColor={notifEnabled ? C.btnActive : C.textMuted} />
            </View>
            <View style={styles.menuDivider} />
            <View style={styles.menuItemToggle}>
              <Text style={styles.menuIcon}>📍</Text>
              <Text style={styles.menuText}>Location Services</Text>
              <Switch value={locationEnabled} onValueChange={setLocationEnabled}
                trackColor={{ false: C.border, true: C.bgMuted }}
                thumbColor={locationEnabled ? C.btnActive : C.textMuted} />
            </View>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Privacy', 'Your data is safe.')}>
              <Text style={styles.menuIcon}>🔒</Text>
              <Text style={styles.menuText}>Privacy</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Blocked Users', 'No blocked users.')}>
              <Text style={styles.menuIcon}>🚫</Text>
              <Text style={styles.menuText}>Blocked Users</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Report Problem', 'Thank you! Our team will look into it.')}>
              <Text style={styles.menuIcon}>⚑</Text>
              <Text style={styles.menuText}>Report a Problem</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version {APP_VERSION}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { paddingBottom: 100 },

  profileSection: { alignItems: 'center', paddingTop: 24, paddingBottom: 20 },
  avatarWrap: { position: 'relative', marginBottom: 14 },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: C.btnActive, borderWidth: 3, borderColor: C.btnInactive, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 34, fontWeight: '700', color: C.textWhite },
  cameraBtn: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: C.btnInactive, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: C.bg },
  cameraIcon: { fontSize: 13 },
  name: { fontSize: 22, fontWeight: '700', color: C.textPrimary, marginBottom: 4 },
  society: { fontSize: 13, color: C.textSecondary, marginBottom: 4 },
  email: { fontSize: 12, color: C.textMuted },

  statsRow: { flexDirection: 'row', backgroundColor: C.bgCard, marginHorizontal: 20, borderRadius: 16, paddingVertical: 16, marginBottom: 24, shadowColor: C.shadow, shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: '700', color: C.btnActive },
  statLbl: { fontSize: 11, color: C.textMuted, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: C.divider },

  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 1, marginBottom: 10 },

  interestsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  interestChip: { backgroundColor: C.bgMuted, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: C.border },
  interestText: { fontSize: 13, color: C.btnActive },

  menuCard: { backgroundColor: C.bgCard, borderRadius: 16, overflow: 'hidden', shadowColor: C.shadow, shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 15 },
  menuItemToggle: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  menuIcon: { fontSize: 18, marginRight: 12 },
  menuText: { flex: 1, fontSize: 15, color: C.textPrimary },
  menuArrow: { fontSize: 20, color: C.textMuted },
  menuDivider: { height: 1, backgroundColor: C.divider, marginLeft: 48 },

  logoutBtn: { marginHorizontal: 20, backgroundColor: C.dangerBg, borderRadius: 16, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#FECACA', marginBottom: 12 },
  logoutText: { fontSize: 15, fontWeight: '700', color: C.danger },

  version: { textAlign: 'center', fontSize: 12, color: C.textMuted, marginBottom: 8 },
});
