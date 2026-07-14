import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Platform, ScrollView, Image, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useUpdateAvatar } from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';
import { ConfirmModal } from '@/components/ConfirmModal';
import colors from '@/constants/colors';

const C = colors.light;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout, updateUser } = useAuth();
  const qc = useQueryClient();
  const [avatarError, setAvatarError] = useState('');
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const topPad = insets.top + (Platform.OS === 'web' ? 24 : 10);
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 100;

  const avatarMutation = useUpdateAvatar({
    mutation: {
      onSuccess: async (updated) => {
        await updateUser(updated);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      },
      onError: (e: any) => {
        setAvatarError(e?.response?.data?.error ?? 'Could not update photo');
      },
    },
  });

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLogoutModalVisible(true);
  };

  const confirmLogout = async () => {
    setLogoutModalVisible(false);
    await logout();
    qc.clear();
    router.replace('/auth');
  };

  const handlePickAvatar = async () => {
    setAvatarError('');
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setAvatarError('Photo library permission is required');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.4,
      base64: true,
    });
    if (result.canceled || !result.assets?.[0]?.base64) return;
    const asset = result.assets[0];
    const mime = asset.mimeType ?? 'image/jpeg';
    avatarMutation.mutate({ data: { avatarBase64: `data:${mime};base64,${asset.base64}` } });
  };

  const joinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '—';

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={['#E5EEF9', '#F4F7FC', '#FFFFFF']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: topPad, paddingHorizontal: 20, paddingBottom: bottomPad }}
      >
        <Text style={styles.screenTitle}>Account</Text>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handlePickAvatar} activeOpacity={0.8} disabled={avatarMutation.isPending}>
            <View style={styles.avatarRing}>
              <View style={styles.avatar}>
                {avatarMutation.isPending ? (
                  <ActivityIndicator color={C.primary} />
                ) : user?.avatarUrl ? (
                  <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>{user?.username?.[0]?.toUpperCase() ?? '?'}</Text>
                )}
              </View>
              <LinearGradient
                colors={[C.primary, C.accent]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.avatarEditBadge}
              >
                <Feather name="camera" size={12} color="#FFF" />
              </LinearGradient>
            </View>
          </TouchableOpacity>
          <Text style={styles.username}>{user?.username}</Text>
          <Text style={styles.joined}>Miner since {joinDate}</Text>
          {!!avatarError && <Text style={styles.avatarError}>{avatarError}</Text>}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard value={(user?.balance ?? 0).toFixed(4)} label="ZRN Balance" color={C.primary} />
          <StatCard value={String(user?.referralCount ?? 0)} label="Referrals" color={C.accent} />
          <StatCard value="0.01" label="Per Session" color="#10B981" />
        </View>

        {/* Referral rates info */}
        <View style={styles.cardShadow}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBg, { backgroundColor: '#EAF0F8' }]}><Feather name="info" size={16} color={C.primary} /></View>
              <Text style={styles.cardTitle}>Earnings Breakdown</Text>
            </View>
            <RateRow label="Base mining per 12h session" value="+0.0100 ZRN" />
            <RateRow label="Per active referral (mining)" value="+0.0010 ZRN" />
            <RateRow label="New referral signup bonus" value="+0.0100 ZRN" />
            <RateRow label="Total supply" value="250,000 ZRN" highlight />
          </View>
        </View>

        {/* Referral code */}
        <View style={styles.cardShadow}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBg, { backgroundColor: '#EAF0F8' }]}><Feather name="share-2" size={16} color={C.primary} /></View>
              <Text style={styles.cardTitle}>Your Referral Code</Text>
            </View>
            <View style={styles.referralBox}>
              <Text style={styles.referralCode}>{user?.referralCode ?? '——'}</Text>
            </View>
            <Text style={styles.referralHint}>
              Share this code — you earn +0.01 ZRN when someone signs up, and +0.001 ZRN bonus per session when they mine.
            </Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.cardShadow}>
          <View style={styles.card}>
            <InfoRow icon="user" label="Username" value={user?.username ?? '—'} />
            <View style={styles.sep} />
            <InfoRow icon="calendar" label="Member Since" value={joinDate} />
            <View style={styles.sep} />
            <InfoRow icon="users" label="Referral Count" value={String(user?.referralCount ?? 0)} />
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Feather name="log-out" size={18} color={C.destructive} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <ConfirmModal
          visible={logoutModalVisible}
          icon="log-out"
          title="Sign Out"
          message="Are you sure you want to sign out of your account?"
          confirmLabel="Sign Out"
          cancelLabel="Cancel"
          destructive
          onConfirm={confirmLogout}
          onCancel={() => setLogoutModalVisible(false)}
        />
      </ScrollView>
    </View>
  );
}

