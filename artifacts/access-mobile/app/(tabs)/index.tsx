import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Animated, ScrollView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetMiningStatus, useStartMining, useClaimMining,
  getGetMiningStatusQueryKey,
} from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';
import colors from '@/constants/colors';

const C = colors.light;
const TOTAL_SUPPLY = 250000;

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export default function MineScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const qc = useQueryClient();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  const [elapsed, setElapsed] = useState(0);

  const { data: status, isLoading } = useGetMiningStatus({
    query: { queryKey: getGetMiningStatusQueryKey(), refetchInterval: 30000 },
  });

  const startMutation = useStartMining({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetMiningStatusQueryKey() });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      },
    },
  });

  const claimMutation = useClaimMining({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetMiningStatusQueryKey() });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      },
    },
  });

  useEffect(() => {
    if (!status?.isActive || !status.startedAt) { setElapsed(0); return; }
    const update = () => setElapsed(Date.now() - new Date(status.startedAt!).getTime());
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [status?.isActive, status?.startedAt]);

  useEffect(() => {
    if (status?.isActive) {
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])).start();
      Animated.loop(Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.9, duration: 1000, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 1000, useNativeDriver: false }),
      ])).start();
    } else {
      pulseAnim.stopAnimation();
      glowAnim.stopAnimation();
      Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      Animated.timing(glowAnim, { toValue: 0.3, duration: 200, useNativeDriver: false }).start();
    }
  }, [status?.isActive]);

  const totalMined = status?.totalMined ?? 0;
  const supplyPct = Math.min((totalMined / TOTAL_SUPPLY) * 100, 100);
  const ratePerSession = status?.ratePerSession ?? 0.01;
  const balance = status?.balance ?? 0;

  const topPad = insets.top + (Platform.OS === 'web' ? 16 : 4);

  if (isLoading) {
    return <View style={[styles.center, { backgroundColor: C.background }]}><ActivityIndicator color={C.primary} size="large" /></View>;
  }

  return (
    <ScrollView style={{ backgroundColor: C.background }} contentContainerStyle={[styles.container, { paddingTop: topPad, paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 80 }]}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back</Text>
          <Text style={styles.username}>{user?.username ?? '—'}</Text>
        </View>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: status?.isActive ? C.success : C.mutedForeground }]} />
          <Text style={styles.statusText}>{status?.isActive ? 'Mining' : 'Idle'}</Text>
        </View>
      </View>

      {/* Balance */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>BALANCE</Text>
        <Text style={styles.balanceValue}>{balance.toFixed(6)}</Text>
        <Text style={styles.balanceCurrency}>ZRN</Text>
      </View>

      {/* Supply progress */}
      <View style={styles.supplyCard}>
        <View style={styles.supplyRow}>
          <Text style={styles.supplyLabel}>Total Supply</Text>
          <Text style={styles.supplyNumbers}>
            <Text style={styles.supplyMined}>{totalMined.toFixed(2)}</Text>
            <Text style={styles.supplyTotal}> / 250,000 ZRN</Text>
          </Text>
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${supplyPct}%` as any }]} />
        </View>
        <Text style={styles.supplyPct}>{supplyPct.toFixed(4)}% mined</Text>
      </View>

      {/* Session info */}
      <View style={styles.infoRow}>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Per Session</Text>
          <Text style={styles.infoValue}>{ratePerSession.toFixed(4)}</Text>
          <Text style={styles.infoCurrency}>ZRN</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Active Refs</Text>
          <Text style={styles.infoValue}>{status?.activeReferralCount ?? 0}</Text>
          <Text style={styles.infoCurrency}>+{((status?.activeReferralCount ?? 0) * 0.001).toFixed(3)} ZRN</Text>
        </View>
        {status?.isActive && (
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Session Time</Text>
            <Text style={[styles.infoValue, { fontSize: 16 }]}>{formatTime(elapsed)}</Text>
            <Text style={styles.infoCurrency}>running</Text>
          </View>
        )}
      </View>

      {/* Mine button */}
      <View style={styles.btnArea}>
        <Animated.View style={[styles.btnGlow, { transform: [{ scale: pulseAnim }], opacity: glowAnim }]} />
        <TouchableOpacity
          style={[styles.mineBtn, status?.isActive && styles.mineBtnActive]}
          onPress={() => {
            if (status?.isActive) claimMutation.mutate();
            else startMutation.mutate();
          }}
          disabled={startMutation.isPending || claimMutation.isPending}
          activeOpacity={0.85}
        >
          {startMutation.isPending || claimMutation.isPending ? (
            <ActivityIndicator color={C.primaryForeground} size="large" />
          ) : (
            <>
              <Text style={[styles.mineBtnIcon, status?.isActive && { color: C.success }]}>⬡</Text>
              <Text style={styles.mineBtnText}>{status?.isActive ? 'CLAIM' : 'MINE'}</Text>
              <Text style={styles.mineBtnSub}>{status?.isActive ? `+${ratePerSession.toFixed(4)} ZRN` : 'Tap to start'}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.hint}>
        {status?.isActive
          ? 'Mining is active — tap CLAIM to collect your ZRN'
          : 'Tap MINE to start a new mining session'}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingHorizontal: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    alignSelf: 'stretch', paddingBottom: 16,
  },
  greeting: { fontSize: 13, color: C.mutedForeground, fontFamily: 'Inter_400Regular' },
  username: { fontSize: 22, color: C.foreground, fontFamily: 'Inter_700Bold', marginTop: 2 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.secondary, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: C.border,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, color: C.mutedForeground, fontFamily: 'Inter_500Medium' },
  balanceCard: {
    alignSelf: 'stretch', backgroundColor: C.card, borderRadius: 20,
    borderWidth: 1, borderColor: C.border, padding: 20,
    alignItems: 'center', marginBottom: 12,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 16, elevation: 6,
  },
  balanceLabel: { fontSize: 11, color: C.mutedForeground, fontFamily: 'Inter_500Medium', letterSpacing: 2 },
  balanceValue: { fontSize: 44, color: C.primary, fontFamily: 'Inter_700Bold', marginTop: 4, letterSpacing: -1 },
  balanceCurrency: { fontSize: 16, color: C.mutedForeground, fontFamily: 'Inter_600SemiBold', letterSpacing: 3, marginTop: 2 },
  supplyCard: {
    alignSelf: 'stretch', backgroundColor: C.card, borderRadius: 16,
    borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 12,
  },
  supplyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  supplyLabel: { fontSize: 12, color: C.mutedForeground, fontFamily: 'Inter_500Medium', letterSpacing: 0.5 },
  supplyNumbers: {},
  supplyMined: { fontSize: 13, color: C.primary, fontFamily: 'Inter_600SemiBold' },
  supplyTotal: { fontSize: 12, color: C.mutedForeground, fontFamily: 'Inter_400Regular' },
  progressBg: { height: 6, backgroundColor: C.secondary, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: C.primary, borderRadius: 3 },
  supplyPct: { fontSize: 11, color: C.mutedForeground, fontFamily: 'Inter_400Regular', marginTop: 6, textAlign: 'right' },
  infoRow: { flexDirection: 'row', gap: 10, alignSelf: 'stretch', marginBottom: 24 },
  infoCard: {
    flex: 1, backgroundColor: C.card, borderRadius: 14,
    borderWidth: 1, borderColor: C.border, padding: 12, alignItems: 'center',
  },
  infoLabel: { fontSize: 10, color: C.mutedForeground, fontFamily: 'Inter_500Medium', letterSpacing: 0.5, textTransform: 'uppercase' },
  infoValue: { fontSize: 20, color: C.foreground, fontFamily: 'Inter_700Bold', marginTop: 4 },
  infoCurrency: { fontSize: 11, color: C.primary, fontFamily: 'Inter_500Medium', marginTop: 2 },
  btnArea: { alignItems: 'center', justifyContent: 'center', width: 170, height: 170, marginBottom: 16 },
  btnGlow: {
    position: 'absolute', width: 190, height: 190, borderRadius: 95,
    backgroundColor: C.primary,
  },
  mineBtn: {
    width: 150, height: 150, borderRadius: 75,
    backgroundColor: C.secondary, borderWidth: 3, borderColor: C.primary,
    alignItems: 'center', justifyContent: 'center', gap: 2,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7, shadowRadius: 20, elevation: 14,
  },
  mineBtnActive: { backgroundColor: '#071510', borderColor: C.success, shadowColor: C.success },
  mineBtnIcon: { fontSize: 32, color: C.primary },
  mineBtnText: { fontSize: 17, fontFamily: 'Inter_700Bold', color: C.foreground, letterSpacing: 3 },
  mineBtnSub: { fontSize: 11, fontFamily: 'Inter_500Medium', color: C.mutedForeground },
  hint: { fontSize: 12, color: C.mutedForeground, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingHorizontal: 40 },
});
