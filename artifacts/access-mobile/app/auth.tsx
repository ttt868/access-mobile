import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useRegister, useLogin } from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';
import colors from '@/constants/colors';

const C = colors.light;

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');

  const registerMutation = useRegister({
    mutation: {
      onSuccess: async (data) => {
        await login(data.token, data.user);
        router.replace('/(tabs)');
      },
      onError: (e: any) => {
        setError(e?.response?.data?.error ?? 'Registration failed');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      },
    },
  });

  const loginMutation = useLogin({
    mutation: {
      onSuccess: async (data) => {
        await login(data.token, data.user);
        router.replace('/(tabs)');
      },
      onError: (e: any) => {
        setError(e?.response?.data?.error ?? 'Login failed');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      },
    },
  });

  const isLoading = registerMutation.isPending || loginMutation.isPending;

  const handleSubmit = () => {
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (mode === 'register') {
      registerMutation.mutate({
        data: {
          username: username.trim(),
          password,
          ...(referralCode.trim() ? { referralCode: referralCode.trim().toUpperCase() } : {}),
        },
      });
    } else {
      loginMutation.mutate({ data: { username: username.trim(), password } });
    }
  };

  const topPad = insets.top + (Platform.OS === 'web' ? 24 : 8);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* Logo */}
      <View style={styles.logoArea}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoIcon}>⬡</Text>
        </View>
        <Text style={styles.appName}>ACCESS</Text>
        <Text style={styles.tagline}>Virtual Mining Network</Text>
        <View style={styles.currencyBadge}>
          <Text style={styles.currencyBadgeText}>ZRN Token</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, mode === 'login' && styles.tabActive]}
            onPress={() => { setMode('login'); setError(''); }}
          >
            <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, mode === 'register' && styles.tabActive]}
            onPress={() => { setMode('register'); setError(''); }}
          >
            <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>Create Account</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.fields}>
          <Field label="Username" value={username} onChangeText={setUsername} placeholder="Enter username" autoCapitalize="none" />
          <Field label="Password" value={password} onChangeText={setPassword} placeholder="Enter password" secureTextEntry />
          {mode === 'register' && (
            <Field
              label="Referral Code (optional)"
              value={referralCode}
              onChangeText={setReferralCode}
              placeholder="Enter referral code"
              autoCapitalize="characters"
            />
          )}

          {!!error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={[styles.btn, isLoading && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={C.primaryForeground} />
            ) : (
              <Text style={styles.btnText}>{mode === 'login' ? 'Sign In' : 'Start Mining'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function Field({
  label, value, onChangeText, placeholder, secureTextEntry, autoCapitalize,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder: string; secureTextEntry?: boolean; autoCapitalize?: any;
}) {
  return (
    <View style={styles.inputWrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.mutedForeground}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize ?? 'none'}
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  logoArea: { alignItems: 'center', paddingBottom: 24, paddingHorizontal: 24 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 18,
    backgroundColor: C.secondary, borderWidth: 2, borderColor: C.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 18, elevation: 10,
  },
  logoIcon: { fontSize: 36, color: C.primary },
  appName: { fontSize: 26, fontFamily: 'Inter_700Bold', color: C.foreground, letterSpacing: 6 },
  tagline: { fontSize: 12, fontFamily: 'Inter_400Regular', color: C.mutedForeground, marginTop: 2, letterSpacing: 1 },
  currencyBadge: {
    marginTop: 10, backgroundColor: C.primary + '22',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5,
    borderWidth: 1, borderColor: C.primary + '44',
  },
  currencyBadgeText: { fontSize: 13, color: C.primary, fontFamily: 'Inter_600SemiBold', letterSpacing: 1 },
  form: { paddingHorizontal: 24, paddingBottom: 32 },
  tabs: {
    flexDirection: 'row', backgroundColor: C.secondary,
    borderRadius: 12, padding: 4, marginBottom: 24,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: C.primary },
  tabText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: C.mutedForeground },
  tabTextActive: { color: C.primaryForeground, fontFamily: 'Inter_600SemiBold' },
  fields: { gap: 14 },
  inputWrapper: { gap: 6 },
  label: { fontSize: 12, fontFamily: 'Inter_500Medium', color: C.mutedForeground, letterSpacing: 0.5 },
  input: {
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13,
    fontSize: 15, fontFamily: 'Inter_400Regular', color: C.foreground,
  },
  error: { fontSize: 13, color: C.destructive, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  btn: {
    backgroundColor: C.primary, borderRadius: 14, paddingVertical: 15,
    alignItems: 'center', marginTop: 6,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: C.primaryForeground, letterSpacing: 0.5 },
});
