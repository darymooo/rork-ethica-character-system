import { useEthica } from '@/contexts/EthicaContext';
import { VIRTUES } from '@/constants/virtues';
import { useRouter } from 'expo-router';
import { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useColorScheme, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react-native';
import colors from '@/constants/colors';
import { typography, sizes } from '@/constants/typography';

export default function VirtueSelection() {
  const { state, startNewWeek, completeOnboarding, getNextQueuedVirtue, consumeQueuedVirtue, getVirtuesNeedingImprovement, getCustomVirtues } = useEthica();
  const router = useRouter();
  const systemColorScheme = useColorScheme();
  const isDark = state.followSystemTheme ? systemColorScheme === 'dark' : state.darkMode;
  const theme = isDark ? colors.dark : colors.light;

  const nextQueuedVirtue = getNextQueuedVirtue();
  const [selectedVirtueId, setSelectedVirtueId] = useState<string | null>(nextQueuedVirtue);
  const [expandedVirtueId, setExpandedVirtueId] = useState<string | null>(null);
  const expandAnimsRef = useRef<{ [key: string]: Animated.Value }>({});
  const entranceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entranceAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const getExpandAnim = (virtueId: string) => {
    if (!expandAnimsRef.current[virtueId]) {
      expandAnimsRef.current[virtueId] = new Animated.Value(0);
    }
    return expandAnimsRef.current[virtueId];
  };

  const toggleExpanded = (virtueId: string) => {
    const isCurrentlyExpanded = expandedVirtueId === virtueId;
    const expandAnim = getExpandAnim(virtueId);

    if (isCurrentlyExpanded) {
      Animated.timing(expandAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start(() => setExpandedVirtueId(null));
    } else {
      setExpandedVirtueId(virtueId);
      Animated.timing(expandAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  const needsImprovement = getVirtuesNeedingImprovement();
  const customVirtues = getCustomVirtues();

  const allVirtues = useMemo(() => {
    const franklinVirtues = VIRTUES.map(v => ({ ...v, isCustom: false }));
    const customs = customVirtues.map(v => ({
      id: v.id,
      name: v.name,
      description: v.description,
      fullDescription: v.description,
      context: v.context || 'A custom virtue for personal growth.',
      quote: '',
      isCustom: true,
    }));
    return [...franklinVirtues, ...customs];
  }, [customVirtues]);

  const handleConfirm = () => {
    if (selectedVirtueId) {
      if (selectedVirtueId === nextQueuedVirtue) {
        consumeQueuedVirtue();
      }
      
      if (state.hasCompletedOnboarding) {
        startNewWeek(selectedVirtueId);
        router.replace('/home');
      } else {
        completeOnboarding(selectedVirtueId);
        router.replace('/home');
      }
    }
  };

  const selectedVirtue = allVirtues.find(v => v.id === selectedVirtueId);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>
          Select a virtue
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          You will focus on this virtue for the next 7 days.
        </Text>
        {nextQueuedVirtue && (
          <View style={[styles.queueNotice, { backgroundColor: theme.surface, borderColor: theme.accent }]}>
            <Text style={[styles.queueNoticeText, { color: theme.textSecondary }]}>
              Next in queue: <Text style={{ color: theme.text, fontWeight: '600' as const }}>{VIRTUES.find(v => v.id === nextQueuedVirtue)?.name}</Text>
            </Text>
          </View>
        )}
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {customVirtues.length > 0 && (
          <View style={[styles.sectionHeader, { borderBottomColor: theme.border }]}>
            <Sparkles size={16} color={theme.accent} strokeWidth={1.5} />
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Your Custom Virtues</Text>
          </View>
        )}
        {customVirtues.map((virtue) => {
          const isExpanded = expandedVirtueId === virtue.id;
          const expandAnim = getExpandAnim(virtue.id);
          
          return (
            <View key={virtue.id} style={styles.virtueCardContainer}>
              <TouchableOpacity
                style={[
                  styles.virtueCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: selectedVirtueId === virtue.id ? theme.accent : theme.border,
                  },
                ]}
                onPress={() => setSelectedVirtueId(virtue.id)}
                activeOpacity={0.7}
                accessibilityLabel={`${virtue.name}: ${virtue.description}`}
                accessibilityRole="radio"
                accessibilityState={{ selected: selectedVirtueId === virtue.id }}
                testID={`virtue-${virtue.id}`}
              >
                <View style={styles.virtueCardHeader}>
                  <View style={styles.virtueCardMain}>
                    <View style={styles.virtueNameRow}>
                      <Text style={[styles.virtueName, { color: theme.text }]}>
                        {virtue.name}
                      </Text>
                      <View style={[styles.badge, { backgroundColor: theme.accent + '20', borderColor: theme.accent }]}>
                        <Text style={[styles.badgeText, { color: theme.accent }]}>Custom</Text>
                      </View>
                    </View>
                    <Text style={[styles.virtueDescription, { color: theme.textSecondary }]}>
                      {virtue.description}
                    </Text>
                  </View>
                  {virtue.context && (
                    <TouchableOpacity
                      style={styles.expandButton}
                      onPress={() => toggleExpanded(virtue.id)}
                      activeOpacity={0.7}
                      accessibilityLabel={isExpanded ? 'Collapse details' : 'Expand details'}
                      accessibilityRole="button"
                      testID={`expand-${virtue.id}`}
                    >
                      <Animated.View
                        style={{
                          transform: [{
                            rotate: expandAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0deg', '180deg'],
                            }),
                          }],
                        }}
                      >
                        <ChevronDown size={20} color={theme.textTertiary} strokeWidth={1.5} />
                      </Animated.View>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>

              {isExpanded && virtue.context && (
                <Animated.View 
                  style={[
                    styles.expandedContent, 
                    { 
                      backgroundColor: theme.surface, 
                      borderColor: theme.border,
                      opacity: expandAnim,
                      maxHeight: expandAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 500],
                      }),
                    },
                  ]}
                >
                  <View style={styles.contextSection}>
                    <Text style={[styles.contextTitle, { color: theme.textTertiary }]}>
                      Why This Matters
                    </Text>
                    <Text style={[styles.contextText, { color: theme.textSecondary }]}>
                      {virtue.context}
                    </Text>
                  </View>
                </Animated.View>
              )}
            </View>
          );
        })}

        {customVirtues.length > 0 && (
          <View style={[styles.sectionHeader, { borderBottomColor: theme.border, marginTop: 16 }]}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Franklin&apos;s 13 Virtues</Text>
          </View>
        )}
        {VIRTUES.map((virtue, index) => {
          const isExpanded = expandedVirtueId === virtue.id;
          const needsWork = needsImprovement.includes(virtue.id);
          const expandAnim = getExpandAnim(virtue.id);
          
          return (
            <Animated.View 
              key={virtue.id} 
              style={[
                styles.virtueCardContainer,
                {
                  opacity: entranceAnim,
                  transform: [{
                    translateY: entranceAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  }],
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.virtueCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: selectedVirtueId === virtue.id ? theme.accent : theme.border,
                  },
                ]}
                onPress={() => setSelectedVirtueId(virtue.id)}
                activeOpacity={0.7}
                accessibilityLabel={`${virtue.name}: ${virtue.description}`}
                accessibilityRole="radio"
                accessibilityState={{ selected: selectedVirtueId === virtue.id }}
                testID={`virtue-${virtue.id}`}
              >
                <View style={styles.virtueCardHeader}>
                  <View style={styles.virtueCardMain}>
                    <View style={styles.virtueNameRow}>
                      <Text style={[styles.virtueName, { color: theme.text }]}>
                        {virtue.name}
                      </Text>
                      {needsWork && (
                        <View style={[styles.badge, { backgroundColor: theme.surface, borderColor: theme.textTertiary }]}>
                          <Text style={[styles.badgeText, { color: theme.textTertiary }]}>Focus</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.virtueDescription, { color: theme.textSecondary }]}>
                      {virtue.description}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.expandButton}
                    onPress={() => toggleExpanded(virtue.id)}
                    activeOpacity={0.7}
                    accessibilityLabel={isExpanded ? 'Collapse details' : 'Expand details'}
                    accessibilityRole="button"
                    testID={`expand-${virtue.id}`}
                  >
                    <Animated.View
                      style={{
                        transform: [{
                          rotate: expandAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '180deg'],
                          }),
                        }],
                      }}
                    >
                      <ChevronDown size={20} color={theme.textTertiary} strokeWidth={1.5} />
                    </Animated.View>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <Animated.View 
                  style={[
                    styles.expandedContent, 
                    { 
                      backgroundColor: theme.surface, 
                      borderColor: theme.border,
                      opacity: expandAnim,
                      maxHeight: expandAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 500],
                      }),
                    },
                  ]}
                >
                  <View style={styles.contextSection}>
                    <Text style={[styles.contextTitle, { color: theme.textTertiary }]}>
                      Context
                    </Text>
                    <Text style={[styles.contextText, { color: theme.textSecondary }]}>
                      {virtue.context}
                    </Text>
                  </View>
                  <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />
                  <View style={styles.quoteSection}>
                    <Text style={[styles.quote, { color: theme.text }]}>
                      &ldquo;{virtue.quote}&rdquo;
                    </Text>
                    <Text style={[styles.quoteAttribution, { color: theme.textTertiary }]}>
                      — Benjamin Franklin
                    </Text>
                  </View>
                </Animated.View>
              )}
            </Animated.View>
          );
        })}
      </ScrollView>

      {selectedVirtue && (
        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <View style={styles.confirmationContainer}>
            <Text style={[styles.confirmationText, { color: theme.textSecondary }]}>
              Selected: <Text style={[styles.confirmationVirtue, { color: theme.text }]}>{selectedVirtue.name}</Text>
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.confirmButton, { borderColor: theme.border }]}
            onPress={handleConfirm}
            activeOpacity={0.7}
            accessibilityLabel={`Confirm selection of ${selectedVirtue?.name}`}
            accessibilityRole="button"
            testID="confirm-virtue-button"
          >
            <Text style={[styles.confirmButtonText, { color: theme.text }]}>
              Confirm
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 24,
    gap: 8,
  },
  title: {
    ...typography.serif.semibold,
    fontSize: sizes.large,
  },
  subtitle: {
    ...typography.sans.regular,
    fontSize: sizes.body,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingBottom: 32,
    gap: 16,
  },
  virtueCardContainer: {
    gap: 0,
  },
  virtueCard: {
    padding: 20,
    borderWidth: 1,
    borderRadius: 0,
  },
  virtueCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  virtueCardMain: {
    flex: 1,
    gap: 8,
  },
  virtueNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderRadius: 2,
  },
  badgeText: {
    ...typography.sans.medium,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  expandButton: {
    padding: 2,
  },
  virtueName: {
    ...typography.serif.semibold,
    fontSize: sizes.title,
  },
  virtueDescription: {
    ...typography.sans.regular,
    fontSize: sizes.body,
    lineHeight: 22,
  },
  expandedContent: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderRadius: 0,
    padding: 20,
    gap: 16,
  },
  contextSection: {
    gap: 8,
  },
  contextTitle: {
    ...typography.sans.medium,
    fontSize: sizes.caption,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  contextText: {
    ...typography.sans.regular,
    fontSize: sizes.body,
    lineHeight: 22,
  },
  divider: {
    height: 1,
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
  footer: {
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderTopWidth: 1,
    gap: 16,
  },
  confirmationContainer: {
    alignItems: 'center',
  },
  confirmationText: {
    ...typography.sans.regular,
    fontSize: sizes.body,
  },
  confirmationVirtue: {
    ...typography.serif.semibold,
    fontSize: sizes.body,
  },
  confirmButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  confirmButtonText: {
    ...typography.sans.semibold,
    fontSize: sizes.label,
  },
  queueNotice: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
  },
  queueNoticeText: {
    ...typography.sans.regular,
    fontSize: sizes.body,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    ...typography.sans.medium,
    fontSize: sizes.caption,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
