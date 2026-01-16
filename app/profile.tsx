import { useEthica } from '@/contexts/EthicaContext';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Flame, Target, Calendar, Trophy, Star, Zap, Award, TrendingUp, TrendingDown, BookOpen } from 'lucide-react-native';
import colors from '@/constants/colors';
import { typography, sizes } from '@/constants/typography';
import { VIRTUES } from '@/constants/virtues';
import React, { useMemo } from 'react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  progress?: number;
  total?: number;
}

export default function Profile() {
  const { state, getDetailedAnalytics, getStreakData, getCycleProgress } = useEthica();
  const router = useRouter();
  const systemColorScheme = useColorScheme();
  const isDark = state.followSystemTheme ? systemColorScheme === 'dark' : state.darkMode;
  const theme = isDark ? colors.dark : colors.light;

  const analytics = getDetailedAnalytics();
  const streakData = getStreakData();
  const cycleProgress = getCycleProgress();
  const { width: screenWidth } = useWindowDimensions();
  const isSmallScreen = screenWidth < 380;
  const heroDateFontSize = isSmallScreen ? 18 : 22;

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const getVirtueName = (virtueId: string | null): string => {
    if (!virtueId) return '—';
    return VIRTUES.find(v => v.id === virtueId)?.name || '—';
  };

  const daysSincePracticing = useMemo(() => {
    if (!state.startDate) return 0;
    const start = new Date(state.startDate);
    const today = new Date();
    return Math.floor((today.getTime() - start.getTime()) / 86400000);
  }, [state.startDate]);

  const achievements: Achievement[] = useMemo(() => {
    const iconColor = theme.accent;
    const iconSize = 20;

    return [
      {
        id: 'first_log',
        title: 'First Step',
        description: 'Log your first observation',
        icon: <BookOpen size={iconSize} color={iconColor} strokeWidth={1.5} />,
        unlocked: streakData.totalDaysLogged >= 1,
      },
      {
        id: 'week_complete',
        title: 'Week Warrior',
        description: 'Complete your first week',
        icon: <Calendar size={iconSize} color={iconColor} strokeWidth={1.5} />,
        unlocked: analytics.totalWeeks >= 1,
      },
      {
        id: 'perfect_week',
        title: 'Flawless',
        description: 'Achieve a perfect week with no faults',
        icon: <Star size={iconSize} color={iconColor} strokeWidth={1.5} />,
        unlocked: analytics.perfectWeeks >= 1,
      },
      {
        id: 'streak_7',
        title: 'Dedicated',
        description: 'Maintain a 7-day logging streak',
        icon: <Flame size={iconSize} color={iconColor} strokeWidth={1.5} />,
        unlocked: streakData.longestStreak >= 7,
        progress: Math.min(streakData.longestStreak, 7),
        total: 7,
      },
      {
        id: 'streak_30',
        title: 'Steadfast',
        description: 'Maintain a 30-day logging streak',
        icon: <Zap size={iconSize} color={iconColor} strokeWidth={1.5} />,
        unlocked: streakData.longestStreak >= 30,
        progress: Math.min(streakData.longestStreak, 30),
        total: 30,
      },
      {
        id: 'cycle_complete',
        title: 'Full Circle',
        description: 'Complete one 13-week cycle',
        icon: <Trophy size={iconSize} color={iconColor} strokeWidth={1.5} />,
        unlocked: analytics.completedCycles >= 1,
        progress: cycleProgress.current,
        total: 13,
      },
      {
        id: 'five_perfect',
        title: 'Perfectionist',
        description: 'Achieve 5 perfect weeks',
        icon: <Award size={iconSize} color={iconColor} strokeWidth={1.5} />,
        unlocked: analytics.perfectWeeks >= 5,
        progress: Math.min(analytics.perfectWeeks, 5),
        total: 5,
      },
      {
        id: 'hundred_days',
        title: 'Centurion',
        description: 'Log observations for 100 days',
        icon: <Target size={iconSize} color={iconColor} strokeWidth={1.5} />,
        unlocked: streakData.totalDaysLogged >= 100,
        progress: Math.min(streakData.totalDaysLogged, 100),
        total: 100,
      },
    ];
  }, [analytics, streakData, cycleProgress, theme.accent]);

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.canGoBack() ? router.back() : router.replace('/home')}
          activeOpacity={0.7}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          testID="profile-back-button"
        >
          <ArrowLeft size={24} color={theme.text} strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Profile
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <Text style={[styles.heroLabel, { color: theme.textTertiary }]}>
            PRACTICING SINCE
          </Text>
          <Text style={[styles.heroDate, { color: theme.text, fontSize: heroDateFontSize }]}>
            {formatDate(state.startDate)}
          </Text>
          <Text style={[styles.heroDays, { color: theme.textSecondary }]}>
            {daysSincePracticing} days on your journey
          </Text>
        </View>

        <View style={[styles.section, { borderTopColor: theme.borderLight }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Stats & Progress
          </Text>
          
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.borderLight }]}>
              <Flame size={20} color={theme.accent} strokeWidth={1.5} />
              <Text style={[styles.statValue, { color: theme.text }]}>
                {streakData.currentStreak}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textTertiary }]}>
                Current Streak
              </Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.borderLight }]}>
              <Zap size={20} color={theme.accent} strokeWidth={1.5} />
              <Text style={[styles.statValue, { color: theme.text }]}>
                {streakData.longestStreak}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textTertiary }]}>
                Longest Streak
              </Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.borderLight }]}>
              <Calendar size={20} color={theme.accent} strokeWidth={1.5} />
              <Text style={[styles.statValue, { color: theme.text }]}>
                {streakData.totalDaysLogged}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textTertiary }]}>
                Days Logged
              </Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.borderLight }]}>
              <Target size={20} color={theme.accent} strokeWidth={1.5} />
              <Text style={[styles.statValue, { color: theme.text }]}>
                {analytics.totalWeeks}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textTertiary }]}>
                Weeks Done
              </Text>
            </View>
          </View>

          <View style={[styles.cycleProgress, { backgroundColor: theme.surface, borderColor: theme.borderLight }]}>
            <View style={styles.cycleHeader}>
              <Text style={[styles.cycleTitle, { color: theme.text }]}>
                Cycle {cycleProgress.cycleNumber}
              </Text>
              <Text style={[styles.cycleCount, { color: theme.textSecondary }]}>
                {cycleProgress.current} / {cycleProgress.total} virtues
              </Text>
            </View>
            <View 
              style={[styles.progressBar, { backgroundColor: theme.borderLight }]}
              accessibilityLabel={`Cycle progress: ${cycleProgress.percentage}%`}
              accessibilityRole="progressbar"
              accessibilityValue={{ min: 0, max: 100, now: cycleProgress.percentage }}
            >
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    backgroundColor: theme.accent,
                    width: `${cycleProgress.percentage}%`,
                  }
                ]} 
              />
            </View>
          </View>
        </View>

        <View style={[styles.section, { borderTopColor: theme.borderLight }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Personal Insights
          </Text>

          <View style={styles.insightsList}>
            <View style={[styles.insightCard, { backgroundColor: theme.surface, borderColor: theme.borderLight }]}>
              <View style={styles.insightHeader}>
                <TrendingUp size={18} color={theme.success} strokeWidth={1.5} />
                <Text style={[styles.insightLabel, { color: theme.textTertiary }]}>
                  Strongest Virtue
                </Text>
              </View>
              <Text style={[styles.insightValue, { color: theme.text }]}>
                {getVirtueName(analytics.strongestVirtue)}
              </Text>
              <Text style={[styles.insightHint, { color: theme.textTertiary }]}>
                Lowest average faults
              </Text>
            </View>

            <View style={[styles.insightCard, { backgroundColor: theme.surface, borderColor: theme.borderLight }]}>
              <View style={styles.insightHeader}>
                <TrendingDown size={18} color={theme.faultDot} strokeWidth={1.5} />
                <Text style={[styles.insightLabel, { color: theme.textTertiary }]}>
                  Needs Attention
                </Text>
              </View>
              <Text style={[styles.insightValue, { color: theme.text }]}>
                {getVirtueName(analytics.weakestVirtue)}
              </Text>
              <Text style={[styles.insightHint, { color: theme.textTertiary }]}>
                Highest average faults
              </Text>
            </View>

            <View style={[styles.insightRow, { backgroundColor: theme.surface, borderColor: theme.borderLight }]}>
              <View style={styles.insightRowItem}>
                <Text style={[styles.insightRowLabel, { color: theme.textTertiary }]}>
                  Success Rate
                </Text>
                <Text style={[styles.insightRowValue, { color: theme.text }]}>
                  {analytics.successRate}%
                </Text>
              </View>
              <View style={[styles.insightDivider, { backgroundColor: theme.borderLight }]} />
              <View style={styles.insightRowItem}>
                <Text style={[styles.insightRowLabel, { color: theme.textTertiary }]}>
                  Avg. Faults/Week
                </Text>
                <Text style={[styles.insightRowValue, { color: theme.text }]}>
                  {analytics.avgFaultsPerWeek}
                </Text>
              </View>
            </View>

            <View style={[styles.insightRow, { backgroundColor: theme.surface, borderColor: theme.borderLight }]}>
              <View style={styles.insightRowItem}>
                <Text style={[styles.insightRowLabel, { color: theme.textTertiary }]}>
                  Perfect Weeks
                </Text>
                <Text style={[styles.insightRowValue, { color: theme.text }]}>
                  {analytics.perfectWeeks}
                </Text>
              </View>
              <View style={[styles.insightDivider, { backgroundColor: theme.borderLight }]} />
              <View style={styles.insightRowItem}>
                <Text style={[styles.insightRowLabel, { color: theme.textTertiary }]}>
                  Cycles Completed
                </Text>
                <Text style={[styles.insightRowValue, { color: theme.text }]}>
                  {analytics.completedCycles}
                </Text>
              </View>
            </View>

            {analytics.mostPracticedVirtue && (
              <View style={[styles.insightCard, { backgroundColor: theme.surface, borderColor: theme.borderLight }]}>
                <View style={styles.insightHeader}>
                  <BookOpen size={18} color={theme.accent} strokeWidth={1.5} />
                  <Text style={[styles.insightLabel, { color: theme.textTertiary }]}>
                    Most Practiced
                  </Text>
                </View>
                <Text style={[styles.insightValue, { color: theme.text }]}>
                  {getVirtueName(analytics.mostPracticedVirtue)}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={[styles.section, { borderTopColor: theme.borderLight }]}>
          <View style={styles.achievementHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Milestones
            </Text>
            <Text style={[styles.achievementCount, { color: theme.textTertiary }]}>
              {unlockedCount} / {achievements.length}
            </Text>
          </View>

          <View style={styles.achievementsList}>
            {achievements.map((achievement) => (
              <View 
                key={achievement.id}
                style={[
                  styles.achievementCard, 
                  { 
                    backgroundColor: theme.surface, 
                    borderColor: theme.borderLight,
                    opacity: achievement.unlocked ? 1 : 0.5,
                  }
                ]}
              >
                <View style={[styles.achievementIcon, { backgroundColor: achievement.unlocked ? theme.backgroundSecondary : 'transparent' }]}>
                  {achievement.icon}
                </View>
                <View style={styles.achievementContent}>
                  <Text style={[styles.achievementTitle, { color: theme.text }]}>
                    {achievement.title}
                  </Text>
                  <Text style={[styles.achievementDesc, { color: theme.textTertiary }]}>
                    {achievement.description}
                  </Text>
                  {!achievement.unlocked && achievement.progress !== undefined && achievement.total && (
                    <View style={styles.achievementProgress}>
                      <View style={[styles.achievementProgressBar, { backgroundColor: theme.borderLight }]}>
                        <View 
                          style={[
                            styles.achievementProgressFill, 
                            { 
                              backgroundColor: theme.accent,
                              width: `${Math.round((achievement.progress / achievement.total) * 100)}%`,
                            }
                          ]} 
                        />
                      </View>
                      <Text style={[styles.achievementProgressText, { color: theme.textTertiary }]}>
                        {achievement.progress}/{achievement.total}
                      </Text>
                    </View>
                  )}
                </View>
                {achievement.unlocked && (
                  <View style={[styles.checkmark, { backgroundColor: theme.success }]}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.quoteContainer, { borderTopColor: theme.borderLight }]}>
          <Text style={[styles.quoteText, { color: theme.textSecondary }]}>
            &ldquo;I did not aim for perfection, but for fewer faults.&rdquo;
          </Text>
          <Text style={[styles.quoteAuthor, { color: theme.textTertiary }]}>
            — Benjamin Franklin
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
    paddingHorizontal: 24,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  heroLabel: {
    ...typography.sans.medium,
    fontSize: sizes.caption,
    letterSpacing: 1.5,
  },
  heroDate: {
    ...typography.serif.semibold,
  },
  heroDays: {
    ...typography.sans.regular,
    fontSize: sizes.body,
    marginTop: 4,
  },
  section: {
    paddingTop: 32,
    paddingBottom: 8,
    borderTopWidth: 1,
    gap: 20,
  },
  sectionTitle: {
    ...typography.serif.semibold,
    fontSize: sizes.label,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    ...typography.serif.semibold,
    fontSize: 24,
  },
  statLabel: {
    ...typography.sans.regular,
    fontSize: sizes.caption,
    textAlign: 'center',
  },
  cycleProgress: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  cycleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cycleTitle: {
    ...typography.serif.semibold,
    fontSize: sizes.body,
  },
  cycleCount: {
    ...typography.sans.regular,
    fontSize: sizes.caption,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  insightsList: {
    gap: 12,
  },
  insightCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  insightLabel: {
    ...typography.sans.medium,
    fontSize: sizes.caption,
    letterSpacing: 0.5,
  },
  insightValue: {
    ...typography.serif.semibold,
    fontSize: sizes.label,
  },
  insightHint: {
    ...typography.sans.regular,
    fontSize: 12,
  },
  insightRow: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  insightRowItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  insightRowLabel: {
    ...typography.sans.regular,
    fontSize: sizes.caption,
  },
  insightRowValue: {
    ...typography.serif.semibold,
    fontSize: sizes.title,
  },
  insightDivider: {
    width: 1,
    marginHorizontal: 12,
  },
  achievementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  achievementCount: {
    ...typography.sans.medium,
    fontSize: sizes.caption,
  },
  achievementsList: {
    gap: 10,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 14,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementContent: {
    flex: 1,
    gap: 2,
  },
  achievementTitle: {
    ...typography.sans.semibold,
    fontSize: sizes.body,
  },
  achievementDesc: {
    ...typography.sans.regular,
    fontSize: 12,
  },
  achievementProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  achievementProgressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  achievementProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  achievementProgressText: {
    ...typography.sans.regular,
    fontSize: 12,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  quoteContainer: {
    paddingVertical: 32,
    borderTopWidth: 1,
    marginTop: 24,
    gap: 12,
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
  bottomSpacer: {
    height: 24,
  },
});
