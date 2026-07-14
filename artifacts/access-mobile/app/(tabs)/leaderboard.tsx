import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, Platform, Image, Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import {
  useGetLeaderboard, getGetLeaderboardQueryKey,
  useGetTopReferrers, getGetTopReferrersQueryKey,
} from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';
import colors from '@/constants/colors';

const C = colors.light;
const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

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

type Tab = 'miners' | 'referrers';

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const topPad = insets.top + (Platform.OS === 'web' ? 16 : 4);
  const [tab, setTab] = useState<Tab>('miners');

  const { data, isLoading } = useGetLeaderboard({ query: { queryKey: getGetLeaderboardQueryKey() } });
  const { data: refData, isLoading: refLoading } = useGetTopReferrers({
    query: { queryKey: getGetTopReferrersQueryKey() },
  });

  const entries = data?.entries ?? [];
  const referrerEntries = refData?.entries ?? [];
  const totalMined = data?.totalMined ?? 0;
  const supplyPct = Math.min((totalMined / 250000) * 100, 100);

  const isMiners = tab === 'miners';
  const activeEntries: any[] = isMiners ? entries : referrerEntries;
  const activeLoading = isMiners ? isLoading : refLoading;

  return (
    <View style={[styles.container, { paddingTop: topPad + 12 }]}>
      {/* Supply bar */}
      <View style={styles.supplyBar}>
        <View style={styles.supplyTopRow}>
          <Text style={styles.supplyLabel}>ZRN Circulating Supply</Text>
          <Text style={styles.supplyValue}>{totalMined.toFixed(2)} / 250,000</Text>
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${supplyPct}%` as any }]} />
        </View>
      </View>

      {/* Tab switch */}
      <View style={styles.tabSwitch}>
        <Pressable
          style={[styles.tabBtn, isMiners && styles.tabBtnActive]}
          onPress={() => setTab('miners')}
        >
          <Feather name="zap" size={14} color={isMiners ? C.background : C.mutedForeground} />
          <Text style={[styles.tabBtnText, isMiners && styles.tabBtnTextActive]}>Top Miners</Text>
        </Pressable>
        <Pressable
          style={[styles.tabBtn, !isMiners && styles.tabBtnActive]}
          onPress={() => setTab('referrers')}
        >
          <Feather name="users" size={14} color={!isMiners ? C.background : C.mutedForeground} />
          <Text style={[styles.tabBtnText, !isMiners && styles.tabBtnTextActive]}>Top Referrers</Text>
        </Pressable>
      </View>

      {/* Top 3 podium */}
      {activeEntries.length >= 3 && (
        <View style={styles.podium}>
          <PodiumItem entry={activeEntries[1]} colorIdx={1} size="sm" mode={tab} />
          <PodiumItem entry={activeEntries[0]} colorIdx={0} size="lg" mode={tab} />
          <PodiumItem entry={activeEntries[2]} colorIdx={2} size="sm" mode={tab} />
        </View>
      )}

      {activeLoading ? (
        <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
      ) : activeEntries.length === 0 ? (
        <View style={styles.empty}>
          <Feather name={isMiners ? 'users' : 'user-plus'} size={36} color={C.mutedForeground} />
          <Text style={styles.emptyText}>{isMiners ? 'No miners yet' : 'No referrers yet'}</Text>
        </View>
      ) : (
        <FlatList
          data={activeEntries.slice(3)}
          keyExtractor={(item) => String(item.rank)}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 80 }}
          renderItem={({ item }) => {
            const isMe = item.username === user?.username;
            return (
              <View style={[styles.row, isMe && styles.rowMe]}>
                <Text style={styles.rankNum}>#{item.rank}</Text>
                <Avatar avatarUrl={item.avatarUrl} username={item.username} size={34} />
                <Text style={[styles.name, isMe && { color: C.primary }]} numberOfLines={1}>{item.username}</Text>
                {isMe && <View style={styles.meBadge}><Text style={styles.meBadgeText}>YOU</Text></View>}
                {isMiners ? (
                  <Text style={styles.balance}>{item.balance.toFixed(4)} ZRN</Text>
                ) : (
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.balance}>{item.referralCount} referrals</Text>
                    <Text style={styles.balanceSub}>{item.referralEarnings.toFixed(4)} ZRN earned</Text>
                  </View>
                )}
              </View>
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: C.border }} />}
        />
      )}
    </View>
  );
}

function PodiumItem({ entry, colorIdx, size, mode }: { entry: any; colorIdx: number; size: 'sm' | 'lg'; mode: Tab }) {
  const isLg = size === 'lg';
  const avatarSize = isLg ? 60 : 46;
  return (
    <View style={[styles.podiumItem, isLg && { paddingBottom: 8 }]}>
      {isLg && <Feather name="award" size={18} color={RANK_COLORS[0]} style={{ marginBottom: 4 }} />}
      <View style={[styles.podiumAvatarRing, { borderColor: RANK_COLORS[colorIdx], width: avatarSize + 6, height: avatarSize + 6, borderRadius: (avatarSize + 6) / 2 }]}>
        <Avatar avatarUrl={entry.avatarUrl} username={entry.username} size={avatarSize} />
      </View>
      <Text style={[styles.podiumRank, { color: RANK_COLORS[colorIdx] }]}>#{entry.rank}</Text>
      <Text style={styles.podiumName} numberOfLines={1}>{entry.username}</Text>
      {mode === 'miners' ? (
        <Text style={styles.podiumBal}>{entry.balance.toFixed(2)}</Text>
      ) : (
        <Text style={styles.podiumBal}>{entry.referralCount} refs</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  supplyBar: {
    marginHorizontal: 20, backgroundColor: C.card, borderRadius: 14,
    borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 14,
  },
  supplyTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  supplyLabel: { fontSize: 12, color: C.mutedForeground, fontFamily: 'Inter_500Medium' },
  supplyValue: { fontSize: 12, color: C.primary, fontFamily: 'Inter_600SemiBold' },
  progressBg: { height: 5, backgroundColor: C.secondary, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 5, backgroundColor: C.primary, borderRadius: 3 },
  tabSwitch: {
    flexDirection: 'row', marginHorizontal: 20, marginBottom: 14, backgroundColor: C.card,
    borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 4, gap: 4,
  },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 9, borderRadius: 9,
  },
  tabBtnActive: { backgroundColor: C.primary },
  tabBtnText: { fontSize: 13, color: C.mutedForeground, fontFamily: 'Inter_600SemiBold' },
  tabBtnTextActive: { color: C.background },
  podium: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end',
    marginHorizontal: 20, marginBottom: 14, gap: 8,
    backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 16,
  },
  podiumItem: { alignItems: 'center', flex: 1, gap: 4 },
  podiumAvatarRing: {
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  avatarFallback: {
    backgroundColor: C.secondary, borderWidth: 1, borderColor: C.mutedForeground,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarFallbackText: { color: C.foreground, fontFamily: 'Inter_700Bold' },
  podiumRank: { fontSize: 12, fontFamily: 'Inter_700Bold', color: C.mutedForeground },
  podiumName: { fontSize: 11, color: C.foreground, fontFamily: 'Inter_500Medium', maxWidth: 80 },
  podiumBal: { fontSize: 11, color: C.mutedForeground, fontFamily: 'Inter_400Regular' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 10 },
  rowMe: { backgroundColor: '#0A1A1F', borderRadius: 10, paddingHorizontal: 8 },
  rankNum: { width: 30, fontSize: 13, color: C.mutedForeground, fontFamily: 'Inter_500Medium' },
  name: { flex: 1, fontSize: 14, color: C.foreground, fontFamily: 'Inter_500Medium' },
  meBadge: { backgroundColor: C.primary + '22', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  meBadgeText: { fontSize: 10, color: C.primary, fontFamily: 'Inter_700Bold' },
  balance: { fontSize: 12, color: C.mutedForeground, fontFamily: 'Inter_500Medium' },
  balanceSub: { fontSize: 10, color: C.mutedForeground, fontFamily: 'Inter_400Regular', marginTop: 2 },
  empty: { alignItems: 'center', marginTop: 60, gap: 8 },
  emptyText: { fontSize: 15, color: C.mutedForeground, fontFamily: 'Inter_500Medium' },
});
