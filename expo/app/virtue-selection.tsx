import { useEthica } from '@/contexts/EthicaContext';
import { VIRTUES } from '@/constants/virtues';
import { useRouter } from 'expo-router';
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useColorScheme, Animated, Alert, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronDown, ChevronRight, Lock, Sparkles } from 'lucide-react-native';
import colors from '@/constants/colors';
import { typography, sizes } from '@/constants/typography';
import { useRevenueCat } from '@/contexts/RevenueCatContext';

type SelectableVirtue = {
  id: string;
  name: string;
  description: string;
  context: string;
  quote?: string;
  isCustom: boolean;
};

export default function VirtueSelection() {
  const {
    state,
    startNewWeek,
    completeOnboarding,
    getNextQueuedVirtue,
    consumeQueuedVirtue,
    getVirtuesNeedingImprovement,
    getCustomVirtues,
  } = useEthica();
  const { isPro } = useRevenueCat();
  const router = useRouter();
  const systemColorScheme = useColorScheme();
  const { width } = useWindowDimensions();
  const isDark = state.followSystemTheme ? systemColorScheme === 'dark' : state.darkMode;
  const theme = isDark ? colors.dark : colors.light;
  const nextQueuedVirtue = getNextQueuedVirtue();
  const customVirtues = getCustomVirtues();
  const needsImprovement = getVirtuesNeedingImprovement();
  const isTabletLayout = width >= 768;
  const horizontalPadding = width < 390 ? 18 : isTabletLayout ? 28 : 22;

  const [selectedVirtueId, setSelectedVirtueId] = useState<string | null>(nextQueuedVirtue);
  const [expandedVirtueId, setExpandedVirtueId] = useState<string | null>(null);
  const [isFranklinExpanded, setIsFranklinExpanded] = useState<boolean>(false);
  const franklinExpandAnim = useRef(new Animated.Value(0)).current;
  const detailExpandAnimsRef = useRef<Record<string, Animated.Value>>({});
  const entranceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entranceAnim, {
      toValue: 1,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [entranceAnim]);

  useEffect(() => {
    Animated.timing(franklinExpandAnim, {
      toValue: isFranklinExpanded ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [franklinExpandAnim, isFranklinExpanded]);

  const getDetailExpandAnim = useCallback((virtueId: string): Animated.Value => {
    if (!detailExpandAnimsRef.current[virtueId]) {
      detailExpandAnimsRef.current[virtueId] = new Animated.Value(0);
    }

    return detailExpandAnimsRef.current[virtueId];
  }, []);

  const franklinVirtues = useMemo<SelectableVirtue[]>(() => {
    return VIRTUES.map((virtue) => ({
      id: virtue.id,
      name: virtue.name,
      description: virtue.description,
      context: virtue.context,
      quote: virtue.quote,
      isCustom: false,
    }));
  }, []);

  const customVirtueItems = useMemo<SelectableVirtue[]>(() => {
    return customVirtues.map((virtue) => ({
      id: virtue.id,
      name: virtue.name,
      description: virtue.description,
      context: virtue.context || 'A custom virtue for personal growth.',
      isCustom: true,
    }));
  }, [customVirtues]);

  const allVirtues = useMemo<SelectableVirtue[]>(() => {
    return [...franklinVirtues, ...customVirtueItems];
  }, [customVirtueItems, franklinVirtues]);

  const selectedVirtue = allVirtues.find((virtue) => virtue.id === selectedVirtueId) ?? null;
  const selectedCustomVirtue = selectedVirtue?.isCustom ? selectedVirtue : null;

  const toggleVirtueDetails = useCallback((virtueId: string) => {
    const nextExpandedId = expandedVirtueId === virtueId ? null : virtueId;

    if (expandedVirtueId && expandedVirtueId !== virtueId) {
      Animated.timing(getDetailExpandAnim(expandedVirtueId), {
        toValue: 0,
        duration: 160,
        useNativeDriver: false,
      }).start();
    }

    if (nextExpandedId) {
      setExpandedVirtueId(nextExpandedId);
      Animated.timing(getDetailExpandAnim(nextExpandedId), {
        toValue: 1,
        duration: 180,
        useNativeDriver: false,
      }).start();
      return;
    }

    Animated.timing(getDetailExpandAnim(virtueId), {
      toValue: 0,
      duration: 160,
      useNativeDriver: false,
    }).start(() => {
      setExpandedVirtueId(null);
    });
  }, [expandedVirtueId, getDetailExpandAnim]);

  const handleLockedCustomVirtues = useCallback(() => {
    Alert.alert(
      'Ethica Pro required',
      'Custom virtues are part of Ethica Pro. Upgrade if you want to create and use your own principles.',
      [
        { text: 'Not now', style: 'cancel' },
        { text: 'Upgrade', onPress: () => router.push({ pathname: '/paywall', params: { returnTo: '/virtue-selection' } }) },
      ]
    );
  }, [router]);

  const handleConfirm = useCallback(() => {
    if (!selectedVirtueId) {
      return;
    }

    if (selectedVirtueId === nextQueuedVirtue) {
      consumeQueuedVirtue();
    }

    if (state.hasCompletedOnboarding) {
      void startNewWeek(selectedVirtueId);
      router.replace('/home');
      return;
    }

    completeOnboarding(selectedVirtueId);
    router.replace('/home');
  }, [completeOnboarding, consumeQueuedVirtue, nextQueuedVirtue, router, selectedVirtueId, startNewWeek, state.hasCompletedOnboarding]);

  const renderVirtueRow = (virtue: SelectableVirtue, variant: 'franklin' | 'custom') => {
    const isExpanded = expandedVirtueId === virtue.id;
    const expandAnim = getDetailExpandAnim(virtue.id);
    const isSelected = selectedVirtueId === virtue.id;
    const needsWork = !virtue.isCustom && needsImprovement.includes(virtue.id);

    return (
      <View key={virtue.id} style={styles.virtueRowWrap}>
        <TouchableOpacity
          style={[
            styles.virtueRow,
            {
              backgroundColor: theme.surface,
              borderColor: isSelected ? theme.accent : theme.border,
            },
          ]}
          onPress={() => setSelectedVirtueId(virtue.id)}
          activeOpacity={0.72}
          accessibilityLabel={`${virtue.name}: ${virtue.description}`}
          accessibilityRole="radio"
          accessibilityState={{ selected: isSelected }}
          testID={`virtue-${virtue.id}`}
        >
          <View style={styles.virtueRowMain}>
            <View style={styles.virtueRowTop}>
              <Text numberOfLines={1} style={[styles.virtueName, { color: theme.text }]}>
                {virtue.name}
              </Text>
              {needsWork ? (
                <View style={[styles.inlineBadge, { borderColor: theme.textTertiary, backgroundColor: theme.background }]}>
                  <Text style={[styles.inlineBadgeText, { color: theme.textTertiary }]}>Focus</Text>
                </View>
              ) : null}
              {variant === 'custom' ? (
                <View style={[styles.inlineBadge, { borderColor: theme.accent, backgroundColor: theme.accent + '12' }]}>
                  <Text style={[styles.inlineBadgeText, { color: theme.accent }]}>Custom</Text>
                </View>
              ) : null}
            </View>
            <Text numberOfLines={2} style={[styles.virtueDescription, { color: theme.textSecondary }]}>
              {virtue.description}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.expandButton}
            onPress={() => toggleVirtueDetails(virtue.id)}
            activeOpacity={0.7}
            accessibilityLabel={isExpanded ? 'Collapse details' : 'Expand details'}
            accessibilityRole="button"
            testID={`expand-${virtue.id}`}
          >
            <Animated.View
              style={{
                transform: [
                  {
                    rotate: expandAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '180deg'],
                    }),
                  },
                ],
              }}
            >
              <ChevronDown size={16} color={theme.textTertiary} strokeWidth={1.8} />
            </Animated.View>
          </TouchableOpacity>
        </TouchableOpacity>

        {isExpanded ? (
          <Animated.View
            style={[
              styles.expandedContent,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                opacity: expandAnim,
                maxHeight: expandAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, variant === 'custom' ? 150 : 260],
                }),
              },
            ]}
          >
            <Text style={[styles.contextLabel, { color: theme.textTertiary }]}>
              {variant === 'custom' ? 'Why it matters' : 'Context'}
            </Text>
            <Text style={[styles.contextText, { color: theme.textSecondary }]}>{virtue.context}</Text>
            {!virtue.isCustom && virtue.quote ? (
              <>
                <View style={[styles.expandedDivider, { backgroundColor: theme.borderLight }]} />
                <Text style={[styles.quoteText, { color: theme.text }]}>&ldquo;{virtue.quote}&rdquo;</Text>
                <Text style={[styles.quoteAttribution, { color: theme.textTertiary }]}>— Benjamin Franklin</Text>
              </>
            ) : null}
          </Animated.View>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <Animated.View
        style={[
          styles.screen,
          {
            opacity: entranceAnim,
            transform: [
              {
                translateY: entranceAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [18, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={[styles.header, { paddingHorizontal: horizontalPadding }]}> 
          <Text style={[styles.title, { color: theme.text }]}>Select a virtue</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>You will focus on this virtue for the next 7 days.</Text>
          {nextQueuedVirtue ? (
            <View style={[styles.queueNotice, { backgroundColor: theme.surface, borderColor: theme.accent }]}> 
              <Text style={[styles.queueNoticeText, { color: theme.textSecondary }]}>Next in queue: <Text style={[styles.queueNoticeStrong, { color: theme.text }]}>{VIRTUES.find((virtue) => virtue.id === nextQueuedVirtue)?.name}</Text></Text>
            </View>
          ) : null}
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalPadding }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.columns, isTabletLayout && styles.columnsTablet]}>
            <View style={[styles.column, { backgroundColor: theme.background }]}> 
              <TouchableOpacity
                style={[styles.sectionHeader, { borderColor: theme.border, backgroundColor: theme.surface }]}
                onPress={() => setIsFranklinExpanded((currentValue) => !currentValue)}
                activeOpacity={0.78}
                testID="franklin-virtues-toggle"
              >
                <View style={styles.sectionHeaderTextWrap}>
                  <Text style={[styles.sectionEyebrow, { color: theme.textTertiary }]}>Franklin&apos;s virtues</Text>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>13 classic virtues</Text>
                </View>
                <Animated.View
                  style={{
                    transform: [
                      {
                        rotate: franklinExpandAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['-90deg', '0deg'],
                        }),
                      },
                    ],
                  }}
                >
                  <ChevronRight size={18} color={theme.textTertiary} strokeWidth={1.8} />
                </Animated.View>
              </TouchableOpacity>

              {isFranklinExpanded ? (
                <Animated.View
                  style={[
                    styles.sectionBody,
                    {
                      opacity: franklinExpandAnim,
                      maxHeight: franklinExpandAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 1400],
                      }),
                    },
                  ]}
                >
                  {franklinVirtues.map((virtue) => renderVirtueRow(virtue, 'franklin'))}
                </Animated.View>
              ) : (
                <View style={[styles.collapsedHint, { borderColor: theme.border, backgroundColor: theme.surface }]}> 
                  <Text style={[styles.collapsedHintText, { color: theme.textSecondary }]}>Collapsed by default to keep the selection screen compact.</Text>
                </View>
              )}
            </View>

            <View style={styles.column}>
              <TouchableOpacity
                style={[styles.sectionHeader, { borderColor: theme.border, backgroundColor: theme.surface }]}
                onPress={() => {
                  if (!isPro) {
                    handleLockedCustomVirtues();
                    return;
                  }

                  router.push('/custom-virtues');
                }}
                activeOpacity={0.78}
                testID="custom-virtues-section"
              >
                <View style={styles.sectionHeaderTextWrap}>
                  <View style={styles.customHeaderRow}>
                    <Text style={[styles.sectionEyebrow, { color: theme.textTertiary }]}>Custom virtues</Text>
                    {!isPro ? (
                      <View style={[styles.premiumPill, { backgroundColor: theme.accent + '14', borderColor: theme.accent + '40' }]}>
                        <Sparkles size={10} color={theme.accent} strokeWidth={2} />
                        <Text style={[styles.premiumPillText, { color: theme.accent }]}>Pro</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>{isPro ? 'Your personal principles' : 'Premium only'}</Text>
                </View>
                {!isPro ? <Lock size={16} color={theme.textTertiary} strokeWidth={1.8} /> : <ChevronRight size={18} color={theme.textTertiary} strokeWidth={1.8} />}
              </TouchableOpacity>

              {!isPro ? (
                <TouchableOpacity
                  style={[styles.lockedPanel, { borderColor: theme.border, backgroundColor: theme.surface }]}
                  onPress={handleLockedCustomVirtues}
                  activeOpacity={0.78}
                  testID="locked-custom-virtues-panel"
                >
                  <Text style={[styles.lockedTitle, { color: theme.text }]}>Unlock custom virtues</Text>
                  <Text style={[styles.lockedText, { color: theme.textSecondary }]}>Create your own virtues with a subtle premium upgrade path.</Text>
                </TouchableOpacity>
              ) : customVirtueItems.length > 0 ? (
                <View style={styles.sectionBody}>
                  {customVirtueItems.map((virtue) => renderVirtueRow(virtue, 'custom'))}
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.emptyCustomPanel, { borderColor: theme.border, backgroundColor: theme.surface }]}
                  onPress={() => router.push('/custom-virtues')}
                  activeOpacity={0.78}
                  testID="empty-custom-virtues-panel"
                >
                  <Text style={[styles.lockedTitle, { color: theme.text }]}>No custom virtues yet</Text>
                  <Text style={[styles.lockedText, { color: theme.textSecondary }]}>Tap here to add your own principles.</Text>
                </TouchableOpacity>
              )}

              {selectedCustomVirtue ? (
                <View style={[styles.selectedCustomPanel, { borderColor: theme.accent, backgroundColor: theme.surface }]}> 
                  <Text style={[styles.selectedLabel, { color: theme.textTertiary }]}>Selected custom virtue</Text>
                  <Text style={[styles.selectedName, { color: theme.text }]}>{selectedCustomVirtue.name}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </ScrollView>

        {selectedVirtue ? (
          <View style={[styles.footer, { borderTopColor: theme.border, paddingHorizontal: horizontalPadding }]}> 
            <Text style={[styles.confirmationText, { color: theme.textSecondary }]}>Selected: <Text style={[styles.confirmationVirtue, { color: theme.text }]}>{selectedVirtue.name}</Text></Text>
            <TouchableOpacity
              style={[styles.confirmButton, { borderColor: theme.border, backgroundColor: theme.surface }]}
              onPress={handleConfirm}
              activeOpacity={0.78}
              accessibilityLabel={`Confirm selection of ${selectedVirtue.name}`}
              accessibilityRole="button"
              testID="confirm-virtue-button"
            >
              <Text style={[styles.confirmButtonText, { color: theme.text }]}>Confirm</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  header: {
    paddingTop: 18,
    paddingBottom: 14,
    gap: 6,
  },
  title: {
    ...typography.serif.semibold,
    fontSize: sizes.large,
  },
  subtitle: {
    ...typography.sans.regular,
    fontSize: sizes.body,
    lineHeight: 21,
  },
  queueNotice: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  queueNoticeText: {
    ...typography.sans.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  queueNoticeStrong: {
    ...typography.sans.semibold,
    fontSize: 13,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  columns: {
    gap: 12,
  },
  columnsTablet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  column: {
    flex: 1,
    gap: 10,
  },
  sectionHeader: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionHeaderTextWrap: {
    flex: 1,
    gap: 2,
  },
  sectionEyebrow: {
    ...typography.sans.medium,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    ...typography.serif.semibold,
    fontSize: sizes.body,
  },
  customHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  premiumPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  premiumPillText: {
    ...typography.sans.semibold,
    fontSize: 10,
  },
  collapsedHint: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  collapsedHintText: {
    ...typography.sans.regular,
    fontSize: 12,
    lineHeight: 17,
  },
  sectionBody: {
    gap: 8,
    overflow: 'hidden',
  },
  virtueRowWrap: {
    gap: 0,
  },
  virtueRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  virtueRowMain: {
    flex: 1,
    gap: 4,
  },
  virtueRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  virtueName: {
    ...typography.serif.semibold,
    fontSize: 15,
    flexShrink: 1,
  },
  inlineBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  inlineBadgeText: {
    ...typography.sans.medium,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  virtueDescription: {
    ...typography.sans.regular,
    fontSize: 12,
    lineHeight: 17,
  },
  expandButton: {
    padding: 4,
    marginTop: 1,
  },
  expandedContent: {
    marginTop: -2,
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    overflow: 'hidden',
    gap: 6,
  },
  contextLabel: {
    ...typography.sans.medium,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  contextText: {
    ...typography.sans.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  expandedDivider: {
    height: 1,
    marginVertical: 2,
  },
  quoteText: {
    ...typography.serif.regular,
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic' as const,
  },
  quoteAttribution: {
    ...typography.sans.regular,
    fontSize: 11,
  },
  lockedPanel: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 4,
  },
  emptyCustomPanel: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 4,
  },
  lockedTitle: {
    ...typography.sans.semibold,
    fontSize: 14,
  },
  lockedText: {
    ...typography.sans.regular,
    fontSize: 12,
    lineHeight: 17,
  },
  selectedCustomPanel: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
  },
  selectedLabel: {
    ...typography.sans.medium,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  selectedName: {
    ...typography.serif.semibold,
    fontSize: 14,
  },
  footer: {
    borderTopWidth: 1,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 10,
  },
  confirmationText: {
    ...typography.sans.regular,
    fontSize: 13,
    textAlign: 'center',
  },
  confirmationVirtue: {
    ...typography.serif.semibold,
    fontSize: 13,
  },
  confirmButton: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmButtonText: {
    ...typography.sans.semibold,
    fontSize: sizes.label,
  },
});
