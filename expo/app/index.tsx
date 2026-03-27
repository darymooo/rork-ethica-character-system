import { useEthica } from '@/contexts/EthicaContext';
import { useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { View, ActivityIndicator, StyleSheet, useColorScheme } from 'react-native';
import colors from '@/constants/colors';

export default function Index() {
  const { state, isLoading } = useEthica();
  const router = useRouter();
  const systemColorScheme = useColorScheme();

  const isDark = useMemo(() => {
    if (isLoading) return systemColorScheme === 'dark';
    return state.followSystemTheme ? systemColorScheme === 'dark' : state.darkMode;
  }, [isLoading, state.followSystemTheme, state.darkMode, systemColorScheme]);

  const theme = isDark ? colors.dark : colors.light;

  useEffect(() => {
    if (!isLoading) {
      if (!state.hasCompletedOnboarding && !state.hasSeenOnboarding) {
        router.replace('/onboarding');
      } else if (!state.currentVirtueId) {
        router.replace('/virtue-selection');
      } else {
        router.replace('/home');
      }
    }
  }, [isLoading, state.hasCompletedOnboarding, state.hasSeenOnboarding, state.currentVirtueId, router]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color={theme.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
