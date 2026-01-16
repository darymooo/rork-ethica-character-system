import { useEthica } from '@/contexts/EthicaContext';
import { VIRTUES } from '@/constants/virtues';
import { useRouter } from 'expo-router';

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Flame, Target, TrendingUp, Award, Calendar, Zap } from 'lucide-react-native';
import colors from '@/constants/colors';
import { typography, sizes } from '@/constants/typography';

export default function Analytics() {
  const { state, getDetailedAnalytics, getStreakData, getVirtueStatistics } = useEthica();
  const router = useRouter();
  const systemColorScheme = useColorScheme();
  const isDark = state.followSystemTheme ? systemColorScheme === 'dark' : state.darkMode;
  const theme = isDark ? colors.dark : colors.light;

  const analytics = getDetailedAnalytics();
  const streakData = getStreakData();
  const virtueStats = getVirtueStatistics();
  const { width: screenWidth } = useWindowDimensions();
  const isSmallScreen = screenWidth < 380;

  const getVirtueName = (virtueId: string | null): string => {
    if (!virtueId) return '—';
    return VIRTUES.find(v => v.id === virtueId)?.name || virtueId;
  };

  const hasData = analytics.totalWeeks > 0 || streakData.totalDaysLogged > 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.canGoBack() ? router.back() : router.replace('/home')}
          activeOpacity={0.7}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          testID="analytics-back-button"
        >
          <ArrowLeft size={24} color={theme.text} strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Analytics
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {hasData ? (
          <>
            <View style={styles.streakSection}>
              <View style={[styles.streakCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.streakIconContainer}>
                  <Flame size={32} color="#E8834A" strokeWidth={1.5} />
                </View>
                <Text style={[styles.streakNumber, { color: theme.text, fontSize: isSmallScreen ? 48 : 64 }]}>
                  {streakData.currentStreak}
                </Text>
                <Text style={[styles.streakLabel, { color: theme.textSecondary }]}>
                  day streak
                </Text>
                <View style={[styles.streakDivider, { backgroundColor: theme.borderLight }]} />
                <View style={styles.streakMeta}>
                  <View style={styles.streakMetaItem}>
                    <Text style={[styles.streakMetaValue, { color: theme.text }]}>
                      {streakData.longestStreak}
                    </Text>
                    <Text style={[styles.streakMetaLabel, { color: theme.textTertiary }]}>
                      longest
                    </Text>
                  </View>
                  <View style={[styles.streakMetaDivider, { backgroundColor: theme.borderLight }]} />
                  <View style={styles.streakMetaItem}>
                    <Text style={[styles.streakMetaValue, { color: theme.text }]}>
                      {streakData.totalDaysLogged}
                    </Text>
                    <Text style={[styles.streakMetaLabel, { color: theme.textTertiary }]}>
                      total days
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Target size={20} color={theme.accent} strokeWidth={1.5} />
                <Text style={[styles.statValue, { color: theme.text }]}>
                  {analytics.successRate}%
                </Text>
                <Text style={[styles.statLabel, { color: theme.textTertiary }]}>
                  Success Rate
                </Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Calendar size={20} color={theme.accent} strokeWidth={1.5} />
                <Text style={[styles.statValue, { color: theme.text }]}>
                  {analytics.totalWeeks}
                </Text>
                <Text style={[styles.statLabel, { color: theme.textTertiary }]}>
                  Weeks
                </Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Award size={20} color={theme.accent} strokeWidth={1.5} />
                <Text style={[styles.statValue, { color: theme.text }]}>
                  {analytics.perfectWeeks}
                </Text>
                <Text style={[styles.statLabel, { color: theme.textTertiary }]}>
                  Perfect Weeks
                </Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Zap size={20} color={theme.accent} strokeWidth={1.5} />
                <Text style={[styles.statValue, { color: theme.text }]}>
                  {analytics.completedCycles}
                </Text>
                <Text style={[styles.statLabel, { color: theme.textTertiary }]}>
                  Cycles Done
                </Text>
              </View>
            </View>

            <View style={[styles.insightsSection, { borderColor: theme.borderLight }]}>
              <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>
                Insights
              </Text>

              <View style={styles.insightsList}>
                <View style={[styles.insightItem, { borderBottomColor: theme.borderLight }]}>
                  <Text style={[styles.insightLabel, { color: theme.textSecondary }]}>
                    Average faults per week
                  </Text>
                  <Text style={[styles.insightValue, { color: theme.text }]}>
                    {analytics.avgFaultsPerWeek}
                  </Text>
                </View>

                <View style={[styles.insightItem, { borderBottomColor: theme.borderLight }]}>
                  <Text style={[styles.insightLabel, { color: theme.textSecondary }]}>
                    Most practiced virtue
                  </Text>
                  <Text style={[styles.insightValue, { color: theme.text }]}>
                    {getVirtueName(analytics.mostPracticedVirtue)}
                  </Text>
                </View>

                <View style={[styles.insightItem, { borderBottomColor: theme.borderLight }]}>
                  <Text style={[styles.insightLabel, { color: theme.textSecondary }]}>
                    Strongest virtue
                  </Text>
                  <Text style={[styles.insightValue, { color: theme.success }]}>
                    {getVirtueName(analytics.strongestVirtue)}
                  </Text>
                </View>

                <View style={[styles.insightItem, { borderBottomColor: 'transparent' }]}>
                  <Text style={[styles.insightLabel, { color: theme.textSecondary }]}>
                    Needs attention
                  </Text>
                  <Text style={[styles.insightValue, { color: '#C97B5D' }]}>
                    {getVirtueName(analytics.weakestVirtue)}
                  </Text>
                </View>
              </View>
            </View>

            {analytics.weeklyFaultTrend.length > 0 && (
              <View style={styles.trendSection}>
                <View style={styles.trendHeader}>
                  <TrendingUp size={18} color={theme.textTertiary} strokeWidth={1.5} />
                  <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>
                    Recent Progress
                  </Text>
                </View>

                <View style={styles.trendChart}>
                  {analytics.weeklyFaultTrend.map((week, index) => {
                    const maxFaults = Math.max(...analytics.weeklyFaultTrend.map(w => w.faults), 7);
                    const height = maxFaults > 0 ? (week.faults / maxFaults) * 80 : 0;
                    const virtueName = getVirtueName(week.virtueId);
                    
                    return (
                      <View key={week.weekStart} style={styles.trendBarContainer}>
                        <Text style={[styles.trendBarValue, { color: theme.textTertiary }]}>
                          {week.faults}
                        </Text>
                        <View style={[styles.trendBarBackground, { backgroundColor: theme.borderLight }]}>
                          <View 
                            style={[
                              styles.trendBar, 
                              { 
                                height: Math.max(height, 4),
                                backgroundColor: week.faults === 0 ? theme.success : theme.accent,
                              }
                            ]} 
                          />
                        </View>
                        <Text style={[styles.trendBarLabel, { color: theme.textTertiary }]} numberOfLines={1}>
                          {virtueName.substring(0, 3)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {virtueStats.length > 0 && (
              <View style={styles.virtueBreakdown}>
                <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>
                  Virtue Breakdown
                </Text>

                {virtueStats
                  .sort((a, b) => b.attempts - a.attempts)
                  .map((stat) => {
                    const virtue = VIRTUES.find(v => v.id === stat.virtueId);
                    const progressWidth = stat.attempts > 0 
                      ? Math.round(Math.min((1 - stat.avgFaults / 7) * 100, 100)) 
                      : 0;
                    
                    return (
                      <View key={stat.virtueId} style={[styles.virtueStatItem, { borderBottomColor: theme.borderLight }]}>
                        <View style={styles.virtueStatHeader}>
                          <Text style={[styles.virtueStatName, { color: theme.text }]}>
                            {virtue?.name || stat.virtueId}
                          </Text>
                          <Text style={[styles.virtueStatMeta, { color: theme.textTertiary }]}>
                            {stat.attempts} {stat.attempts === 1 ? 'week' : 'weeks'} · avg {stat.avgFaults.toFixed(1)} faults
                          </Text>
                        </View>
                        <View style={[styles.virtueProgressBar, { backgroundColor: theme.borderLight }]}>
                          <View 
                            style={[
                              styles.virtueProgressFill, 
                              { 
                                width: `${progressWidth}%`,
                                backgroundColor: progressWidth > 70 ? theme.success : theme.accent,
                              }
                            ]} 
                          />
                        </View>
                      </View>
                    );
                  })}
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyState}>
            <TrendingUp size={48} color={theme.textTertiary} strokeWidth={1} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              No data yet
            </Text>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Complete your first week of practice to see analytics and insights about your journey.
            </Text>
          </View>
        )}
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
    paddingBottom: 32,
  },
  streakSection: {
    marginBottom: 24,
  },
  streakCard: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderRadius: 0,
  },
  streakIconContainer: {
    marginBottom: 12,
  },
  streakNumber: {
    ...typography.serif.semibold,
    lineHeight: 72,
  },
  streakLabel: {
    ...typography.sans.regular,
    fontSize: sizes.body,
    marginTop: 4,
  },
  streakDivider: {
    height: 1,
    width: '100%',
    marginVertical: 24,
  },
  streakMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  streakMetaItem: {
    alignItems: 'center',
    gap: 4,
  },
  streakMetaValue: {
    ...typography.sans.semibold,
    fontSize: sizes.title,
  },
  streakMetaLabel: {
    ...typography.sans.regular,
    fontSize: sizes.caption,
  },
  streakMetaDivider: {
    width: 1,
    height: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    width: '47%',
    padding: 16,
    borderWidth: 1,
    borderRadius: 0,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    ...typography.serif.semibold,
    fontSize: sizes.large,
  },
  statLabel: {
    ...typography.sans.regular,
    fontSize: sizes.caption,
    textAlign: 'center',
  },
  insightsSection: {
    marginBottom: 32,
    paddingTop: 24,
    borderTopWidth: 1,
  },
  sectionTitle: {
    ...typography.sans.medium,
    fontSize: sizes.caption,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  insightsList: {
    gap: 0,
  },
  insightItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  insightLabel: {
    ...typography.sans.regular,
    fontSize: sizes.body,
    flex: 1,
  },
  insightValue: {
    ...typography.sans.semibold,
    fontSize: sizes.body,
  },
  trendSection: {
    marginBottom: 32,
  },
  trendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  trendChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingTop: 20,
  },
  trendBarContainer: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  trendBarValue: {
    ...typography.sans.regular,
    fontSize: 11,
  },
  trendBarBackground: {
    width: 24,
    height: 80,
    borderRadius: 2,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  trendBar: {
    width: '100%',
    borderRadius: 2,
  },
  trendBarLabel: {
    ...typography.sans.regular,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  virtueBreakdown: {
    paddingTop: 24,
  },
  virtueStatItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  virtueStatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  virtueStatName: {
    ...typography.serif.semibold,
    fontSize: sizes.label,
  },
  virtueStatMeta: {
    ...typography.sans.regular,
    fontSize: sizes.caption,
  },
  virtueProgressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  virtueProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    gap: 16,
  },
  emptyTitle: {
    ...typography.serif.semibold,
    fontSize: sizes.title,
    marginTop: 8,
  },
  emptyText: {
    ...typography.sans.regular,
    fontSize: sizes.body,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 32,
  },
});
