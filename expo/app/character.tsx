import { useEthica } from '@/contexts/EthicaContext';
import { VIRTUES } from '@/constants/virtues';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react-native';
import colors from '@/constants/colors';
import { typography, sizes } from '@/constants/typography';

export default function Character() {
  const { state, getVirtueHistory } = useEthica();
  const router = useRouter();
  const systemColorScheme = useColorScheme();
  const isDark = state.followSystemTheme ? systemColorScheme === 'dark' : state.darkMode;
  const theme = isDark ? colors.dark : colors.light;
  const [expandedVirtueId, setExpandedVirtueId] = useState<string | null>(null);

  const virtueStats = useMemo(() => {
    return VIRTUES.map(virtue => {
      const history = getVirtueHistory(virtue.id);
      const totalWeeks = history.length;
      const totalFaults = history.reduce((sum, week) => {
        return sum + week.observations.filter(o => o.hasFault).length;
      }, 0);

      return {
        virtue,
        totalWeeks,
        totalFaults,
        history,
      };
    }).filter(stat => stat.totalWeeks > 0);
  }, [getVirtueHistory]);

  const totalWeeksPracticed = virtueStats.reduce((sum, stat) => sum + stat.totalWeeks, 0);

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
        >
          <ArrowLeft size={24} color={theme.text} strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Character
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {totalWeeksPracticed > 0 ? (
          <>
            <View style={styles.summarySection}>
              <Text style={[styles.summaryNumber, { color: theme.text }]}>
                {totalWeeksPracticed}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                {totalWeeksPracticed === 1 ? 'week practiced' : 'weeks practiced'}
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />

            <View style={styles.virtuesSection}>
              <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>
                Virtues Practiced
              </Text>

              {virtueStats.map((stat) => {
                const isExpanded = expandedVirtueId === stat.virtue.id;
                return (
                  <View
                    key={stat.virtue.id}
                    style={[styles.virtueItem, { borderBottomColor: theme.borderLight }]}
                  >
                    <TouchableOpacity
                      style={styles.virtueHeader}
                      onPress={() => setExpandedVirtueId(isExpanded ? null : stat.virtue.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.virtueHeaderLeft}>
                        <Text style={[styles.virtueName, { color: theme.text }]}>
                          {stat.virtue.name}
                        </Text>
                        <Text style={[styles.weekCount, { color: theme.textTertiary }]}>
                          {stat.totalWeeks} {stat.totalWeeks === 1 ? 'cycle' : 'cycles'}
                        </Text>
                      </View>
                      {isExpanded ? (
                        <ChevronUp size={20} color={theme.textTertiary} strokeWidth={1.5} />
                      ) : (
                        <ChevronDown size={20} color={theme.textTertiary} strokeWidth={1.5} />
                      )}
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={[styles.virtueDetails, { backgroundColor: theme.backgroundSecondary, borderColor: theme.borderLight }]}>
                        <View style={styles.virtueDescriptionSection}>
                          <Text style={[styles.virtueDescriptionLabel, { color: theme.textTertiary }]}>
                            Precept
                          </Text>
                          <Text style={[styles.virtueDescriptionText, { color: theme.text }]}>
                            {stat.virtue.fullDescription}
                          </Text>
                        </View>
                        <View style={[styles.detailsDivider, { backgroundColor: theme.borderLight }]} />
                        <View style={styles.virtueContextSection}>
                          <Text style={[styles.virtueDescriptionLabel, { color: theme.textTertiary }]}>
                            Context
                          </Text>
                          <Text style={[styles.virtueContextText, { color: theme.textSecondary }]}>
                            {stat.virtue.context}
                          </Text>
                        </View>
                        <View style={[styles.detailsDivider, { backgroundColor: theme.borderLight }]} />
                        <View style={styles.quoteSection}>
                          <Text style={[styles.quote, { color: theme.text }]}>
                            &ldquo;{stat.virtue.quote}&rdquo;
                          </Text>
                          <Text style={[styles.quoteAttribution, { color: theme.textTertiary }]}>
                            — Benjamin Franklin
                          </Text>
                        </View>
                        <View style={[styles.detailsDivider, { backgroundColor: theme.borderLight }]} />
                        <View style={styles.allAttemptsContainer}>
                          <Text style={[styles.virtueDescriptionLabel, { color: theme.textTertiary }]}>
                            History
                          </Text>
                          {stat.history.map((week, index) => {
                            const faults = week.observations.filter(o => o.hasFault).length;
                            return (
                              <View key={week.startDate} style={styles.attemptRow}>
                                <Text style={[styles.attemptNumber, { color: theme.textTertiary }]}>
                                  Week {index + 1}
                                </Text>
                                <Text style={[styles.attemptFaultCount, { color: theme.text }]}>
                                  {faults} {faults === 1 ? 'fault' : 'faults'}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    )}
                </View>
              );
            })}
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No practice recorded yet.
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.textTertiary }]}>
              Complete your first week to begin building your character history.
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
    paddingHorizontal: 32,
    paddingBottom: 32,
  },
  summarySection: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  summaryNumber: {
    ...typography.serif.semibold,
    fontSize: 56,
    lineHeight: 64,
  },
  summaryLabel: {
    ...typography.sans.regular,
    fontSize: sizes.body,
  },
  divider: {
    height: 1,
    marginVertical: 24,
  },
  virtuesSection: {
    gap: 24,
  },
  sectionTitle: {
    ...typography.sans.medium,
    fontSize: sizes.caption,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  virtueItem: {
    paddingBottom: 24,
    borderBottomWidth: 1,
    gap: 16,
  },
  virtueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  virtueHeaderLeft: {
    flex: 1,
    gap: 4,
  },
  virtueName: {
    ...typography.serif.semibold,
    fontSize: sizes.title,
  },
  weekCount: {
    ...typography.sans.regular,
    fontSize: sizes.caption,
  },
  virtueDetails: {
    marginTop: 12,
    padding: 16,
    borderWidth: 1,
    borderRadius: 0,
    gap: 16,
  },
  virtueDescriptionSection: {
    gap: 8,
  },
  virtueDescriptionLabel: {
    ...typography.sans.medium,
    fontSize: sizes.caption,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  virtueDescriptionText: {
    ...typography.serif.regular,
    fontSize: sizes.body,
    lineHeight: 22,
  },
  detailsDivider: {
    height: 1,
  },
  virtueContextSection: {
    gap: 8,
  },
  virtueContextText: {
    ...typography.sans.regular,
    fontSize: sizes.body,
    lineHeight: 22,
  },
  quoteSection: {
    gap: 8,
  },
  quote: {
    ...typography.serif.regular,
    fontSize: sizes.body,
    lineHeight: 24,
    fontStyle: 'italic' as const,
  },
  quoteAttribution: {
    ...typography.sans.regular,
    fontSize: sizes.caption,
  },
  allAttemptsContainer: {
    gap: 8,
  },
  attemptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  attemptNumber: {
    ...typography.sans.regular,
    fontSize: sizes.body,
  },
  attemptFaultCount: {
    ...typography.sans.medium,
    fontSize: sizes.body,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    gap: 12,
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
