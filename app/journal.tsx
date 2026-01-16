import { useEthica } from '@/contexts/EthicaContext';
import { VIRTUES } from '@/constants/virtues';
import { useRouter } from 'expo-router';
import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Filter, TrendingUp, BookMarked } from 'lucide-react-native';
import colors from '@/constants/colors';
import { typography, sizes } from '@/constants/typography';

export default function Journal() {
  const { state, getVirtueHistory } = useEthica();
  const router = useRouter();
  const systemColorScheme = useColorScheme();
  const isDark = state.followSystemTheme ? systemColorScheme === 'dark' : state.darkMode;
  const theme = isDark ? colors.dark : colors.light;
  const [selectedVirtueFilter, setSelectedVirtueFilter] = useState<string | null>(null);
  const [showStats, setShowStats] = useState<boolean>(true);
  const { width: screenWidth } = useWindowDimensions();

  const gridGap = screenWidth < 380 ? 6 : 12;
  const dayCellSize = Math.min(36, Math.floor((screenWidth - 48 - 40 - gridGap * 6) / 7));

  const sortedRecords = [...state.weekRecords].sort((a, b) => {
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
  });

  const filteredRecords = selectedVirtueFilter
    ? sortedRecords.filter(r => r.virtueId === selectedVirtueFilter)
    : sortedRecords;

  const stats = useMemo(() => {
    const totalWeeks = state.weekRecords.length;
    const totalFaults = state.weekRecords.reduce((sum, r) => 
      sum + r.observations.filter(o => o.hasFault).length, 0
    );
    const avgFaultsPerWeek = totalWeeks > 0 ? (totalFaults / totalWeeks).toFixed(1) : '0';
    
    const virtueStats = VIRTUES.map(virtue => {
      const history = state.weekRecords.filter(r => r.virtueId === virtue.id);
      const attempts = history.length;
      const totalFaultsForVirtue = history.reduce((sum, r) => 
        sum + r.observations.filter(o => o.hasFault).length, 0
      );
      const avgFaults = attempts > 0 ? (totalFaultsForVirtue / attempts).toFixed(1) : null;
      return { virtue, attempts, avgFaults, totalFaults: totalFaultsForVirtue };
    }).filter(s => s.attempts > 0)
      .sort((a, b) => b.attempts - a.attempts);

    return { totalWeeks, totalFaults, avgFaultsPerWeek, virtueStats };
  }, [state.weekRecords]);

  const practiceCount = useMemo(() => {
    const counts: Record<string, number> = {};
    VIRTUES.forEach(v => {
      counts[v.id] = state.weekRecords.filter(r => r.virtueId === v.id).length;
    });
    return counts;
  }, [state.weekRecords]);

  const formatDateRange = (startDate: string, endDate: string): string => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
    const startDay = start.getDate();
    const endDay = end.getDate();
    
    if (startMonth === endMonth) {
      return `${startMonth} ${startDay}–${endDay}, ${start.getFullYear()}`;
    }
    return `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${start.getFullYear()}`;
  };

  const getDayOfWeek = (dayIndex: number): string => {
    const days = state.weekStartsMonday 
      ? ['M', 'T', 'W', 'T', 'F', 'S', 'S']
      : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    return days[dayIndex];
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.canGoBack() ? router.back() : router.replace('/home')}
          activeOpacity={0.7}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          testID="journal-back-button"
        >
          <ArrowLeft size={24} color={theme.text} strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Journal
        </Text>
        <TouchableOpacity
          style={styles.statsButton}
          onPress={() => setShowStats(!showStats)}
          activeOpacity={0.7}
          accessibilityLabel={showStats ? 'Hide statistics' : 'Show statistics'}
          accessibilityRole="button"
          testID="toggle-stats-button"
        >
          <TrendingUp size={22} color={showStats ? theme.accent : theme.textTertiary} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {showStats && sortedRecords.length > 0 && (
          <View style={[styles.statsContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.statsHeader}>
              <TrendingUp size={20} color={theme.text} strokeWidth={1.5} />
              <Text style={[styles.statsTitle, { color: theme.text }]}>Your Progress</Text>
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: theme.text }]}>{stats.totalWeeks}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Weeks Completed</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: theme.text }]}>{stats.avgFaultsPerWeek}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Avg Faults/Week</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: theme.text }]}>{stats.virtueStats.length}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Virtues Practiced</Text>
              </View>
            </View>
            {stats.virtueStats.length > 0 && (
              <View style={[styles.virtueStatsSection, { borderTopColor: theme.borderLight }]}>
                <Text style={[styles.virtueStatsTitle, { color: theme.textTertiary }]}>By Virtue</Text>
                {stats.virtueStats.slice(0, 5).map(({ virtue, attempts, avgFaults }) => (
                  <View key={virtue.id} style={styles.virtueStatRow}>
                    <Text style={[styles.virtueStatName, { color: theme.text }]}>{virtue.name}</Text>
                    <View style={styles.virtueStatValues}>
                      <Text style={[styles.virtueStatText, { color: theme.textSecondary }]}>
                        {attempts} {attempts === 1 ? 'week' : 'weeks'}
                      </Text>
                      <Text style={[styles.virtueStatDivider, { color: theme.textTertiary }]}>·</Text>
                      <Text style={[styles.virtueStatText, { color: theme.textSecondary }]}>
                        {avgFaults} avg faults
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {sortedRecords.length > 0 && (
          <View style={styles.filterSection}>
            <View style={styles.filterHeader}>
              <Filter size={18} color={theme.textTertiary} strokeWidth={1.5} />
              <Text style={[styles.filterTitle, { color: theme.textTertiary }]}>Filter by Virtue</Text>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScrollContent}
            >
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: !selectedVirtueFilter ? theme.accent : theme.surface,
                    borderColor: !selectedVirtueFilter ? theme.accent : theme.border,
                  }
                ]}
                onPress={() => setSelectedVirtueFilter(null)}
                activeOpacity={0.7}
                accessibilityLabel="Show all virtues"
                accessibilityRole="button"
                accessibilityState={{ selected: !selectedVirtueFilter }}
                testID="filter-all"
              >
                <Text style={[
                  styles.filterChipText,
                  { color: !selectedVirtueFilter ? '#FFFFFF' : theme.text }
                ]}>
                  All
                </Text>
              </TouchableOpacity>
              {VIRTUES.filter(v => practiceCount[v.id] > 0).map(virtue => (
                <TouchableOpacity
                  key={virtue.id}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: selectedVirtueFilter === virtue.id ? theme.accent : theme.surface,
                      borderColor: selectedVirtueFilter === virtue.id ? theme.accent : theme.border,
                    }
                  ]}
                  onPress={() => setSelectedVirtueFilter(virtue.id)}
                  activeOpacity={0.7}
                  accessibilityLabel={`Filter by ${virtue.name}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selectedVirtueFilter === virtue.id }}
                  testID={`filter-${virtue.id}`}
                >
                  <Text style={[
                    styles.filterChipText,
                    { color: selectedVirtueFilter === virtue.id ? '#FFFFFF' : theme.text }
                  ]}>
                    {virtue.name}
                  </Text>
                  {practiceCount[virtue.id] > 1 && (
                    <View style={[
                      styles.countBadge,
                      { backgroundColor: selectedVirtueFilter === virtue.id ? 'rgba(255,255,255,0.3)' : theme.borderLight }
                    ]}>
                      <Text style={[
                        styles.countBadgeText,
                        { color: selectedVirtueFilter === virtue.id ? '#FFFFFF' : theme.textTertiary }
                      ]}>
                        {practiceCount[virtue.id]}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {filteredRecords.length > 0 ? (
          <View style={styles.recordsContainer}>
            {filteredRecords.map((record, recordIndex) => {
              const virtue = VIRTUES.find(v => v.id === record.virtueId);
              if (!virtue) return null;

              const faultCount = record.observations.filter(o => o.hasFault).length;
              const notesExist = record.observations.some(o => o.note);
              const virtueHistory = getVirtueHistory(record.virtueId);
              const attemptNumber = virtueHistory.findIndex(r => r.startDate === record.startDate) + 1;
              const previousAttempts = virtueHistory.slice(0, virtueHistory.findIndex(r => r.startDate === record.startDate));

              return (
                <View 
                  key={`${record.virtueId}-${record.startDate}`}
                  style={[styles.recordCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                >
                  <View style={styles.recordHeader}>
                    <View style={styles.recordTitleContainer}>
                      <View style={styles.virtueNameRow}>
                        <Text style={[styles.virtueName, { color: theme.text }]}>
                          {virtue.name}
                        </Text>
                        {virtueHistory.length > 1 && (
                          <View style={[styles.attemptBadge, { backgroundColor: theme.borderLight }]}>
                            <Text style={[styles.attemptBadgeText, { color: theme.textSecondary }]}>
                              #{attemptNumber}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.dateRange, { color: theme.textTertiary }]}>
                        {formatDateRange(record.startDate, record.endDate)}
                      </Text>
                    </View>
                    <View style={styles.faultSummary}>
                      <Text style={[styles.faultNumber, { color: theme.text }]}>
                        {faultCount}
                      </Text>
                      <Text style={[styles.faultLabel, { color: theme.textSecondary }]}>
                        {faultCount === 1 ? 'fault' : 'faults'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.weekGridContainer}>
                    <View style={[styles.weekGrid, { gap: gridGap }]}>
                      {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
                        const startDate = new Date(record.startDate);
                        const dayDate = new Date(startDate);
                        dayDate.setDate(dayDate.getDate() + dayIndex);
                        const dateStr = dayDate.toISOString().split('T')[0];
                        const obs = record.observations.find(o => o.date === dateStr);
                        return (
                          <View key={dayIndex} style={styles.dayColumn}>
                            <Text style={[styles.dayLabel, { color: theme.textTertiary }]}>
                              {getDayOfWeek(dayIndex)}
                            </Text>
                            <View style={[styles.dayCell, { borderColor: theme.border, width: dayCellSize, height: dayCellSize }]}>
                              {obs?.hasFault && (
                                <View style={[styles.faultDot, { backgroundColor: theme.faultDot }]} />
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>

                  {previousAttempts.length > 0 && (
                    <View style={[styles.comparisonSection, { borderTopColor: theme.borderLight, backgroundColor: theme.backgroundSecondary }]}>
                      <Text style={[styles.comparisonTitle, { color: theme.textTertiary }]}>Previous Attempts</Text>
                      <View style={styles.comparisonList}>
                        {previousAttempts.map((prevRecord, idx) => {
                          const prevFaults = prevRecord.observations.filter(o => o.hasFault).length;
                          const diff = prevFaults - faultCount;
                          const isImprovement = diff > 0;
                          return (
                            <View key={idx} style={styles.comparisonItem}>
                              <Text style={[styles.comparisonWeek, { color: theme.textSecondary }]}>
                                Week #{idx + 1}
                              </Text>
                              <View style={styles.comparisonFaults}>
                                <Text style={[styles.comparisonFaultCount, { color: theme.text }]}>
                                  {prevFaults} {prevFaults === 1 ? 'fault' : 'faults'}
                                </Text>
                                {diff !== 0 && (
                                  <Text style={[
                                    styles.comparisonDiff,
                                    { color: isImprovement ? theme.success : theme.textTertiary }
                                  ]}>
                                    {isImprovement ? `(-${diff})` : `(+${Math.abs(diff)})`}
                                  </Text>
                                )}
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {notesExist && (
                    <View style={[styles.notesSection, { borderTopColor: theme.borderLight }]}>
                      <Text style={[styles.notesTitle, { color: theme.textTertiary }]}>
                        Notes
                      </Text>
                      {record.observations.map((obs, index) => {
                        if (!obs.note) return null;
                        const date = new Date(obs.date);
                        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                        return (
                          <View key={index} style={styles.noteItem}>
                            <Text style={[styles.noteDay, { color: theme.textSecondary }]}>
                              {dayName}:
                            </Text>
                            <Text style={[styles.noteText, { color: theme.textSecondary }]}>
                              {obs.note}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <BookMarked size={48} color={theme.textTertiary} strokeWidth={1.5} />
            <Text style={[styles.emptyText, { color: theme.text }]}>
              Begin your first week
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.textTertiary }]}>
              Complete your first week to see your progress here. Each completed week becomes part of your historical record.
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
  statsButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 20,
  },
  statsContainer: {
    borderWidth: 1,
    borderRadius: 0,
    padding: 20,
    gap: 20,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statsTitle: {
    ...typography.serif.semibold,
    fontSize: sizes.title,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    ...typography.serif.semibold,
    fontSize: 32,
  },
  statLabel: {
    ...typography.sans.regular,
    fontSize: sizes.caption,
    textAlign: 'center',
  },
  virtueStatsSection: {
    borderTopWidth: 1,
    paddingTop: 16,
    gap: 12,
  },
  virtueStatsTitle: {
    ...typography.sans.medium,
    fontSize: sizes.caption,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  virtueStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  virtueStatName: {
    ...typography.serif.semibold,
    fontSize: sizes.body,
  },
  virtueStatValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  virtueStatText: {
    ...typography.sans.regular,
    fontSize: sizes.caption,
  },
  virtueStatDivider: {
    ...typography.sans.regular,
    fontSize: sizes.caption,
  },
  filterSection: {
    gap: 12,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  filterTitle: {
    ...typography.sans.medium,
    fontSize: sizes.caption,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  filterScrollContent: {
    gap: 8,
    paddingHorizontal: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 20,
    gap: 8,
  },
  filterChipText: {
    ...typography.sans.medium,
    fontSize: sizes.caption,
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  countBadgeText: {
    ...typography.sans.semibold,
    fontSize: 10,
  },
  recordsContainer: {
    gap: 24,
    paddingTop: 8,
  },
  recordCard: {
    borderWidth: 1,
    borderRadius: 0,
    padding: 20,
    gap: 20,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  recordTitleContainer: {
    flex: 1,
    gap: 4,
  },
  virtueNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attemptBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 2,
  },
  attemptBadgeText: {
    ...typography.sans.medium,
    fontSize: 11,
  },
  virtueName: {
    ...typography.serif.semibold,
    fontSize: sizes.title,
  },
  dateRange: {
    ...typography.sans.regular,
    fontSize: sizes.caption,
  },
  faultSummary: {
    alignItems: 'flex-end',
    gap: 2,
  },
  faultNumber: {
    ...typography.serif.semibold,
    fontSize: 28,
  },
  faultLabel: {
    ...typography.sans.regular,
    fontSize: sizes.caption,
  },
  weekGridContainer: {
    alignItems: 'center',
  },
  weekGrid: {
    flexDirection: 'row',
  },
  dayColumn: {
    alignItems: 'center',
    gap: 6,
  },
  dayLabel: {
    ...typography.sans.medium,
    fontSize: sizes.caption,
  },
  dayCell: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faultDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  comparisonSection: {
    borderTopWidth: 1,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    marginTop: 4,
    gap: 12,
  },
  comparisonTitle: {
    ...typography.sans.medium,
    fontSize: sizes.caption,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  comparisonList: {
    gap: 8,
  },
  comparisonItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  comparisonWeek: {
    ...typography.sans.medium,
    fontSize: sizes.caption,
  },
  comparisonFaults: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  comparisonFaultCount: {
    ...typography.sans.regular,
    fontSize: sizes.caption,
  },
  comparisonDiff: {
    ...typography.sans.semibold,
    fontSize: sizes.caption,
  },
  notesSection: {
    borderTopWidth: 1,
    paddingTop: 16,
    gap: 12,
  },
  notesTitle: {
    ...typography.sans.medium,
    fontSize: sizes.caption,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  noteItem: {
    flexDirection: 'row',
    gap: 8,
  },
  noteDay: {
    ...typography.sans.medium,
    fontSize: sizes.body,
    minWidth: 36,
  },
  noteText: {
    ...typography.sans.regular,
    fontSize: sizes.body,
    flex: 1,
    lineHeight: 22,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 48,
    gap: 16,
  },
  emptyText: {
    ...typography.serif.semibold,
    fontSize: sizes.title,
    textAlign: 'center',
  },
  emptySubtext: {
    ...typography.sans.regular,
    fontSize: sizes.body,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 22,
  },
});
