import React from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
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
  const topPad = insets.top + (Platform.OS === 'web' ? 16 : 4);

  const { data: status } = useGetMiningStatus({ query: { queryKey: getGetMiningStatusQueryKey() } });
  const { data: txData, isLoading } = useGetTransactions({ query: { queryKey: getGetTransactionsQueryKey() } });

  const txs = txData?.transactions ?? [];

  return (
    <View style={[styles.container, { paddingTop: topPad + 12 }]}>
      <View style={styles.balanceCard}>
        <View style={styles.balanceRow}>
          <View>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceValue}>{(status?.balance ?? 0).toFixed(6)}</Text>
            <Text style={styles.currency}>ZRN Token</Text>
          </View>
          <View style={styles.iconCircle}>
            <Feather name="cpu" size={26} color={C.primary} />
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.balanceMetaRow}>
          <View style={styles.balanceMeta}>
            <Text style={styles.metaLabel}>Per Session</Text>
            <Text style={styles.metaValue}>{(status?.ratePerSession ?? 0.01).toFixed(4)} ZRN</Text>
          </View>
          <View style={styles.balanceMeta}>
            <Text style={styles.metaLabel}>Active Refs</Text>
            <Text style={styles.metaValue}>{status?.activeReferralCount ?? 0}</Text>
          </View>
          <View style={styles.balanceMeta}>
            <Text style={styles.metaLabel}>Ref Bonus</Text>
            <Text style={styles.metaValue}>+{(status?.bonusPerSession ?? 0).toFixed(4)} ZRN</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Transaction History</Text>

      {isLoading ? (
        <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
      ) : txs.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="inbox" size={36} color={C.mutedForeground} />
          <Text style={styles.emptyText}>No transactions yet</Text>
          <Text style={styles.emptyHint}>Start mining to earn ZRN tokens</Text>
        </View>
      ) : (
        <FlatList
          data={txs}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 80 }}
          renderItem={({ item }) => (
            <View style={styles.txRow}>
              <View style={[styles.txIcon, item.type !== 'mine' && styles.txIconRef]}>
                <Feather name={item.type === 'mine' ? 'zap' : 'users'} size={16} color={item.type === 'mine' ? C.success : C.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.txType}>{TX_LABELS[item.type] ?? item.type}</Text>
                <Text style={styles.txDate}>{new Date(item.createdAt).toLocaleString()}</Text>
              </View>
              <Text style={[styles.txAmount, item.type !== 'mine' && { color: C.accent }]}>+{item.amount.toFixed(6)} ZRN</Text>
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
  balanceCard: {
    marginHorizontal: 20, backgroundColor: C.card, borderRadius: 20,
    borderWidth: 1, borderColor: C.border, padding: 18, marginBottom: 22,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 14, elevation: 5,
  },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceLabel: { fontSize: 12, color: C.mutedForeground, fontFamily: 'Inter_400Regular' },
  balanceValue: { fontSize: 34, color: C.primary, fontFamily: 'Inter_700Bold', marginTop: 2 },
  currency: { fontSize: 12, color: C.mutedForeground, fontFamily: 'Inter_500Medium', marginTop: 2 },
  iconCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: C.secondary, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 14 },
  balanceMetaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  balanceMeta: { alignItems: 'center' },
  metaLabel: { fontSize: 10, color: C.mutedForeground, fontFamily: 'Inter_400Regular', textTransform: 'uppercase', letterSpacing: 0.5 },
  metaValue: { fontSize: 13, color: C.foreground, fontFamily: 'Inter_600SemiBold', marginTop: 2 },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: C.foreground, paddingHorizontal: 20, marginBottom: 10 },
  empty: { alignItems: 'center', marginTop: 60, gap: 8 },
  emptyText: { fontSize: 15, color: C.mutedForeground, fontFamily: 'Inter_500Medium' },
  emptyHint: { fontSize: 12, color: C.mutedForeground, fontFamily: 'Inter_400Regular' },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, gap: 12 },
  txIcon: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#061A12', borderWidth: 1, borderColor: C.success + '30',
    alignItems: 'center', justifyContent: 'center',
  },
  txIconRef: { backgroundColor: '#100A1F', borderColor: C.accent + '30' },
  txType: { fontSize: 14, color: C.foreground, fontFamily: 'Inter_500Medium' },
  txDate: { fontSize: 11, color: C.mutedForeground, fontFamily: 'Inter_400Regular', marginTop: 2 },
  txAmount: { fontSize: 14, color: C.success, fontFamily: 'Inter_600SemiBold' },
});
