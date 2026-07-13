import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Animated, ScrollView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetMiningStatus, useStartMining, useClaimMining,
  getGetMiningStatusQueryKey,
} from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';
import { CountdownRing } from '@/components/CountdownRing';
import colors from '@/constants/colors';

const C = colors.light;
const TOTAL_SUPPLY = 250000;

function formatDuration(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
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

  // clockOffsetMs = serverTime - deviceTime. Recomputed on every server response
  // so the on-screen countdown tracks the SERVER clock, not the device clock —
  // changing the phone's date/time has no effect on it. The claim is also
  // re-validated server-side regardless of what the UI shows.
  const clockOffsetRef = useRef(0);
  const [displayRemainingMs, setDisplayRemainingMs] = useState(0);

  const { data: status, isLoading } = useGetMiningStatus({
    query: { queryKey: getGetMiningStatusQueryKey(), refetchInterval: 15000 },
  });

  useEffect(() => {
    if (!status) return;
    clockOffsetRef.current = new Date(status.serverNow).getTime() - Date.now();
    setDisplayRemainingMs(status.remainingMs);
  }, [status?.serverNow, status?.remainingMs]);

  useEffect(() => {
    if (!status?.isActive || status.isClaimable) return;
    const startedAtMs = status.startedAt ? new Date(status.startedAt).getTime() : 0;
    const id = setInterval(() => {
      const serverNow = Date.now() + clockOffsetRef.current;
      const remaining = Math.max(0, startedAtMs + status.sessionDurationMs - serverNow);
      setDisplayRemainingMs(remaining);
    }, 1000);
    return () => clearInterval(id);
  }, [status?.isActive, status?.isClaimable, status?.startedAt, status?.sessionDurationMs]);

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
    if (status?.isClaimable) {
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])).start();
      Animated.loop(Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.9, duration: 900, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 900, useNativeDriver: false }),
      ])).start();
    } else {
      pulseAnim.stopAnimation();
      glowAnim.stopAnimation();
      Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      Animated.timing(glowAnim, { toValue: 0.3, duration: 200, useNativeDriver: false }).start();
    }
  }, [status?.isClaimable]);

  const totalMined = status?.totalMined ?? 0;
  const supplyPct = Math.min((totalMined / TOTAL_SUPPLY) * 100, 100);
  const ratePerSession = status?.ratePerSession ?? 0.01;
  const balance = status?.balance ?? 0;
  const sessionDurationMs = status?.sessionDurationMs ?? 12 * 60 * 60 * 1000;
  const progress = status?.isActive ? 1 - displayRemainingMs / sessionDurationMs : 0;
  const isClaimable = !!status?.isClaimable;
  const isActive = !!status?.isActive;

  const topPad = insets.top + (Platform.OS === 'web' ? 16 : 4);

  if (isLoading) {
    return <View style={[styles.center, { backgroundColor: C.background }]}><ActivityIndicator color={C.primary} size="large" /></View>;
  }

  const handlePress = () => {
    if (!isActive) {
      startMutation.mutate();
    } else if (isClaimable) {
      claimMutation.mutate();
    }
    // While active and not yet claimable: intentionally a no-op.
    // The session can only be unlocked server-side once the 12h window elapses.
  };

  return (
    <ScrollView style={{ backgroundColor: C.background }} contentContainerStyle={[styles.container, { paddingTop: topPad, paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 80 }]}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back</Text>
          <Text style={styles.username}>{user?.username ?? '—'}</Text>
        </View>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: isActive ? (isClaimable ? C.success : C.warning) : C.mutedForeground }]} />
          <Text style={styles.statusText}>{isActive ? (isClaimable ? 'Ready' : 'Mining') : 'Idle'}</Text>
        </View>
      </View>

      {/* Balance */}
      <LinearGradient
        colors={[C.card, '#0F1B30']}
        style={styles.balanceCard}
      >
        <Text style={styles.balanceLabel}>BALANCE</Text>
        <Text style={styles.balanceValue}>{balance.toFixed(6)}</Text>
        <Text style={styles.balanceCurrency}>ZRN</Text>
      </LinearGradient>

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
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Duration</Text>
          <Text style={[styles.infoValue, { fontSize: 16 }]}>12h</Text>
          <Text style={styles.infoCurrency}>per session</Text>
        </View>
      </View>

      {/* Mine ring */}
      <View style={styles.btnArea}>
        <Animated.View style={[styles.btnGlow, { transform: [{ scale: pulseAnim }], opacity: isClaimable ? glowAnim : 0.12 }]} />
        <CountdownRing
          size={190}
          strokeWidth={6}
          progress={isActive ? progress : 0}
          color={isClaimable ? C.success : C.primary}
        />
        <TouchableOpacity
          style={[
            styles.mineBtn,
            isActive && !isClaimable && styles.mineBtnLocked,
            isClaimable && styles.mineBtnActive,
          ]}
          onPress={handlePress}
          disabled={startMutation.isPending || claimMutation.isPending || (isActive && !isClaimable)}
          activeOpacity={0.85}
        >
          {startMutation.isPending || claimMutation.isPending ? (
            <ActivityIndicator color={C.primaryForeground} size="large" />
          ) : isActive && !isClaimable ? (
            <>
              <Text style={styles.mineBtnTimer}>{formatDuration(displayRemainingMs)}</Text>
              <Text style={styles.mineBtnSub}>mining · server-timed</Text>
            </>
          ) : (
            <>
              <Text style={[styles.mineBtnIcon, isClaimable && { color: C.success }]}>⬡</Text>
              <Text style={styles.mineBtnText}>{isClaimable ? 'CLAIM' : 'MINE'}</Text>
              <Text style={styles.mineBtnSub}>{isClaimable ? `+${ratePerSession.toFixed(4)} ZRN` : '12h session'}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.hint}>
        {isClaimable
          ? 'Session complete — tap CLAIM to collect your ZRN'
          : isActive
          ? 'Mining runs on our servers — this keeps counting down even if you close the app or change your clock'
          : 'Tap MINE to start a new 12-hour session'}
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
    alignSelf: 'stretch', borderRadius: 20,
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
  infoRow: { flexDirection: 'row', gap: 10, alignSelf: 'stretch', marginBottom: 28 },
  infoCard: {
    flex: 1, backgroundColor: C.card, borderRadius: 14,
    borderWidth: 1, borderColor: C.border, padding: 12, alignItems: 'center',
  },
  infoLabel: { fontSize: 10, color: C.mutedForeground, fontFamily: 'Inter_500Medium', letterSpacing: 0.5, textTransform: 'uppercase' },
  infoValue: { fontSize: 20, color: C.foreground, fontFamily: 'Inter_700Bold', marginTop: 4 },
  infoCurrency: { fontSize: 11, color: C.primary, fontFamily: 'Inter_500Medium', marginTop: 2 },
  btnArea: { alignItems: 'center', justifyContent: 'center', width: 210, height: 210, marginBottom: 18 },
  btnGlow: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    backgroundColor: C.primary,
  },
  mineBtn: {
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: C.secondary, borderWidth: 3, borderColor: C.primary,
    alignItems: 'center', justifyContent: 'center', gap: 2,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7, shadowRadius: 20, elevation: 14,
  },
  mineBtnLocked: { backgroundColor: '#0D1525', borderColor: C.warning, shadowColor: C.warning, shadowOpacity: 0.3 },
  mineBtnActive: { backgroundColor: '#071510', borderColor: C.success, shadowColor: C.success },
  mineBtnIcon: { fontSize: 32, color: C.primary },
  mineBtnText: { fontSize: 17, fontFamily: 'Inter_700Bold', color: C.foreground, letterSpacing: 3 },
  mineBtnTimer: { fontSize: 20, fontFamily: 'Inter_700Bold', color: C.warning, letterSpacing: 1 },
  mineBtnSub: { fontSize: 11, fontFamily: 'Inter_500Medium', color: C.mutedForeground, marginTop: 2 },
  hint: { fontSize: 12, color: C.mutedForeground, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingHorizontal: 30 },
});
