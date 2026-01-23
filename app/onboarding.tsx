import { useRouter } from 'expo-router';
import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme, ActivityIndicator } from 'react-native';
import { useEthica } from '@/contexts/EthicaContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '@/constants/colors';
import { typography, sizes } from '@/constants/typography';

const screens = [
  {
    title: 'This is not a habit tracker.',
    body: 'This system is based on Benjamin Franklin\'s method of character formation through observation.',
  },
  {
    title: 'One virtue. One week.',
    body: 'Focus on a single virtue each week.\nEach fault is marked, not judged.',
  },
  {
    title: 'Perfection is not the goal.',
    body: 'Observe honestly. Notice changes over time.',
  },
];

export default function Onboarding() {
  const [currentScreen, setCurrentScreen] = useState<number>(0);
  const router = useRouter();
  const { state, updateState, isLoading } = useEthica();
  const systemColorScheme = useColorScheme();
  
  const isDark = useMemo(() => {
    return state.followSystemTheme ? systemColorScheme === 'dark' : state.darkMode;
  }, [state.followSystemTheme, state.darkMode, systemColorScheme]);
  
  const theme = isDark ? colors.dark : colors.light;

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  const handleContinue = () => {
    if (currentScreen < screens.length - 1) {
      setCurrentScreen(currentScreen + 1);
    } else {
      updateState({ hasSeenOnboarding: true });
      router.replace('/paywall');
    }
  };

  const currentContent = screens[currentScreen];
  const isLastScreen = currentScreen === screens.length - 1;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: theme.text }]}>
            {currentContent.title}
          </Text>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            {currentContent.body}
          </Text>
        </View>

        {currentScreen === 1 && (
          <View style={styles.gridDemo}>
            <View style={styles.weekGrid}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
                <View key={index} style={styles.dayColumn}>
                  <Text style={[styles.dayLabel, { color: theme.textTertiary }]}>{day}</Text>
                  <View style={[styles.dayCell, { borderColor: theme.borderLight }]}>
                    {index === 2 || index === 5 ? (
                      <View style={[styles.faultDot, { backgroundColor: theme.faultDot }]} />
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <View style={styles.pagination}>
            {screens.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor: index === currentScreen ? theme.accent : theme.borderLight,
                  },
                ]}
                accessibilityLabel={`Step ${index + 1} of ${screens.length}${index === currentScreen ? ', current' : ''}`}
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.button, { borderColor: theme.border }]}
            onPress={handleContinue}
            activeOpacity={0.7}
            accessibilityLabel={isLastScreen ? 'Begin using the app' : 'Continue to next step'}
            accessibilityRole="button"
            testID="onboarding-continue-button"
          >
            <Text style={[styles.buttonText, { color: theme.text }]}>
              {isLastScreen ? 'Begin' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingVertical: 48,
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 24,
  },
  title: {
    ...typography.serif.semibold,
    fontSize: sizes.xlarge,
    lineHeight: 44,
    textAlign: 'center',
  },
  body: {
    ...typography.sans.regular,
    fontSize: sizes.body,
    lineHeight: 24,
    textAlign: 'center',
  },
  gridDemo: {
    alignItems: 'center',
    marginVertical: 32,
  },
  weekGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  dayColumn: {
    alignItems: 'center',
    gap: 8,
  },
  dayLabel: {
    ...typography.sans.medium,
    fontSize: sizes.caption,
  },
  dayCell: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faultDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  footer: {
    gap: 32,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  button: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  buttonText: {
    ...typography.sans.semibold,
    fontSize: sizes.label,
  },
});
