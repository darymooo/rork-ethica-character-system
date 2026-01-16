import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, useColorScheme } from 'react-native';
import { X } from 'lucide-react-native';
import colors from '@/constants/colors';
import { typography, sizes } from '@/constants/typography';
import { useEthica } from '@/contexts/EthicaContext';

interface FranklinMethodModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function FranklinMethodModal({ visible, onClose }: FranklinMethodModalProps) {
  const { state } = useEthica();
  const systemColorScheme = useColorScheme();
  const isDark = state.followSystemTheme ? systemColorScheme === 'dark' : state.darkMode;
  const theme = isDark ? colors.dark : colors.light;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Franklin&apos;s Method
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
            accessibilityLabel="Close"
            accessibilityRole="button"
          >
            <X size={24} color={theme.text} strokeWidth={1.5} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              The Original System
            </Text>
            <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
              In 1726, at age 20, Benjamin Franklin devised a methodical system for moral improvement. He identified thirteen virtues essential to his character and created a disciplined practice for cultivating each one.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              The Little Book
            </Text>
            <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
              Franklin made a small book with a page for each virtue. Each page contained seven columns for the days of the week and thirteen rows for the virtues. He would focus on a single virtue each week while keeping watch over all thirteen.
            </Text>
            <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
              When he committed a fault against the week&apos;s virtue, he marked it with a black spot. His aim was not perfection, but to diminish the number of marks over time.
            </Text>
          </View>

          <View style={[styles.quoteSection, { borderTopColor: theme.borderLight, borderBottomColor: theme.borderLight }]}>
            <Text style={[styles.quoteText, { color: theme.text }]}>
              &ldquo;I was surpris&apos;d to find myself so much fuller of faults than I had imagined; but I had the satisfaction of seeing them diminish.&rdquo;
            </Text>
            <Text style={[styles.quoteAttribution, { color: theme.textTertiary }]}>
              — Benjamin Franklin
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              The Weekly Cycle
            </Text>
            <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
              Franklin dedicated one week to each virtue, cycling through all thirteen in a quarter year. He repeated this cycle four times annually, allowing him to practice each virtue four times per year.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              How to Use This App
            </Text>
            <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
              • Select a virtue to focus on for 7 days
            </Text>
            <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
              • Each day, observe your actions and mark if you committed a fault
            </Text>
            <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
              • At week&apos;s end, review your progress and choose your next virtue
            </Text>
            <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
              • Complete all 13 virtues to finish a cycle
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
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
    borderBottomWidth: 1,
  },
  headerTitle: {
    ...typography.serif.semibold,
    fontSize: sizes.title,
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingVertical: 32,
    gap: 32,
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    ...typography.serif.semibold,
    fontSize: sizes.title,
  },
  bodyText: {
    ...typography.sans.regular,
    fontSize: sizes.body,
    lineHeight: 24,
  },
  quoteSection: {
    paddingVertical: 24,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    gap: 16,
  },
  quoteText: {
    ...typography.serif.regular,
    fontSize: sizes.body,
    lineHeight: 26,
    fontStyle: 'italic' as const,
  },
  quoteAttribution: {
    ...typography.sans.regular,
    fontSize: sizes.caption,
  },
});
