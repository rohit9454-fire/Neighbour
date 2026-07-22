import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Switch } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootState } from '../../store';
import { logout, fetchStatsRequest } from '../../store/slices/authSlice';
import { C } from '../../theme';
import { ProfileStackParamList } from '../../types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ProfileMain'>;

const APP_VERSION = '1.0.0';

export default function ProfileScreen({ navigation }: Props): React.JSX.Element {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const stats = useSelector((state: RootState) => state.auth.stats);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);

  useEffect(() => {
    dispatch(fetchStatsRequest());
  }, [dispatch]);

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
              <Icon name="camera" size={13} color={C.textWhite} />
            </View>
          </View>
          <Text style={styles.name}>{user?.name ?? 'Neighbour'}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <Icon name="home-group" size={14} color={C.textSecondary} />
            <Text style={styles.society}>{user?.society ?? 'Green Valley'} · {user?.sector ?? 'Sector 45'}</Text>
          </View>
          <Text style={styles.email}>{user?.email}</Text>
          <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditProfile')} activeOpacity={0.8}>
            <Icon name="pencil-outline" size={15} color={C.btnActive} />
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{stats?.joined ?? '—'}</Text>
            <Text style={styles.statLbl}>Joined</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{stats?.created ?? '—'}</Text>
            <Text style={styles.statLbl}>Created</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{stats?.neighbours ?? '—'}</Text>
            <Text style={styles.statLbl}>Neighbours</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INTERESTS</Text>
          {(user?.interests ?? []).length > 0 ? (
            <View style={styles.interestsWrap}>
              {(user?.interests ?? []).map((interest, i) => (
                <View key={i} style={styles.interestChip}>
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addInterestsCta}
              onPress={() => navigation.navigate('EditProfile')}>
              <Icon name="plus-circle-outline" size={18} color={C.btnActive} style={{ marginRight: 8 }} />
              <Text style={styles.addInterestsText}>Add your interests</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SETTINGS</Text>
          <View style={styles.menuCard}>
            <View style={styles.menuItemToggle}>
              <Icon name="bell-outline" size={20} color={C.textSecondary} style={styles.menuIcon} />
              <Text style={styles.menuText}>Notifications</Text>
              <Switch value={notifEnabled} onValueChange={setNotifEnabled}
                trackColor={{ false: C.border, true: C.bgMuted }}
                thumbColor={notifEnabled ? C.btnActive : C.textMuted} />
            </View>
            <View style={styles.menuDivider} />
            <View style={styles.menuItemToggle}>
              <Icon name="map-marker-outline" size={20} color={C.textSecondary} style={styles.menuIcon} />
              <Text style={styles.menuText}>Location Services</Text>
              <Switch value={locationEnabled} onValueChange={setLocationEnabled}
                trackColor={{ false: C.border, true: C.bgMuted }}
                thumbColor={locationEnabled ? C.btnActive : C.textMuted} />
            </View>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Privacy', 'Your data is safe.')}>
              <Icon name="lock-outline" size={20} color={C.textSecondary} style={styles.menuIcon} />
              <Text style={styles.menuText}>Privacy</Text>
              <Icon name="chevron-right" size={20} color={C.textMuted} />
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Blocked Users', 'No blocked users.')}>
              <Icon name="account-cancel-outline" size={20} color={C.textSecondary} style={styles.menuIcon} />
              <Text style={styles.menuText}>Blocked Users</Text>
              <Icon name="chevron-right" size={20} color={C.textMuted} />
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Report Problem', 'Thank you! Our team will look into it.')}>
              <Icon name="flag-outline" size={20} color={C.textSecondary} style={styles.menuIcon} />
              <Text style={styles.menuText}>Report a Problem</Text>
              <Icon name="chevron-right" size={20} color={C.textMuted} />
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
  name: { fontSize: 22, fontWeight: '700', color: C.textPrimary, marginBottom: 4 },
  society: { fontSize: 13, color: C.textSecondary },
  email: { fontSize: 12, color: C.textMuted, marginBottom: 12 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: C.bgCard },
  editBtnText: { fontSize: 13, fontWeight: '600', color: C.btnActive },

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
  addInterestsCta: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  addInterestsText: { fontSize: 14, color: C.btnActive, fontWeight: '600' },

  menuCard: { backgroundColor: C.bgCard, borderRadius: 16, overflow: 'hidden', shadowColor: C.shadow, shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 15 },
  menuItemToggle: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  menuIcon: { marginRight: 12 },
  menuText: { flex: 1, fontSize: 15, color: C.textPrimary },
  menuDivider: { height: 1, backgroundColor: C.divider, marginLeft: 48 },

  logoutBtn: { marginHorizontal: 20, backgroundColor: C.dangerBg, borderRadius: 16, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#FECACA', marginBottom: 12 },
  logoutText: { fontSize: 15, fontWeight: '700', color: C.danger },

  version: { textAlign: 'center', fontSize: 12, color: C.textMuted, marginBottom: 8 },
});
