import React from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, Platform, Image, TouchableOpacity, Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
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
  const topPad = insets.top + (Platform.OS === 'web' ? 16 : 4);

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
    <View style={[styles.container, { paddingTop: topPad + 12 }]}>
      <View style={styles.summaryCard}>
        <View style={styles.summaryTop}>
          <View>
            <Text style={styles.summaryLabel}>Total Referrals</Text>
            <Text style={styles.summaryValue}>{data?.totalCount ?? 0}</Text>
          </View>
          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>Your code</Text>
            <Text style={styles.codeValue}>{referralCode || '——'}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.85}>
          <Feather name="share-2" size={15} color={C.primaryForeground} />
          <Text style={styles.shareBtnText}>Invite Friends</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>People You Invited</Text>

      {isLoading ? (
        <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
      ) : referrals.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="user-plus" size={36} color={C.mutedForeground} />
          <Text style={styles.emptyText}>No referrals yet</Text>
          <Text style={styles.emptyHint}>Share your code to start earning referral bonuses</Text>
        </View>
      ) : (
        <FlatList
          data={referrals}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 80 }}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Avatar avatarUrl={item.avatarUrl} username={item.username} size={40} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName}>{item.username}</Text>
                <Text style={styles.rowDate}>Joined {new Date(item.joinedAt).toLocaleDateString()}</Text>
              </View>
              <View style={styles.rowRight}>
                <View style={[styles.activeBadge, item.isActive ? styles.activeBadgeOn : styles.activeBadgeOff]}>
                  <View style={[styles.activeDot, { backgroundColor: item.isActive ? C.success : C.mutedForeground }]} />
                  <Text style={styles.activeBadgeText}>{item.isActive ? 'Mining' : 'Idle'}</Text>
                </View>
                <Text style={styles.rowBalance}>{item.balance.toFixed(4)} ZRN</Text>
              </View>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: C.border }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  summaryCard: {
    marginHorizontal: 20, backgroundColor: C.card, borderRadius: 18,
    borderWidth: 1, borderColor: C.border, padding: 18, marginBottom: 20,
  },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  summaryLabel: { fontSize: 11, color: C.mutedForeground, fontFamily: 'Inter_500Medium', letterSpacing: 0.5 },
  summaryValue: { fontSize: 32, color: C.accent, fontFamily: 'Inter_700Bold', marginTop: 2 },
  codeBox: { alignItems: 'flex-end' },
  codeLabel: { fontSize: 11, color: C.mutedForeground, fontFamily: 'Inter_400Regular' },
  codeValue: { fontSize: 16, color: C.primary, fontFamily: 'Inter_700Bold', letterSpacing: 2, marginTop: 2 },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.primary, borderRadius: 12, paddingVertical: 12,
  },
  shareBtnText: { fontSize: 14, color: C.primaryForeground, fontFamily: 'Inter_600SemiBold' },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: C.foreground, paddingHorizontal: 20, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  avatarFallback: {
    backgroundColor: C.secondary, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarFallbackText: { color: C.foreground, fontFamily: 'Inter_700Bold' },
  rowName: { fontSize: 14, color: C.foreground, fontFamily: 'Inter_600SemiBold' },
  rowDate: { fontSize: 11, color: C.mutedForeground, fontFamily: 'Inter_400Regular', marginTop: 2 },
  rowRight: { alignItems: 'flex-end', gap: 4 },
  activeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3,
  },
  activeBadgeOn: { backgroundColor: C.success + '1A' },
  activeBadgeOff: { backgroundColor: C.secondary },
  activeDot: { width: 6, height: 6, borderRadius: 3 },
  activeBadgeText: { fontSize: 10, color: C.mutedForeground, fontFamily: 'Inter_500Medium' },
  rowBalance: { fontSize: 12, color: C.mutedForeground, fontFamily: 'Inter_500Medium' },
  empty: { alignItems: 'center', marginTop: 60, gap: 8 },
  emptyText: { fontSize: 15, color: C.mutedForeground, fontFamily: 'Inter_500Medium' },
  emptyHint: { fontSize: 12, color: C.mutedForeground, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingHorizontal: 30 },
});
