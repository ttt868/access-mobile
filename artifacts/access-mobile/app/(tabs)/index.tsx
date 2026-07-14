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
import { Feather } from '@expo/vector-icons';

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
  const glowAnim = useRef(new Animated.Value(0)).current;
  const ringScaleAnim = useRef(new Animated.Value(1)).current;

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
        Animated.sequence([
          Animated.timing(ringScaleAnim, { toValue: 1.05, duration: 150, useNativeDriver: true }),
          Animated.spring(ringScaleAnim, { toValue: 1, friction: 4, useNativeDriver: true })
        ]).start();
      },
    },
  });

  const claimMutation = useClaimMining({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetMiningStatusQueryKey() });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Animated.sequence([
          Animated.timing(ringScaleAnim, { toValue: 1.1, duration: 200, useNativeDriver: true }),
          Animated.spring(ringScaleAnim, { toValue: 1, friction: 5, useNativeDriver: true })
        ]).start();
      },
    },
  });

  useEffect(() => {
    if (status?.isClaimable) {
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])).start();
      Animated.loop(Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1200, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 1200, useNativeDriver: false }),
      ])).start();
    } else {
      pulseAnim.stopAnimation();
      glowAnim.stopAnimation();
      Animated.timing(pulseAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      Animated.timing(glowAnim, { toValue: 0, duration: 300, useNativeDriver: false }).start();
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

  const topPad = insets.top + (Platform.OS === 'web' ? 20 : 10);
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 100;

  if (isLoading) {
    return <View style={[styles.center, { backgroundColor: C.background }]}><ActivityIndicator color={C.primary} size="large" /></View>;
  }

  const handlePress = () => {
    if (!isActive) {
      startMutation.mutate();
    } else if (isClaimable) {
      claimMutation.mutate();
    }
  };

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={['#E5EEF9', '#F4F7FC', '#FFFFFF']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.container, { paddingTop: topPad, paddingBottom: bottomPad }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTextCol}>
            <Text style={styles.greeting}>Good to see you,</Text>
            <Text style={styles.username}>{user?.username ?? 'Miner'}</Text>
          </View>
          <View style={styles.statusBadgeWrapper}>
            <LinearGradient
              colors={isActive ? (isClaimable ? ['#10B981', '#059669'] : [C.primary, C.accent]) : ['#E2E8F0', '#CBD5E1']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.statusBadgeInner}
            >
              <View style={[styles.statusDot, !isActive && { backgroundColor: '#94A3B8' }]} />
              <Text style={[styles.statusText, !isActive && { color: '#475569' }]}>
                {isActive ? (isClaimable ? 'Ready to Claim' : 'Mining Active') : 'System Idle'}
              </Text>
            </LinearGradient>
          </View>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCardShadow}>
          <LinearGradient
            colors={['#FFFFFF', '#F8FAFC']}
            start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
            style={styles.balanceCard}
          >
            <View style={styles.balanceIconRing}>
              <Feather name="layers" size={20} color={C.primary} />
            </View>
            <Text style={styles.balanceLabel}>CURRENT BALANCE</Text>
            <Text style={styles.balanceValue}>{balance.toFixed(6)}</Text>
            <View style={styles.currencyPill}>
              <Text style={styles.currencyPillText}>ZRN</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Mine ring */}
        <View style={styles.btnArea}>
          {isClaimable && (
            <Animated.View style={[styles.btnGlow, { transform: [{ scale: pulseAnim }], opacity: glowAnim }]} />
          )}
          <Animated.View style={{ transform: [{ scale: ringScaleAnim }] }}>
            <CountdownRing
              size={240}
              strokeWidth={8}
              progress={isActive ? progress : 0}
              color={isClaimable ? C.success : C.primary}
            />
            <TouchableOpacity
              style={[styles.mineBtnShadow, isActive && !isClaimable && styles.mineBtnShadowLocked]}
              onPress={handlePress}
              disabled={startMutation.isPending || claimMutation.isPending || (isActive && !isClaimable)}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={
                  isActive && !isClaimable
                    ? ['#FFFFFF', '#F1F5F9']
                    : isClaimable
                      ? ['#10B981', '#059669']
                      : [C.primary, C.accent]
                }
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={[styles.mineBtnInner, isActive && !isClaimable && styles.mineBtnInnerLocked]}
              >
                {startMutation.isPending || claimMutation.isPending ? (
                  <ActivityIndicator color={isActive && !isClaimable ? C.primary : '#FFFFFF'} size="large" />
                ) : isActive && !isClaimable ? (
                  <>
                    <View style={styles.timerBox}>
                      <Text style={styles.mineBtnTimer}>{formatDuration(displayRemainingMs)}</Text>
                    </View>
                    <Text style={styles.mineBtnSubLocked}>UNTIL NEXT CLAIM</Text>
                  </>
                ) : (
                  <>
                    <Feather name={isClaimable ? "check" : "zap"} size={44} color="#FFFFFF" style={{ marginBottom: 4 }} />
                    <Text style={styles.mineBtnText}>{isClaimable ? 'CLAIM' : 'START'}</Text>
                    <Text style={styles.mineBtnSub}>{isClaimable ? `+${ratePerSession.toFixed(4)} ZRN` : '12H SESSION'}</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Info row */}
        <View style={styles.infoRow}>
          <View style={styles.infoCard}>
            <View style={styles.infoIconBg}><Feather name="trending-up" size={16} color={C.primary} /></View>
            <Text style={styles.infoLabel}>Base Rate</Text>
            <Text style={styles.infoValue}>{ratePerSession.toFixed(4)}</Text>
            <Text style={styles.infoCurrency}>ZRN/12h</Text>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.infoIconBg}><Feather name="users" size={16} color={C.accent} /></View>
            <Text style={styles.infoLabel}>Active Refs</Text>
            <Text style={styles.infoValue}>{status?.activeReferralCount ?? 0}</Text>
            <Text style={styles.infoCurrency}>+{((status?.activeReferralCount ?? 0) * 0.001).toFixed(3)} bonus</Text>
          </View>
        </View>

        {/* Supply progress */}
        <View style={styles.supplyCard}>
          <View style={styles.supplyRow}>
            <Text style={styles.supplyLabel}>Network Supply Mined</Text>
            <Text style={styles.supplyPct}>{supplyPct.toFixed(2)}%</Text>
          </View>
          <View style={styles.progressBg}>
            <LinearGradient
              colors={[C.primary, C.accent]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${supplyPct}%` as any }]}
            />
          </View>
          <Text style={styles.supplyNumbers}>
            <Text style={styles.supplyMined}>{totalMined.toFixed(2)}</Text>
            <Text style={styles.supplyTotal}> / 250,000 ZRN limit</Text>
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  container: { alignItems: 'center', paddingHorizontal: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    alignSelf: 'stretch', paddingBottom: 24,
  },
  headerTextCol: { flex: 1 },
  greeting: { fontSize: 14, color: C.mutedForeground, fontFamily: 'Inter_500Medium' },
  username: { fontSize: 26, color: C.foreground, fontFamily: 'Inter_700Bold', marginTop: 2, letterSpacing: -0.5 },
  statusBadgeWrapper: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
    borderRadius: 20,
  },
  statusBadgeInner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFFFFF' },
  statusText: { fontSize: 12, color: '#FFFFFF', fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5 },
  
  balanceCardShadow: {
    alignSelf: 'stretch', borderRadius: 28, marginBottom: 32,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.12, shadowRadius: 24, elevation: 12,
  },
  balanceCard: {
    borderRadius: 28, borderWidth: 1, borderColor: '#FFFFFF', padding: 28,
    alignItems: 'center', backgroundColor: '#FFFFFF',
  },
  balanceIconRing: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  balanceLabel: { fontSize: 11, color: C.mutedForeground, fontFamily: 'Inter_600SemiBold', letterSpacing: 2 },
  balanceValue: { fontSize: 46, color: C.foreground, fontFamily: 'Inter_800ExtraBold', marginTop: 4, letterSpacing: -1.5 },
  currencyPill: {
    marginTop: 12, backgroundColor: C.secondary, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: C.border,
  },
  currencyPillText: { fontSize: 12, color: C.primary, fontFamily: 'Inter_700Bold', letterSpacing: 1 },

  btnArea: { alignItems: 'center', justifyContent: 'center', width: 250, height: 250, marginBottom: 36, marginTop: 10 },
  btnGlow: {
    position: 'absolute', width: 230, height: 230, borderRadius: 115,
    backgroundColor: C.success,
  },
  mineBtnShadow: {
    width: 200, height: 200, borderRadius: 100,
    marginTop: 20, marginLeft: 20,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35, shadowRadius: 24, elevation: 15,
  },
  mineBtnShadowLocked: {
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 5,
  },
  mineBtnInner: {
    width: '100%', height: '100%', borderRadius: 100,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 4, borderColor: '#FFFFFF',
  },
  mineBtnInnerLocked: {
    borderColor: '#F8FAFC',
  },
  timerBox: {
    backgroundColor: '#F8FAFC', paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0',
  },
  mineBtnTimer: { fontSize: 24, fontFamily: 'Inter_700Bold', color: C.primary, letterSpacing: 1 },
  mineBtnText: { fontSize: 22, fontFamily: 'Inter_800ExtraBold', color: '#FFFFFF', letterSpacing: 3, marginTop: 2 },
  mineBtnSub: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: 'rgba(255,255,255,0.8)', marginTop: 4, letterSpacing: 0.5 },
  mineBtnSubLocked: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: C.mutedForeground, letterSpacing: 1 },

  infoRow: { flexDirection: 'row', gap: 16, alignSelf: 'stretch', marginBottom: 20 },
  infoCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 20,
    borderWidth: 1, borderColor: '#FFFFFF', padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04, shadowRadius: 12, elevation: 4,
  },
  infoIconBg: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  infoLabel: { fontSize: 12, color: C.mutedForeground, fontFamily: 'Inter_500Medium' },
  infoValue: { fontSize: 22, color: C.foreground, fontFamily: 'Inter_700Bold', marginTop: 4 },
  infoCurrency: { fontSize: 11, color: '#94A3B8', fontFamily: 'Inter_500Medium', marginTop: 2 },

  supplyCard: {
    alignSelf: 'stretch', backgroundColor: '#FFFFFF', borderRadius: 20,
    borderWidth: 1, borderColor: '#FFFFFF', padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04, shadowRadius: 12, elevation: 4,
  },
  supplyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  supplyLabel: { fontSize: 13, color: C.foreground, fontFamily: 'Inter_600SemiBold' },
  supplyPct: { fontSize: 13, color: C.primary, fontFamily: 'Inter_700Bold' },
  progressBg: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden', marginBottom: 12 },
  progressFill: { height: 8, borderRadius: 4 },
  supplyNumbers: { textAlign: 'center' },
  supplyMined: { fontSize: 14, color: C.foreground, fontFamily: 'Inter_700Bold' },
  supplyTotal: { fontSize: 12, color: C.mutedForeground, fontFamily: 'Inter_500Medium' },
});