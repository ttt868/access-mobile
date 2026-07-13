import React from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useGetLeaderboard, getGetLeaderboardQueryKey } from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';
import colors from '@/constants/colors';

const C = colors.light;
const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const topPad = insets.top + (Platform.OS === 'web' ? 16 : 4);

  const { data, isLoading } = useGetLeaderboard({ query: { queryKey: getGetLeaderboardQueryKey() } });

  const entries = data?.entries ?? [];
  const totalMined = data?.totalMined ?? 0;
  const supplyPct = Math.min((totalMined / 250000) * 100, 100);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <Text style={styles.screenTitle}>Top Miners</Text>

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

      {/* Top 3 podium */}
      {entries.length >= 3 && (
        <View style={styles.podium}>
          <PodiumItem entry={entries[1]} colorIdx={1} size="sm" />
          <PodiumItem entry={entries[0]} colorIdx={0} size="lg" />
          <PodiumItem entry={entries[2]} colorIdx={2} size="sm" />
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
      ) : entries.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="users" size={36} color={C.mutedForeground} />
          <Text style={styles.emptyText}>No miners yet</Text>
        </View>
      ) : (
        <FlatList
          data={entries.slice(3)}
          keyExtractor={(item) => String(item.rank)}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 80 }}
          renderItem={({ item }) => {
            const isMe = item.username === user?.username;
            return (
              <View style={[styles.row, isMe && styles.rowMe]}>
                <Text style={styles.rankNum}>#{item.rank}</Text>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.username[0].toUpperCase()}</Text>
                </View>
                <Text style={[styles.name, isMe && { color: C.primary }]} numberOfLines={1}>{item.username}</Text>
                {isMe && <View style={styles.meBadge}><Text style={styles.meBadgeText}>YOU</Text></View>}
                <Text style={styles.balance}>{item.balance.toFixed(4)} ZRN</Text>
              </View>
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: C.border }} />}
        />
      )}
    </View>
  );
}

function PodiumItem({ entry, colorIdx, size }: { entry: any; colorIdx: number; size: 'sm' | 'lg' }) {
  const isLg = size === 'lg';
  return (
    <View style={[styles.podiumItem, isLg && { paddingBottom: 8 }]}>
      {isLg && <Feather name="award" size={18} color={RANK_COLORS[0]} style={{ marginBottom: 4 }} />}
      <View style={[styles.podiumAvatar, { borderColor: RANK_COLORS[colorIdx], width: isLg ? 60 : 46, height: isLg ? 60 : 46, borderRadius: isLg ? 30 : 23 }]}>
        <Text style={[styles.podiumAvatarText, { fontSize: isLg ? 22 : 16 }]}>{entry.username[0].toUpperCase()}</Text>
      </View>
      <Text style={[styles.podiumRank, { color: RANK_COLORS[colorIdx] }]}>#{entry.rank}</Text>
      <Text style={styles.podiumName} numberOfLines={1}>{entry.username}</Text>
      <Text style={styles.podiumBal}>{entry.balance.toFixed(2)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  screenTitle: { fontSize: 24, fontFamily: 'Inter_700Bold', color: C.foreground, paddingHorizontal: 20, paddingBottom: 12 },
  supplyBar: {
    marginHorizontal: 20, backgroundColor: C.card, borderRadius: 14,
    borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 14,
  },
  supplyTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  supplyLabel: { fontSize: 12, color: C.mutedForeground, fontFamily: 'Inter_500Medium' },
  supplyValue: { fontSize: 12, color: C.primary, fontFamily: 'Inter_600SemiBold' },
  progressBg: { height: 5, backgroundColor: C.secondary, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 5, backgroundColor: C.primary, borderRadius: 3 },
  podium: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end',
    marginHorizontal: 20, marginBottom: 14, gap: 8,
    backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 16,
  },
  podiumItem: { alignItems: 'center', flex: 1, gap: 4 },
  podiumAvatar: {
    backgroundColor: C.secondary, borderWidth: 2, borderColor: C.mutedForeground,
    alignItems: 'center', justifyContent: 'center',
  },
  podiumAvatarText: { color: C.foreground, fontFamily: 'Inter_700Bold' },
  podiumRank: { fontSize: 12, fontFamily: 'Inter_700Bold', color: C.mutedForeground },
  podiumName: { fontSize: 11, color: C.foreground, fontFamily: 'Inter_500Medium', maxWidth: 80 },
  podiumBal: { fontSize: 11, color: C.mutedForeground, fontFamily: 'Inter_400Regular' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 10 },
  rowMe: { backgroundColor: '#0A1A1F', borderRadius: 10, paddingHorizontal: 8 },
  rankNum: { width: 30, fontSize: 13, color: C.mutedForeground, fontFamily: 'Inter_500Medium' },
  avatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: C.secondary, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 13, color: C.foreground, fontFamily: 'Inter_600SemiBold' },
  name: { flex: 1, fontSize: 14, color: C.foreground, fontFamily: 'Inter_500Medium' },
  meBadge: { backgroundColor: C.primary + '22', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  meBadgeText: { fontSize: 10, color: C.primary, fontFamily: 'Inter_700Bold' },
  balance: { fontSize: 12, color: C.mutedForeground, fontFamily: 'Inter_500Medium' },
  empty: { alignItems: 'center', marginTop: 60, gap: 8 },
  emptyText: { fontSize: 15, color: C.mutedForeground, fontFamily: 'Inter_500Medium' },
});
