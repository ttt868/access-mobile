import React from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useGetTransactions, getGetTransactionsQueryKey,
  useGetMiningStatus, getGetMiningStatusQueryKey,
} from '@workspace/api-client-react';
import colors from '@/constants/colors';

const C = colors.light;

const TX_LABELS: Record<string, string> = {
  mine: 'Mining Reward',
  referral_signup: 'Referral Signup Bonus',
  referral: 'Referral Bonus',
};

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const topPad = insets.top + (Platform.OS === 'web' ? 24 : 10);

  const { data: status } = useGetMiningStatus({ query: { queryKey: getGetMiningStatusQueryKey() } });
  const { data: txData, isLoading } = useGetTransactions({ query: { queryKey: getGetTransactionsQueryKey() } });

  const txs = txData?.transactions ?? [];

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={['#E5EEF9', '#F4F7FC', '#FFFFFF']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.container, { paddingTop: topPad }]}>
        <Text style={styles.screenTitle}>Wallet</Text>

        <View style={styles.balanceCardShadow}>
          <LinearGradient
            colors={['#FFFFFF', '#F8FAFC']}
            start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
            style={styles.balanceCard}
          >
            <View style={styles.balanceRow}>
              <View>
                <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
                <Text style={styles.balanceValue}>{(status?.balance ?? 0).toFixed(6)}</Text>
                <View style={styles.currencyPill}>
                  <Text style={styles.currencyPillText}>ZRN Token</Text>
                </View>
              </View>
              <View style={styles.iconCircle}>
                <LinearGradient
                  colors={[C.primary, C.accent]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.iconCircleInner}
                >
                  <Feather name="layers" size={28} color="#FFF" />
                </LinearGradient>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.balanceMetaRow}>
              <View style={styles.balanceMeta}>
                <Text style={styles.metaLabel}>Base Rate</Text>
                <Text style={styles.metaValue}>{(status?.ratePerSession ?? 0.01).toFixed(4)}</Text>
              </View>
              <View style={styles.balanceMeta}>
                <Text style={styles.metaLabel}>Active Refs</Text>
                <Text style={styles.metaValue}>{status?.activeReferralCount ?? 0}</Text>
              </View>
              <View style={styles.balanceMeta}>
                <Text style={styles.metaLabel}>Ref Bonus</Text>
                <Text style={styles.metaValue}>+{(status?.bonusPerSession ?? 0).toFixed(4)}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        <Text style={styles.sectionTitle}>Transaction History</Text>

        {isLoading ? (
          <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
        ) : txs.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIconCircle}>
              <Feather name="inbox" size={32} color={C.primary} />
            </View>
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptyHint}>Start mining to earn ZRN tokens</Text>
          </View>
        ) : (
          <FlatList
            data={txs}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 100 }}
            renderItem={({ item }) => (
              <View style={styles.txRow}>
                <View style={[styles.txIcon, item.type !== 'mine' && styles.txIconRef]}>
                  <Feather name={item.type === 'mine' ? 'zap' : 'users'} size={18} color={item.type === 'mine' ? '#10B981' : C.accent} />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={styles.txType}>{TX_LABELS[item.type] ?? item.type}</Text>
                  <Text style={styles.txDate}>{new Date(item.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                <Text style={[styles.txAmount, item.type !== 'mine' && { color: C.accent }]}>+{item.amount.toFixed(4)} ZRN</Text>
              </View>
            )}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
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
  
  balanceCardShadow: {
    marginHorizontal: 20, marginBottom: 28,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12, shadowRadius: 24, elevation: 10,
    borderRadius: 28,
  },
  balanceCard: {
    borderRadius: 28, borderWidth: 1, borderColor: '#FFFFFF', padding: 24,
  },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  balanceLabel: { fontSize: 12, color: C.mutedForeground, fontFamily: 'Inter_600SemiBold', letterSpacing: 1 },
  balanceValue: { fontSize: 38, color: C.foreground, fontFamily: 'Inter_800ExtraBold', marginTop: 4, letterSpacing: -1 },
  currencyPill: {
    marginTop: 8, backgroundColor: '#F1F5F9', borderRadius: 10, alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: C.border,
  },
  currencyPillText: { fontSize: 11, color: C.primary, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  iconCircle: {
    shadowColor: C.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 6,
    borderRadius: 28,
  },
  iconCircleInner: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#FFFFFF',
  },
  
  divider: { height: 1, backgroundColor: C.border, marginVertical: 20 },
  balanceMetaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  balanceMeta: { alignItems: 'center', flex: 1 },
  metaLabel: { fontSize: 11, color: C.mutedForeground, fontFamily: 'Inter_500Medium', marginBottom: 4 },
  metaValue: { fontSize: 15, color: C.foreground, fontFamily: 'Inter_700Bold' },
  
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: C.foreground, paddingHorizontal: 20, marginBottom: 12 },
  
  empty: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: C.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 4 },
  emptyText: { fontSize: 16, color: C.foreground, fontFamily: 'Inter_600SemiBold' },
  emptyHint: { fontSize: 13, color: C.mutedForeground, fontFamily: 'Inter_400Regular' },
  
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, backgroundColor: '#FFFFFF', borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1, borderWidth: 1, borderColor: '#FFFFFF' },
  txIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0',
    alignItems: 'center', justifyContent: 'center',
  },
  txIconRef: { backgroundColor: '#F3E8FF', borderColor: '#D8B4FE' },
  txType: { fontSize: 15, color: C.foreground, fontFamily: 'Inter_700Bold' },
  txDate: { fontSize: 12, color: C.mutedForeground, fontFamily: 'Inter_500Medium', marginTop: 4 },
  txAmount: { fontSize: 15, color: '#10B981', fontFamily: 'Inter_800ExtraBold' },
});