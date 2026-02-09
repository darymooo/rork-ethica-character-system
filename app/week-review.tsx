import { useEthica } from '@/contexts/EthicaContext';
import { VIRTUES, FRANKLIN_QUOTES } from '@/constants/virtues';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import colors from '@/constants/colors';
import { typography, sizes } from '@/constants/typography';
import { sendImmediateWeeklySummary } from '@/utils/notifications';
import { requestStoreReview, shouldTriggerReview } from '@/utils/storeReview';

export default function WeekReview() {
  const { state, getVirtueHistory, getCurrentWeekObservations, completeWeek, startNewWeek, getCycleProgress } = useEthica();
  const router = useRouter();
  const systemColorScheme = useColorScheme();
  const isDark = state.followSystemTheme ? systemColorScheme === 'dark' : state.darkMode;
  const theme = isDark ? colors.dark : colors.light;
  const { width: screenWidth } = useWindowDimensions();
  const isSmallScreen = screenWidth < 380;

  const currentVirtue = VIRTUES.find(v => v.id === state.currentVirtueId);
  const observations = getCurrentWeekObservations();
  
  const totalFaults = observations.filter(obs => obs.hasFault).length;

  const previousWeeks = useMemo(() => {
    if (!currentVirtue) return [];
    return getVirtueHistory(currentVirtue.id);
  }, [currentVirtue, getVirtueHistory]);

  const allAttempts = useMemo(() => {
    return previousWeeks.map((week, index) => ({
      weekNumber: index + 1,
      faults: week.observations.filter(o => o.hasFault).length,
      date: week.startDate,
    }));
  }, [previousWeeks]);

  const randomQuote = useMemo(() => {
    return FRANKLIN_QUOTES[Math.floor(Math.random() * FRANKLIN_QUOTES.length)];
  }, []);

  const handleRepeat = async () => {
    if (!state.currentVirtueId || !currentVirtue) return;
    const virtueToRepeat = state.currentVirtueId;
    
    if (state.enableNotifications) {
      await sendImmediateWeeklySummary(
        currentVirtue.name,
        totalFaults,
        observations.length,
        state.streakData.currentStreak
      );
    }
    
    const isPerfectWeek = totalFaults === 0 && observations.length === 7;
    
    completeWeek(observations);
    startNewWeek(virtueToRepeat);
    
    if (isPerfectWeek) {
      const shouldRequest = await shouldTriggerReview({
        type: 'perfect_week',
      });
      if (shouldRequest) {
        setTimeout(() => {
          requestStoreReview();
        }, 800);
      }
    }
    
    router.replace('/home');
  };

  const handleNext = async () => {
    if (currentVirtue && state.enableNotifications) {
      await sendImmediateWeeklySummary(
        currentVirtue.name,
        totalFaults,
        observations.length,
        state.streakData.currentStreak
      );
    }
    
    const isPerfectWeek = totalFaults === 0 && observations.length === 7;
    const cycleProgress = getCycleProgress();
    const perfectWeeksCount = state.streakData.perfectWeeks + (isPerfectWeek ? 1 : 0);
    
    completeWeek(observations);
    
    if (isPerfectWeek) {
      const shouldRequest = await shouldTriggerReview({
        type: 'perfect_week',
      });
      if (shouldRequest) {
        setTimeout(() => {
          requestStoreReview();
        }, 800);
      }
    } else if (cycleProgress.current === 13) {
      const shouldRequest = await shouldTriggerReview({
        type: 'cycle_complete',
        cyclesCompleted: cycleProgress.cycleNumber,
      });
      if (shouldRequest) {
        setTimeout(() => {
          requestStoreReview();
        }, 800);
      }
    } else if (perfectWeeksCount > 0) {
      const shouldRequest = await shouldTriggerReview({
        type: 'multiple_perfect_weeks',
        perfectWeeks: perfectWeeksCount,
      });
      if (shouldRequest) {
        setTimeout(() => {
          requestStoreReview();
        }, 800);
      }
    }
    
    router.replace('/virtue-selection');
  };

  if (!currentVirtue) {
    return null;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            try {
              router.back();
            } catch {
              router.replace('/home');
            }
          }}
          activeOpacity={0.7}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          testID="week-review-back-button"
        >
          <ArrowLeft size={24} color={theme.text} strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Weekly Reflection
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.resultsSection}>
          <View style={styles.virtueContainer}>
            <Text style={[styles.virtueName, { color: theme.text }]}>
              {currentVirtue.name}
            </Text>
          </View>

          <View style={styles.faultsContainer}>
            <Text style={[styles.faultsNumber, { color: theme.text, fontSize: isSmallScreen ? 56 : 72 }]}>
              {totalFaults}
            </Text>
            <Text style={[styles.faultsLabel, { color: theme.textSecondary }]}>
              {totalFaults === 1 ? 'fault this week' : 'faults this week'}
            </Text>
          </View>

          {allAttempts.length > 0 && (
            <View style={styles.comparisonSection}>
              <Text style={[styles.comparisonTitle, { color: theme.textTertiary }]}>
                Previous Attempts
              </Text>
              <View style={styles.attemptsContainer}>
                {allAttempts.map((attempt) => (
                  <View key={attempt.date} style={styles.attemptItem}>
                    <Text style={[styles.attemptLabel, { color: theme.textTertiary }]}>
                      Week {attempt.weekNumber}
                    </Text>
                    <Text style={[styles.attemptFaults, { color: theme.text }]}>
                      {attempt.faults}
                    </Text>
                  </View>
                ))}
                <View style={[styles.attemptItem, styles.currentAttempt, { borderColor: theme.accent }]}>
                  <Text style={[styles.attemptLabel, { color: theme.textTertiary }]}>
                    This week
                  </Text>
                  <Text style={[styles.attemptFaults, { color: theme.text }]}>
                    {totalFaults}
                  </Text>
                </View>
              </View>
            </View>
          )}

          <View style={[styles.quoteContainer, { borderTopColor: theme.borderLight, borderBottomColor: theme.borderLight }]}>
            <Text style={[styles.quoteText, { color: theme.textSecondary }]}>
              &ldquo;{randomQuote}&rdquo;
            </Text>
            <Text style={[styles.quoteAuthor, { color: theme.textTertiary }]}>
              — Benjamin Franklin
            </Text>
          </View>
        </View>

        </ScrollView>

      <View style={[styles.footer, { borderTopColor: theme.borderLight }]}>
        <TouchableOpacity
          style={[styles.primaryButton, { borderColor: theme.border }]}
          onPress={handleNext}
          activeOpacity={0.7}
          accessibilityLabel="Proceed to next virtue"
          accessibilityRole="button"
          testID="next-virtue-button"
        >
          <Text style={[styles.primaryButtonText, { color: theme.text }]}>
            Proceed to next virtue
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleRepeat}
          activeOpacity={0.7}
          accessibilityLabel={`Repeat ${currentVirtue?.name} for another week`}
          accessibilityRole="button"
          testID="repeat-virtue-button"
        >
          <Text style={[styles.secondaryButtonText, { color: theme.textSecondary }]}>
            Repeat this virtue
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    ...typography.serif.semibold,
    fontSize: sizes.title,
  },
  headerRight: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingVertical: 24,
  },
  resultsSection: {
    alignItems: 'center',
    gap: 32,
    paddingVertical: 24,
  },
  virtueContainer: {
    alignItems: 'center',
  },
  virtueName: {
    ...typography.serif.semibold,
    fontSize: sizes.xlarge,
  },
  faultsContainer: {
    alignItems: 'center',
    gap: 8,
  },
  faultsNumber: {
    ...typography.serif.semibold,
    lineHeight: 80,
  },
  faultsLabel: {
    ...typography.sans.regular,
    fontSize: sizes.body,
  },
  comparisonSection: {
    alignItems: 'center',
    gap: 16,
  },
  comparisonTitle: {
    ...typography.sans.medium,
    fontSize: sizes.caption,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  attemptsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  attemptItem: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  currentAttempt: {
    borderWidth: 1,
    borderRadius: 8,
  },
  attemptLabel: {
    ...typography.sans.regular,
    fontSize: sizes.caption,
  },
  attemptFaults: {
    ...typography.sans.semibold,
    fontSize: sizes.title,
  },
  quoteContainer: {
    paddingVertical: 32,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    gap: 16,
  },
  quoteText: {
    ...typography.serif.regular,
    fontSize: sizes.body,
    lineHeight: 26,
    textAlign: 'center',
    fontStyle: 'italic' as const,
  },
  quoteAuthor: {
    ...typography.sans.regular,
    fontSize: sizes.caption,
    textAlign: 'center',
  },
  footer: {
    gap: 16,
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderTopWidth: 1,
  },
  primaryButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  primaryButtonText: {
    ...typography.sans.semibold,
    fontSize: sizes.label,
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    ...typography.sans.regular,
    fontSize: sizes.body,
  },
});
