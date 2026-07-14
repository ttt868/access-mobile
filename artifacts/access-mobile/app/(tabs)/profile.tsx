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
  const topPad = insets.top + (Platform.OS === 'web' ? 16 : 4);
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 80;

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
    <ScrollView
      style={{ backgroundColor: C.background }}
      contentContainerStyle={{ paddingTop: topPad, paddingHorizontal: 20, paddingBottom: bottomPad }}
    >
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <TouchableOpacity onPress={handlePickAvatar} activeOpacity={0.8} disabled={avatarMutation.isPending}>
          <View style={styles.avatar}>
            {avatarMutation.isPending ? (
              <ActivityIndicator color={C.primary} />
            ) : user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{user?.username?.[0]?.toUpperCase() ?? '?'}</Text>
            )}
          </View>
          <View style={styles.avatarEditBadge}>
            <Feather name="camera" size={13} color={C.primaryForeground} />
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
        <StatCard value="0.01" label="Per Session" color={C.success} />
      </View>

      {/* Referral rates info */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Feather name="info" size={16} color={C.primary} />
          <Text style={styles.cardTitle}>Earnings Breakdown</Text>
        </View>
        <RateRow label="Base mining per 12h session" value="+0.0100 ZRN" />
        <RateRow label="Per active referral (mining)" value="+0.0010 ZRN" />
        <RateRow label="New referral signup bonus" value="+0.0100 ZRN" />
        <RateRow label="Total supply" value="250,000 ZRN" highlight />
      </View>

      {/* Referral code */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Feather name="share-2" size={16} color={C.primary} />
          <Text style={styles.cardTitle}>Your Referral Code</Text>
        </View>
        <View style={styles.referralBox}>
          <Text style={styles.referralCode}>{user?.referralCode ?? '——'}</Text>
        </View>
        <Text style={styles.referralHint}>
          Share this code — you earn +0.01 ZRN when someone signs up, and +0.001 ZRN bonus per session when they mine.
        </Text>
      </View>

      {/* Info */}
      <View style={styles.card}>
        <InfoRow icon="user" label="Username" value={user?.username ?? '—'} />
        <View style={styles.sep} />
        <InfoRow icon="calendar" label="Member Since" value={joinDate} />
        <View style={styles.sep} />
        <InfoRow icon="users" label="Referral Count" value={String(user?.referralCount ?? 0)} />
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <Feather name="log-out" size={17} color={C.destructive} />
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
      <Feather name={icon} size={15} color={C.mutedForeground} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatarSection: { alignItems: 'center', marginBottom: 20 },
  avatar: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: C.secondary, borderWidth: 2, borderColor: C.primary,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    shadowColor: C.primary, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4, shadowRadius: 14, elevation: 7, marginBottom: 10,
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarEditBadge: {
    position: 'absolute', right: -2, bottom: 8, width: 24, height: 24, borderRadius: 12,
    backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: C.background,
  },
  avatarText: { fontSize: 30, color: C.primary, fontFamily: 'Inter_700Bold' },
  avatarError: { fontSize: 12, color: C.destructive, fontFamily: 'Inter_400Regular', marginTop: 6, textAlign: 'center' },
  username: { fontSize: 20, color: C.foreground, fontFamily: 'Inter_700Bold' },
  joined: { fontSize: 12, color: C.mutedForeground, fontFamily: 'Inter_400Regular', marginTop: 3 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: {
    flex: 1, backgroundColor: C.card, borderRadius: 14,
    borderWidth: 1, borderColor: C.border, padding: 12, alignItems: 'center',
  },
  statValue: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 10, color: C.mutedForeground, fontFamily: 'Inter_400Regular', marginTop: 3, textAlign: 'center' },
  card: {
    backgroundColor: C.card, borderRadius: 16,
    borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle: { fontSize: 14, color: C.foreground, fontFamily: 'Inter_600SemiBold' },
  rateRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  rateLabel: { fontSize: 13, color: C.mutedForeground, fontFamily: 'Inter_400Regular', flex: 1 },
  rateValue: { fontSize: 13, color: C.foreground, fontFamily: 'Inter_600SemiBold' },
  referralBox: {
    backgroundColor: C.secondary, borderRadius: 10,
    padding: 14, alignItems: 'center', marginBottom: 10,
  },
  referralCode: { fontSize: 22, color: C.primary, fontFamily: 'Inter_700Bold', letterSpacing: 5 },
  referralHint: { fontSize: 12, color: C.mutedForeground, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  sep: { height: 1, backgroundColor: C.border, marginVertical: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoLabel: { flex: 1, fontSize: 13, color: C.mutedForeground, fontFamily: 'Inter_400Regular' },
  infoValue: { fontSize: 13, color: C.foreground, fontFamily: 'Inter_500Medium' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.card, borderRadius: 14, borderWidth: 1,
    borderColor: C.destructive + '40', padding: 15, marginTop: 4,
  },
  logoutText: { fontSize: 15, color: C.destructive, fontFamily: 'Inter_600SemiBold' },
});
