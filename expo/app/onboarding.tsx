import { useRouter } from 'expo-router';
import { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme, ActivityIndicator, Animated, useWindowDimensions } from 'react-native';
import { useEthica } from '@/contexts/EthicaContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, Check, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import colors from '@/constants/colors';
import { typography, sizes } from '@/constants/typography';

const screens = [
  {
    title: 'This is not a habit tracker.',
    body: 'This system is based on Benjamin Franklin\'s method of character formation through observation.',
    kicker: 'A calmer framework',
  },
  {
    title: 'One virtue. One week.',
    body: 'Focus on a single virtue each week.\nEach fault is marked, not judged.',
    kicker: 'Focused weekly practice',
  },
  {
    title: 'Perfection is not the goal.',
    body: 'Observe honestly. Notice changes over time.',
    kicker: 'Built for reflection',
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
  const { width } = useWindowDimensions();
  const isTabletLayout = width >= 768;
  const horizontalPadding = width < 380 ? 20 : isTabletLayout ? 40 : 28;
  const accentSurface = isDark ? '#242220' : '#F1E8D9';

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.98)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(28);
    scaleAnim.setValue(0.98);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 9,
        tension: 48,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 42,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentScreen, fadeAnim, scaleAnim, slideAnim]);

  const handleContinue = () => {
    void Haptics.selectionAsync();

    if (currentScreen < screens.length - 1) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -18,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentScreen((prev) => prev + 1);
      });
    } else {
      updateState({ hasSeenOnboarding: true });
      router.replace('/paywall');
    }
  };

  const currentContent = screens[currentScreen];
  const isLastScreen = currentScreen === screens.length - 1;

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}> 
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={[styles.content, { paddingHorizontal: horizontalPadding }]}> 
        <View style={[styles.contentShell, { maxWidth: isTabletLayout ? 880 : 560 }]}> 
          <View style={styles.topRow}>
            <View style={[styles.stepPill, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
              <Text style={[styles.stepPillText, { color: theme.textSecondary }]}>{currentScreen + 1} / {screens.length}</Text>
            </View>
            <Text style={[styles.kicker, { color: theme.textTertiary }]}>{currentContent.kicker}</Text>
          </View>

          <Animated.View
            style={[
              styles.heroCard,
              {
                backgroundColor: accentSurface,
                borderColor: theme.border,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
              },
            ]}
          >
            <View style={[styles.sparkleIcon, { backgroundColor: theme.surface }]}> 
              {currentScreen === 1 ? (
                <Check size={24} color={theme.accent} strokeWidth={2} />
              ) : (
                <Sparkles size={24} color={theme.accent} strokeWidth={1.8} />
              )}
            </View>

            <View style={styles.textContainer}>
              <Text style={[styles.title, { color: theme.text }]}>{currentContent.title}</Text>
              <Text style={[styles.body, { color: theme.textSecondary }]}>{currentContent.body}</Text>
            </View>

            {currentScreen === 1 ? (
              <Animated.View style={[styles.gridDemo, { opacity: fadeAnim }]}> 
                <View style={styles.weekGrid}>
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
                    <View key={day + index.toString()} style={styles.dayColumn}>
                      <Text style={[styles.dayLabel, { color: theme.textTertiary }]}>{day}</Text>
                      <View style={[styles.dayCell, { borderColor: theme.borderLight, backgroundColor: theme.surface }]}> 
                        {index === 2 || index === 5 ? (
                          <View style={[styles.faultDot, { backgroundColor: theme.faultDot }]} />
                        ) : null}
                      </View>
                    </View>
                  ))}
                </View>
              </Animated.View>
            ) : null}

            <View style={styles.editorialRow}>
              {['Deliberate', 'Private', 'Simple'].map((item) => (
                <View key={item} style={[styles.editorialPill, { backgroundColor: theme.surface, borderColor: theme.borderLight }]}> 
                  <Text style={[styles.editorialPillText, { color: theme.textSecondary }]}>{item}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          <View style={styles.footer}>
            <View style={styles.pagination}>
              {screens.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    {
                      backgroundColor: index === currentScreen ? theme.accent : theme.borderLight,
                      width: index === currentScreen ? 28 : 8,
                    },
                  ]}
                  accessibilityLabel={`Step ${index + 1} of ${screens.length}${index === currentScreen ? ', current' : ''}`}
                />
              ))}
            </View>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.text }]}
              onPress={handleContinue}
              activeOpacity={0.8}
              accessibilityLabel={isLastScreen ? 'Begin using the app' : 'Continue to next step'}
              accessibilityRole="button"
              testID="onboarding-continue-button"
            >
              <Text style={[styles.buttonText, { color: theme.background }]}>{isLastScreen ? 'Begin' : 'Continue'}</Text>
              <ArrowRight size={18} color={theme.background} strokeWidth={2} />
            </TouchableOpacity>
          </View>
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
    paddingVertical: 28,
  },
  contentShell: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'space-between',
    gap: 20,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  stepPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  stepPillText: {
    ...typography.sans.medium,
    fontSize: 12,
  },
  kicker: {
    ...typography.sans.medium,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 32,
    paddingVertical: 28,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    gap: 24,
  },
  sparkleIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    gap: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  title: {
    ...typography.serif.semibold,
    fontSize: sizes.xlarge,
    lineHeight: 44,
    textAlign: 'center',
    maxWidth: 560,
  },
  body: {
    ...typography.sans.regular,
    fontSize: sizes.body,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 520,
  },
  gridDemo: {
    alignItems: 'center',
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
    width: 38,
    height: 38,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faultDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  editorialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  editorialPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  editorialPillText: {
    ...typography.sans.medium,
    fontSize: 12,
  },
  footer: {
    gap: 24,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 999,
  },
  button: {
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  buttonText: {
    ...typography.sans.semibold,
    fontSize: sizes.label,
  },
});
