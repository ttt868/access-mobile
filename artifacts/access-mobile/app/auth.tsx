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
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
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
    <LinearGradient
      colors={['#E5EEF9', '#FFFFFF', '#F8FAFC']}
      locations={[0, 0.4, 1]}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: topPad + 40 }]} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.logoArea}>
          <View style={styles.logoShadow}>
            <LinearGradient
              colors={['#FFFFFF', '#EAF0F8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoCircle}
            >
              <LinearGradient
                colors={[C.primary, '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoInner}
              >
                <Feather name="layers" size={32} color="#FFFFFF" />
              </LinearGradient>
            </LinearGradient>
          </View>
          <Text style={styles.appName}>NEXORA</Text>
          <Text style={styles.tagline}>The Premium Mining Network</Text>
          <View style={styles.currencyBadge}>
            <Text style={styles.currencyBadgeText}>ZRN Token</Text>
          </View>
        </View>

        <View style={styles.formContainer}>
          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, mode === 'login' && styles.tabActive]}
              onPress={() => { setMode('login'); setError(''); }}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, mode === 'register' && styles.tabActive]}
              onPress={() => { setMode('register'); setError(''); }}
              activeOpacity={0.8}
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

            {!!error && (
              <View style={styles.errorBox}>
                <Feather name="alert-circle" size={14} color={C.destructive} />
                <Text style={styles.error}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.btnWrapper}
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={isLoading ? ['#94A3B8', '#94A3B8'] : [C.primary, C.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.btn}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.btnText}>{mode === 'login' ? 'Sign In' : 'Start Mining'}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
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
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize ?? 'none'}
          autoCorrect={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40, flexGrow: 1, alignItems: 'center' },
  logoArea: { alignItems: 'center', paddingBottom: 32, width: '100%' },
  logoShadow: {
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
    marginBottom: 20,
    borderRadius: 34,
  },
  logoCircle: {
    width: 88, height: 88, borderRadius: 34,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#FFFFFF',
    padding: 6,
  },
  logoInner: {
    width: '100%', height: '100%', borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  appName: { fontSize: 32, fontFamily: 'Inter_700Bold', color: C.foreground, letterSpacing: 6 },
  tagline: { fontSize: 13, fontFamily: 'Inter_500Medium', color: '#64748B', marginTop: 4, letterSpacing: 1.5, textTransform: 'uppercase' },
  currencyBadge: {
    marginTop: 16, backgroundColor: '#FFFFFF',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
    borderWidth: 1, borderColor: C.border,
  },
  currencyBadgeText: { fontSize: 13, color: C.primary, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.05,
    shadowRadius: 30,
    elevation: 5,
  },
  tabs: {
    flexDirection: 'row', backgroundColor: '#F1F5F9',
    borderRadius: 16, padding: 6, marginBottom: 28,
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  tabActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  tabText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#64748B' },
  tabTextActive: { color: C.primary, fontFamily: 'Inter_700Bold' },
  fields: { gap: 20 },
  inputWrapper: { gap: 8 },
  label: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: C.foreground, marginLeft: 4 },
  inputContainer: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: C.border,
    borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1,
  },
  input: {
    paddingHorizontal: 18, paddingVertical: 16,
    fontSize: 15, fontFamily: 'Inter_500Medium', color: C.foreground,
  },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF2F2', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#FECACA' },
  error: { fontSize: 13, color: C.destructive, fontFamily: 'Inter_500Medium', flex: 1 },
  btnWrapper: {
    borderRadius: 18, marginTop: 8,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 16, elevation: 8,
  },
  btn: { borderRadius: 18, paddingVertical: 18, alignItems: 'center' },
  btnText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#FFFFFF', letterSpacing: 0.5 },
});