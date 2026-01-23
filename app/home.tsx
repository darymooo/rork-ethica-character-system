import { useEthica } from '@/contexts/EthicaContext';
import { VIRTUES } from '@/constants/virtues';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme, Alert, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Menu, User, BookOpen, Info, Database, Flame, BarChart3, CheckCircle, Feather } from 'lucide-react-native';
import colors from '@/constants/colors';
import { typography, sizes } from '@/constants/typography';
import { useEffect, useRef, useState } from 'react';
import FranklinMethodModal from '@/components/FranklinMethodModal';

export default function Home() {
  const { state, getCycleProgress, getCurrentWeekObservations, getStreakData, isWeekComplete, isSaving } = useEthica();
  const observations = getCurrentWeekObservations();
  const router = useRouter();
  const systemColorScheme = useColorScheme();
  const isDark = state.followSystemTheme ? systemColorScheme === 'dark' : state.darkMode;
  const theme = isDark ? colors.dark : colors.light;
  const { width: screenWidth } = useWindowDimensions();

  const contentPadding = screenWidth < 380 ? 20 : 32;
  const gridGap = screenWidth < 380 ? 8 : 16;
  const dayCellSize = Math.min(40, Math.floor((screenWidth - contentPadding * 2 - gridGap * 6) / 7));

  const currentVirtue = VIRTUES.find(v => v.id === state.currentVirtueId);
  const cycleProgress = getCycleProgress();
  const streakData = getStreakData();
  const isFirstWeek = state.weekRecords.length === 0;
  const weekComplete = isWeekComplete();
  const hasShownWeekCompleteAlert = useRef(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  useEffect(() => {
    if (weekComplete && currentVirtue && !hasShownWeekCompleteAlert.current) {
      hasShownWeekCompleteAlert.current = true;
      
      setTimeout(() => {
        Alert.alert(
          'Week Complete! 🎉',
          `Your week of practicing ${currentVirtue.name} is ready for review. Would you like to reflect on your progress?`,
          [
            {
              text: 'Later',
              style: 'cancel',
            },
            {
              text: 'Review Now',
              onPress: () => router.push('/week-review'),
            },
          ]
        );
      }, 500);
    }
  }, [weekComplete, currentVirtue, router]);
  
  const getDayOfWeek = (index: number): string => {
    const days = state.weekStartsMonday 
      ? ['M', 'T', 'W', 'T', 'F', 'S', 'S']
      : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    return days[index];
  };

  const handleDayPress = (dayIndex: number) => {
    router.push('/log-observation');
  };

  if (!currentVirtue) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
        <View style={styles.emptyStateContainer}>
          <Text style={[styles.emptyStateTitle, { color: theme.text }]}>
            No virtue selected
          </Text>
          <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
            Select a virtue to begin your week of practice.
          </Text>
          <TouchableOpacity
            style={[styles.logButton, { borderColor: theme.border, marginTop: 24 }]}
            onPress={() => router.replace('/virtue-selection')}
            activeOpacity={0.7}
            accessibilityLabel="Select a virtue to begin"
            accessibilityRole="button"
            testID="select-virtue-button"
          >
            <Text style={[styles.logButtonText, { color: theme.text }]}>
              Select Virtue
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => router.push('/settings')}
          activeOpacity={0.7}
          accessibilityLabel="Settings"
          accessibilityRole="button"
          testID="settings-button"
        >
          <Menu size={24} color={theme.text} strokeWidth={1.5} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              onPress={() => router.push('/personal-journal')}
              activeOpacity={0.7}
              accessibilityLabel="Personal Journal"
              accessibilityRole="button"
              testID="personal-journal-button"
            >
              <Feather size={24} color={theme.text} strokeWidth={1.5} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => router.push('/journal')}
              activeOpacity={0.7}
              accessibilityLabel="Virtue Journal"
              accessibilityRole="button"
              testID="journal-button"
            >
              <BookOpen size={24} color={theme.text} strokeWidth={1.5} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => router.push('/analytics')}
              activeOpacity={0.7}
              accessibilityLabel="Analytics"
              accessibilityRole="button"
              testID="analytics-button"
            >
              <BarChart3 size={24} color={theme.text} strokeWidth={1.5} />
            </TouchableOpacity>
          </View>
          <View style={styles.offlineIndicator}>
            <Database size={10} color={theme.textTertiary} strokeWidth={2} />
            <Text style={[styles.offlineText, { color: theme.textTertiary }]}>
              {isSaving ? 'Saving...' : 'Saved locally'}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => router.push('/profile')}
          activeOpacity={0.7}
          accessibilityLabel="Profile"
          accessibilityRole="button"
          testID="profile-button"
        >
          <User size={24} color={theme.text} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.virtueSection}>
          <View style={styles.topStatsRow}>
            {streakData.currentStreak > 0 && (
              <View style={[styles.streakBadge, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Flame size={16} color="#E8834A" strokeWidth={2} />
                <Text style={[styles.streakText, { color: theme.text }]}>
                  {streakData.currentStreak}
                </Text>
              </View>
            )}
            <View style={[styles.progressRing, { borderColor: theme.borderLight }]}>
              <View 
                style={[
                  styles.progressRingFill, 
                  { 
                    borderColor: theme.accent,
                    transform: [{ rotate: `${(cycleProgress.percentage * 3.6) - 90}deg` }]
                  }
                ]} 
              />
              <View style={[styles.progressRingInner, { backgroundColor: theme.background }]}>
                <Text style={[styles.cycleProgressText, { color: theme.text }]}>
                  {cycleProgress.current}
                </Text>
                <Text style={[styles.cycleProgressTotal, { color: theme.textTertiary }]}>of 13</Text>
              </View>
            </View>
            {streakData.longestStreak > 0 && streakData.longestStreak > streakData.currentStreak && (
              <View style={[styles.bestStreakBadge, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.bestStreakLabel, { color: theme.textTertiary }]}>Best</Text>
                <Text style={[styles.bestStreakText, { color: theme.text }]}>
                  {streakData.longestStreak}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.virtueName, { color: theme.text }]}>
            {currentVirtue.name}
          </Text>
          <Text style={[styles.virtueDescription, { color: theme.textSecondary }]}>
            {currentVirtue.fullDescription}
          </Text>
          <Text style={[styles.weekLabel, { color: theme.textTertiary }]}>
            This week’s observation
          </Text>
        </View>

        {weekComplete && (
          <TouchableOpacity 
            style={[styles.weekCompleteBanner, { backgroundColor: theme.accent }]}
            onPress={() => router.push('/week-review')}
            activeOpacity={0.8}
            accessibilityLabel="This week is complete. Review your observations and select the next virtue"
            accessibilityRole="button"
            testID="week-complete-banner"
          >
            <View style={styles.weekCompleteContent}>
              <CheckCircle size={20} color="#FFFFFF" strokeWidth={2} />
              <View style={styles.weekCompleteTextContainer}>
                <Text style={styles.weekCompleteTitle}>Week Complete</Text>
                <Text style={styles.weekCompleteSubtitle}>Tap to review and choose your next virtue</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {isFirstWeek && !weekComplete && (
          <TouchableOpacity 
            style={[styles.tipCard, { backgroundColor: theme.surface, borderColor: theme.accent }]}
            onPress={() => setShowInfoModal(true)}
            activeOpacity={0.7}
            accessibilityLabel="Learn about Franklin's Method"
            accessibilityRole="button"
          >
            <View style={styles.tipHeader}>
              <Info size={16} color={theme.accent} strokeWidth={2} />
              <Text style={[styles.tipTitle, { color: theme.accent }]}>Your First Week</Text>
            </View>
            <Text style={[styles.tipText, { color: theme.textSecondary }]}>
              Franklin quietly noted each fault on his virtue chart. Tap to explore his method.
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.gridSection}>
          <View style={[styles.weekGrid, { gap: gridGap }]}>
            {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
              const today = new Date().toISOString().split('T')[0];
              let dateStr = '';
              let isToday = false;
              let isFuture = false;
              
              if (state.currentWeekStartDate) {
                const startDate = new Date(state.currentWeekStartDate);
                const date = new Date(startDate);
                date.setDate(date.getDate() + dayIndex);
                dateStr = date.toISOString().split('T')[0];
                isToday = dateStr === today;
                isFuture = dateStr > today;
              }
              
              const obs = observations.find(o => o.date === dateStr);
              const isLogged = obs !== undefined;
              const hasFault = obs?.hasFault;
              
              return (
                <TouchableOpacity
                  key={dayIndex}
                  style={styles.dayColumn}
                  onPress={() => handleDayPress(dayIndex)}
                  activeOpacity={0.7}
                  disabled={isFuture}
                  accessibilityLabel={`${getDayOfWeek(dayIndex)}${isToday ? ', today' : ''}${isLogged ? (hasFault ? ', fault observed' : ', no fault') : ', not logged'}${isFuture ? ', future date' : ''}`}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isFuture }}
                  testID={`day-${dayIndex}`}
                >
                  <Text style={[
                    styles.dayLabel, 
                    { color: isToday ? theme.accent : theme.textTertiary }
                  ]}>
                    {getDayOfWeek(dayIndex)}
                  </Text>
                  <View style={[
                    styles.dayCell, 
                    { 
                      width: dayCellSize,
                      height: dayCellSize,
                      borderColor: isToday ? theme.accent : theme.border,
                      borderWidth: isToday ? 2 : 1,
                      backgroundColor: isLogged && !hasFault ? theme.text : 'transparent',
                      opacity: isFuture ? 0.4 : 1,
                    }
                  ]}>
                    {hasFault && (
                      <View style={[styles.faultDot, { backgroundColor: theme.faultDot }]} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.logButton, { borderColor: theme.border }]}
            onPress={() => handleDayPress(0)}
            activeOpacity={0.7}
            accessibilityLabel="Log observation for today"
            accessibilityRole="button"
            testID="log-observation-button"
          >
            <Text style={[styles.logButtonText, { color: theme.text }]}>
              Log Observation
            </Text>
          </TouchableOpacity>

          {state.currentWeekStartDate && (
            <TouchableOpacity
              style={styles.reviewButton}
              onPress={() => router.push('/week-review')}
              activeOpacity={0.7}
              accessibilityLabel="Complete week and review"
              accessibilityRole="button"
              testID="complete-week-button"
            >
              <Text style={[styles.reviewButtonText, { color: theme.textSecondary }]}>
                Complete Week
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FranklinMethodModal 
        visible={showInfoModal}
        onClose={() => setShowInfoModal(false)}
      />
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
  iconButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 2,
  },
  offlineText: {
    ...typography.sans.regular,
    fontSize: 9,
    letterSpacing: 0.3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  virtueSection: {
    paddingTop: 32,
    gap: 16,
    alignItems: 'center',
  },
  topStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 8,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 20,
  },
  streakText: {
    ...typography.sans.semibold,
    fontSize: sizes.label,
  },
  bestStreakBadge: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 20,
    gap: 2,
  },
  bestStreakLabel: {
    ...typography.sans.regular,
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bestStreakText: {
    ...typography.sans.semibold,
    fontSize: sizes.caption,
  },
  progressRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative' as const,
  },
  progressRingFill: {
    position: 'absolute' as const,
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  progressRingInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  cycleProgressText: {
    ...typography.serif.semibold,
    fontSize: 24,
  },
  cycleProgressTotal: {
    ...typography.sans.regular,
    fontSize: 11,
  },
  virtueName: {
    ...typography.serif.semibold,
    fontSize: sizes.xlarge,
    textAlign: 'center',
  },
  virtueDescription: {
    ...typography.sans.regular,
    fontSize: sizes.body,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  weekLabel: {
    ...typography.sans.medium,
    fontSize: sizes.caption,
    marginTop: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  gridSection: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  weekGrid: {
    flexDirection: 'row',
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
    paddingBottom: 32,
    gap: 16,
  },
  logButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  logButtonText: {
    ...typography.sans.semibold,
    fontSize: sizes.label,
  },
  reviewButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  reviewButtonText: {
    ...typography.sans.regular,
    fontSize: sizes.body,
  },
  tipCard: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    marginHorizontal: 12,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tipTitle: {
    ...typography.sans.semibold,
    fontSize: sizes.caption,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tipText: {
    ...typography.sans.regular,
    fontSize: sizes.caption,
    lineHeight: 18,
  },
  weekCompleteBanner: {
    marginHorizontal: -20,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  weekCompleteContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  weekCompleteTextContainer: {
    flex: 1,
  },
  weekCompleteTitle: {
    ...typography.sans.semibold,
    fontSize: sizes.label,
    color: '#FFFFFF',
  },
  weekCompleteSubtitle: {
    ...typography.sans.regular,
    fontSize: sizes.caption,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    ...typography.serif.semibold,
    fontSize: sizes.large,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyStateText: {
    ...typography.sans.regular,
    fontSize: sizes.body,
    textAlign: 'center',
    lineHeight: 24,
  },
});
