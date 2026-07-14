import React from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, Platform, Image, TouchableOpacity, Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useGetReferrals, getGetReferralsQueryKey } from '@workspace/api-client-react';
import colors from '@/constants/colors';

const C = colors.light;

function Avatar({ avatarUrl, username, size }: { avatarUrl?: string | null; username: string; size: number }) {
  if (avatarUrl) {
    return <Image source={{ uri: avatarUrl }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  return (
    <View style={[styles.avatarFallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarFallbackText, { fontSize: size * 0.4 }]}>{username[0]?.toUpperCase()}</Text>
    </View>
  );
}

export default function ReferralsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = insets.top + (Platform.OS === 'web' ? 24 : 10);

  const { data, isLoading } = useGetReferrals({ query: { queryKey: getGetReferralsQueryKey() } });
  const referrals = data?.referrals ?? [];
  const referralCode = data?.referralCode ?? '';

  const handleShare = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Share.share({
      message: `Join me on NEXORA and start mining ZRN — use my code ${referralCode} when you sign up!`,
    });
  };

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={['#E5EEF9', '#F4F7FC', '#FFFFFF']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.container, { paddingTop: topPad }]}>
        <Text style={styles.screenTitle}>Network</Text>

        <View style={styles.summaryCardShadow}>
          <LinearGradient
            colors={['#FFFFFF', '#F8FAFC']}
            start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
            style={styles.summaryCard}
          >
            <View style={styles.summaryTop}>
              <View>
                <Text style={styles.summaryLabel}>Total Referrals</Text>
                <Text style={styles.summaryValue}>{data?.totalCount ?? 0}</Text>
              </View>
              <View style={styles.codeBox}>
                <Text style={styles.codeLabel}>Your code</Text>
                <View style={styles.codePill}>
                  <Text style={styles.codeValue}>{referralCode || '——'}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.shareBtnShadow} onPress={handleShare} activeOpacity={0.85}>
              <LinearGradient
                colors={[C.primary, C.accent]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.shareBtn}
              >
                <Feather name="share-2" size={16} color="#FFF" />
                <Text style={styles.shareBtnText}>Invite Friends</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        <Text style={styles.sectionTitle}>People You Invited</Text>

        {isLoading ? (
          <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
        ) : referrals.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIconCircle}>
              <Feather name="users" size={32} color={C.primary} />
            </View>
            <Text style={styles.emptyText}>No referrals yet</Text>
            <Text style={styles.emptyHint}>Share your code to start earning referral bonuses</Text>
          </View>
        ) : (
          <FlatList
            data={referrals}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 100 }}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <View style={styles.avatarRing}>
                  <Avatar avatarUrl={item.avatarUrl} username={item.username} size={42} />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={styles.rowName}>{item.username}</Text>
                  <Text style={styles.rowDate}>Joined {new Date(item.joinedAt).toLocaleDateString()}</Text>
                </View>
                <View style={styles.rowRight}>
                  <View style={[styles.activeBadge, item.isActive ? styles.activeBadgeOn : styles.activeBadgeOff]}>
                    <View style={[styles.activeDot, { backgroundColor: item.isActive ? '#10B981' : '#94A3B8' }]} />
                    <Text style={[styles.activeBadgeText, item.isActive ? { color: '#059669' } : { color: '#64748B' }]}>{item.isActive ? 'Mining' : 'Idle'}</Text>
                  </View>
                  <Text style={styles.rowBalance}>{item.balance.toFixed(4)} ZRN</Text>
                </View>
              </View>
            )}
            ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: C.border }} />}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  container: { flex: 1 },
  screenTitle: { fontSize: 28, fontFamily: 'Inter_800ExtraBold', color: C.foreground, paddingHorizontal: 20, paddingBottom: 16, letterSpacing: -0.5 },
  
  summaryCardShadow: {
    marginHorizontal: 20, marginBottom: 28,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1, shadowRadius: 20, elevation: 8,
    borderRadius: 24,
  },
  summaryCard: {
    borderRadius: 24, borderWidth: 1, borderColor: '#FFFFFF', padding: 24,
  },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  summaryLabel: { fontSize: 13, color: C.mutedForeground, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5 },
  summaryValue: { fontSize: 36, color: C.foreground, fontFamily: 'Inter_800ExtraBold', marginTop: 4, letterSpacing: -1 },
  codeBox: { alignItems: 'flex-end' },
  codeLabel: { fontSize: 12, color: C.mutedForeground, fontFamily: 'Inter_500Medium', marginBottom: 6 },
  codePill: {
    backgroundColor: '#F1F5F9', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: C.border,
  },
  codeValue: { fontSize: 16, color: C.primary, fontFamily: 'Inter_700Bold', letterSpacing: 2 },
  
  shareBtnShadow: {
    shadowColor: C.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 6,
    borderRadius: 16,
  },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderRadius: 16, paddingVertical: 16,
  },
  shareBtnText: { fontSize: 15, color: '#FFF', fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: C.foreground, paddingHorizontal: 20, marginBottom: 12 },
  
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, backgroundColor: '#FFFFFF', paddingHorizontal: 20, borderRadius: 20, marginBottom: 8, borderWidth: 1, borderColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1, marginHorizontal: 20 },
  avatarRing: {
    padding: 3, borderRadius: 26, backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#E2E8F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  avatarFallback: {
    backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarFallbackText: { color: C.primary, fontFamily: 'Inter_700Bold' },
  rowName: { fontSize: 15, color: C.foreground, fontFamily: 'Inter_700Bold' },
  rowDate: { fontSize: 12, color: C.mutedForeground, fontFamily: 'Inter_500Medium', marginTop: 3 },
  rowRight: { alignItems: 'flex-end', gap: 6 },
  activeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4,
  },
  activeBadgeOn: { backgroundColor: '#ECFDF5' },
  activeBadgeOff: { backgroundColor: '#F1F5F9' },
  activeDot: { width: 6, height: 6, borderRadius: 3 },
  activeBadgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  rowBalance: { fontSize: 13, color: C.foreground, fontFamily: 'Inter_600SemiBold' },
  
  empty: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: C.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 4 },
  emptyText: { fontSize: 16, color: C.foreground, fontFamily: 'Inter_600SemiBold' },
  emptyHint: { fontSize: 13, color: C.mutedForeground, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingHorizontal: 40, lineHeight: 20 },
});