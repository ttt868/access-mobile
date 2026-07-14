import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, Platform, Image, Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useGetLeaderboard, getGetLeaderboardQueryKey,
  useGetTopReferrers, getGetTopReferrersQueryKey,
} from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';
import colors from '@/constants/colors';

const C = colors.light;
const RANK_COLORS = ['#FBBF24', '#94A3B8', '#D97706']; // Gold, Silver, Bronze

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
  const topPad = insets.top + (Platform.OS === 'web' ? 24 : 10);
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
    <View style={styles.wrapper}>
      <LinearGradient
        colors={['#E5EEF9', '#F4F7FC', '#FFFFFF']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.container, { paddingTop: topPad }]}>
        <Text style={styles.screenTitle}>Leaderboard</Text>

        {/* Supply bar */}
        <View style={styles.supplyBarShadow}>
          <View style={styles.supplyBar}>
            <View style={styles.supplyTopRow}>
              <Text style={styles.supplyLabel}>ZRN Circulating Supply</Text>
              <Text style={styles.supplyValue}>{totalMined.toFixed(2)} / 250,000</Text>
            </View>
            <View style={styles.progressBg}>
              <LinearGradient
                colors={[C.primary, C.accent]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${supplyPct}%` as any }]}
              />
            </View>
          </View>
        </View>

        {/* Tab switch */}
        <View style={styles.tabSwitchShadow}>
          <View style={styles.tabSwitch}>
            <Pressable
              style={[styles.tabBtn, isMiners && styles.tabBtnActive]}
              onPress={() => setTab('miners')}
            >
              <Feather name="zap" size={16} color={isMiners ? '#FFF' : C.mutedForeground} />
              <Text style={[styles.tabBtnText, isMiners && styles.tabBtnTextActive]}>Top Miners</Text>
            </Pressable>
            <Pressable
              style={[styles.tabBtn, !isMiners && styles.tabBtnActive]}
              onPress={() => setTab('referrers')}
            >
              <Feather name="users" size={16} color={!isMiners ? '#FFF' : C.mutedForeground} />
              <Text style={[styles.tabBtnText, !isMiners && styles.tabBtnTextActive]}>Top Referrers</Text>
            </Pressable>
          </View>
        </View>

        {/* Top 3 podium */}
        {activeEntries.length >= 3 && (
          <View style={styles.podiumWrapper}>
            <LinearGradient
              colors={['#FFFFFF', '#F8FAFC']}
              start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
              style={styles.podium}
            >
              <PodiumItem entry={activeEntries[1]} colorIdx={1} size="sm" mode={tab} />
              <PodiumItem entry={activeEntries[0]} colorIdx={0} size="lg" mode={tab} />
              <PodiumItem entry={activeEntries[2]} colorIdx={2} size="sm" mode={tab} />
            </LinearGradient>
          </View>
        )}

        {activeLoading ? (
          <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
        ) : activeEntries.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIconCircle}>
              <Feather name={isMiners ? 'users' : 'user-plus'} size={32} color={C.primary} />
            </View>
            <Text style={styles.emptyText}>{isMiners ? 'No miners yet' : 'No referrers yet'}</Text>
          </View>
        ) : (
          <FlatList
            data={activeEntries.slice(3)}
            keyExtractor={(item) => String(item.rank)}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 100 }}
            renderItem={({ item }) => {
              const isMe = item.username === user?.username;
              return (
                <View style={[styles.row, isMe && styles.rowMe]}>
                  <Text style={styles.rankNum}>#{item.rank}</Text>
                  <View style={styles.avatarRingSm}>
                    <Avatar avatarUrl={item.avatarUrl} username={item.username} size={36} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.name, isMe && { color: C.primary }]} numberOfLines={1}>{item.username}</Text>
                      {isMe && <View style={styles.meBadge}><Text style={styles.meBadgeText}>YOU</Text></View>}
                    </View>
                    {!isMiners && <Text style={styles.balanceSub}>{item.referralCount} referrals</Text>}
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.balance}>{isMiners ? item.balance.toFixed(4) : item.referralEarnings.toFixed(4)}</Text>
                    <Text style={styles.balanceCurrency}>ZRN</Text>
                  </View>
                </View>
              );
            }}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

function PodiumItem({ entry, colorIdx, size, mode }: { entry: any; colorIdx: number; size: 'sm' | 'lg'; mode: Tab }) {
  const isLg = size === 'lg';
  const avatarSize = isLg ? 68 : 52;
  const glowColor = RANK_COLORS[colorIdx];

  return (
    <View style={[styles.podiumItem, isLg && { paddingBottom: 16 }]}>
      {isLg && <Feather name="award" size={24} color={glowColor} style={{ marginBottom: 8 }} />}
      <View style={[
        styles.podiumAvatarOuterRing,
        { borderColor: glowColor, shadowColor: glowColor }
      ]}>
        <View style={styles.podiumAvatarInnerRing}>
          <Avatar avatarUrl={entry.avatarUrl} username={entry.username} size={avatarSize} />
        </View>
      </View>
      <View style={[styles.podiumRankBadge, { backgroundColor: glowColor + '1A', borderColor: glowColor }]}>
        <Text style={[styles.podiumRank, { color: glowColor }]}>#{entry.rank}</Text>
      </View>
      <Text style={styles.podiumName} numberOfLines={1}>{entry.username}</Text>
      <View style={styles.podiumBalBox}>
        <Text style={styles.podiumBal}>{mode === 'miners' ? entry.balance.toFixed(2) : entry.referralEarnings.toFixed(2)}</Text>
        <Text style={styles.podiumBalLabel}>ZRN</Text>
      </View>
      {!isLg && mode === 'referrers' && <Text style={styles.podiumSub}>{entry.referralCount} refs</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  container: { flex: 1 },
  screenTitle: { fontSize: 28, fontFamily: 'Inter_800ExtraBold', color: C.foreground, paddingHorizontal: 20, paddingBottom: 16, letterSpacing: -0.5 },
  
  supplyBarShadow: {
    marginHorizontal: 20, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 3,
    borderRadius: 20,
  },
  supplyBar: {
    backgroundColor: '#FFFFFF', borderRadius: 20,
    borderWidth: 1, borderColor: '#FFFFFF', padding: 18,
  },
  supplyTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  supplyLabel: { fontSize: 13, color: C.mutedForeground, fontFamily: 'Inter_600SemiBold' },
  supplyValue: { fontSize: 13, color: C.primary, fontFamily: 'Inter_700Bold' },
  progressBg: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  
  tabSwitchShadow: {
    marginHorizontal: 20, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    borderRadius: 16,
  },
  tabSwitch: {
    flexDirection: 'row', backgroundColor: '#FFFFFF',
    borderRadius: 16, borderWidth: 1, borderColor: '#FFFFFF', padding: 6, gap: 6,
  },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, borderRadius: 12,
  },
  tabBtnActive: { backgroundColor: C.primary, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  tabBtnText: { fontSize: 14, color: C.mutedForeground, fontFamily: 'Inter_600SemiBold' },
  tabBtnTextActive: { color: '#FFF', fontFamily: 'Inter_700Bold' },
  
  podiumWrapper: {
    marginHorizontal: 20, marginBottom: 24,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.1, shadowRadius: 24, elevation: 8,
    borderRadius: 28,
  },
  podium: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end',
    borderRadius: 28, borderWidth: 1, borderColor: '#FFFFFF', padding: 24, gap: 12,
  },
  podiumItem: { alignItems: 'center', flex: 1, gap: 6 },
  podiumAvatarOuterRing: {
    borderWidth: 2, borderRadius: 50, padding: 3, backgroundColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  podiumAvatarInnerRing: {
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 50, overflow: 'hidden',
  },
  avatarFallback: {
    backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center',
  },
  avatarFallbackText: { color: C.primary, fontFamily: 'Inter_800ExtraBold' },
  podiumRankBadge: {
    marginTop: -16, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
    borderWidth: 1, backgroundColor: '#FFFFFF', zIndex: 10,
  },
  podiumRank: { fontSize: 13, fontFamily: 'Inter_800ExtraBold' },
  podiumName: { fontSize: 13, color: C.foreground, fontFamily: 'Inter_700Bold', maxWidth: 80, marginTop: 4 },
  podiumBalBox: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  podiumBal: { fontSize: 14, color: C.foreground, fontFamily: 'Inter_800ExtraBold' },
  podiumBalLabel: { fontSize: 10, color: C.mutedForeground, fontFamily: 'Inter_700Bold' },
  podiumSub: { fontSize: 11, color: C.mutedForeground, fontFamily: 'Inter_500Medium' },
  
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, backgroundColor: '#FFFFFF', borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1, borderWidth: 1, borderColor: '#FFFFFF' },
  rowMe: { backgroundColor: '#F0F9FF', borderColor: '#E0F2FE' },
  rankNum: { width: 28, fontSize: 14, color: C.mutedForeground, fontFamily: 'Inter_700Bold' },
  avatarRingSm: {
    padding: 2, borderRadius: 22, backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#E2E8F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  name: { fontSize: 15, color: C.foreground, fontFamily: 'Inter_700Bold', maxWidth: '80%' },
  meBadge: { backgroundColor: C.primary, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  meBadgeText: { fontSize: 10, color: '#FFF', fontFamily: 'Inter_800ExtraBold' },
  balance: { fontSize: 15, color: C.foreground, fontFamily: 'Inter_800ExtraBold' },
  balanceCurrency: { fontSize: 10, color: C.mutedForeground, fontFamily: 'Inter_600SemiBold', textAlign: 'right' },
  balanceSub: { fontSize: 12, color: C.mutedForeground, fontFamily: 'Inter_500Medium', marginTop: 2 },
  
  empty: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: C.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 4 },
  emptyText: { fontSize: 16, color: C.foreground, fontFamily: 'Inter_600SemiBold' },
});