function StatCard({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function RateRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.rateRow}>
      <Text style={styles.rateLabel}>{label}</Text>
      <Text style={[styles.rateValue, highlight && { color: C.primary }]}>{value}</Text>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.iconBgSm}><Feather name={icon} size={14} color={C.mutedForeground} /></View>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  screenTitle: { fontSize: 28, fontFamily: 'Inter_800ExtraBold', color: C.foreground, paddingBottom: 16, letterSpacing: -0.5 },
  
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatarRing: {
    padding: 4, borderRadius: 50, backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#E2E8F0',
    shadowColor: C.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 6,
    marginBottom: 16,
  },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarEditBadge: {
    position: 'absolute', right: 0, bottom: 0, width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  avatarText: { fontSize: 36, color: C.primary, fontFamily: 'Inter_700Bold' },
  avatarError: { fontSize: 13, color: C.destructive, fontFamily: 'Inter_500Medium', marginTop: 8, textAlign: 'center' },
  username: { fontSize: 22, color: C.foreground, fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.5 },
  joined: { fontSize: 13, color: C.mutedForeground, fontFamily: 'Inter_500Medium', marginTop: 4 },
  
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 20,
    borderWidth: 1, borderColor: '#FFFFFF', padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  statValue: { fontSize: 20, fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.5 },
  statLabel: { fontSize: 11, color: C.mutedForeground, fontFamily: 'Inter_600SemiBold', marginTop: 4, textAlign: 'center' },
  
  cardShadow: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 3,
    marginBottom: 16, borderRadius: 24,
  },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 24,
    borderWidth: 1, borderColor: '#FFFFFF', padding: 20,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  iconBg: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 16, color: C.foreground, fontFamily: 'Inter_700Bold' },
  
  rateRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  rateLabel: { fontSize: 14, color: C.mutedForeground, fontFamily: 'Inter_500Medium', flex: 1 },
  rateValue: { fontSize: 14, color: C.foreground, fontFamily: 'Inter_700Bold' },
  
  referralBox: {
    backgroundColor: '#F8FAFC', borderRadius: 16,
    padding: 18, alignItems: 'center', marginBottom: 12,
    borderWidth: 1, borderColor: C.border,
  },
  referralCode: { fontSize: 24, color: C.primary, fontFamily: 'Inter_800ExtraBold', letterSpacing: 4 },
  referralHint: { fontSize: 13, color: C.mutedForeground, fontFamily: 'Inter_500Medium', lineHeight: 20 },
  
  sep: { height: 1, backgroundColor: C.border, marginVertical: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBgSm: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  infoLabel: { flex: 1, fontSize: 14, color: C.mutedForeground, fontFamily: 'Inter_500Medium' },
  infoValue: { fontSize: 14, color: C.foreground, fontFamily: 'Inter_600SemiBold' },
  
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#FFF1F2', borderRadius: 20, borderWidth: 1,
    borderColor: '#FECACA', padding: 18, marginTop: 12,
  },
  logoutText: { fontSize: 16, color: C.destructive, fontFamily: 'Inter_700Bold' },
});