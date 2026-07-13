import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import colors from '@/constants/colors';

export default function Index() {
  const { token, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (token) {
      router.replace('/(tabs)');
    } else {
      router.replace('/auth');
    }
  }, [token, isLoading]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.light.background, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.light.primary} size="large" />
    </View>
  );
}
