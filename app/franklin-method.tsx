import { useEthica } from '@/contexts/EthicaContext';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import colors from '@/constants/colors';
import { typography, sizes } from '@/constants/typography';

export default function FranklinMethod() {
  const { state } = useEthica();
  const router = useRouter();
  const systemColorScheme = useColorScheme();
  const isDark = state.followSystemTheme ? systemColorScheme === 'dark' : state.darkMode;
  const theme = isDark ? colors.dark : colors.light;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.canGoBack() ? router.back() : router.replace('/home')}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={theme.text} strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Franklin&apos;s Method
        </Text>
        <View style={styles.headerRight} />
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
            — Benjamin Franklin, Autobiography
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            The Weekly Cycle
          </Text>
          <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
            Franklin dedicated one week to each virtue, cycling through all thirteen in a quarter year. He repeated this cycle four times annually, allowing him to practice each virtue four times per year.
          </Text>
          <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
            Over time, his little book became worn from use. He transferred his marks to a new book with ivory pages that could be wiped clean and reused.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            The Philosophy
          </Text>
          <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
            Franklin believed that virtue could be cultivated through deliberate practice, much like acquiring any skill. His system was rational rather than mystical, practical rather than aspirational.
          </Text>
          <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
            He focused on one virtue at a time, reasoning that as each became habitual, it would require less conscious attention, freeing the mind to work on the next.
          </Text>
        </View>

        <View style={[styles.quoteSection, { borderTopColor: theme.borderLight, borderBottomColor: theme.borderLight }]}>
          <Text style={[styles.quoteText, { color: theme.text }]}>
            &ldquo;On the whole, tho&apos; I never arrived at the perfection I had been so ambitious of obtaining, but fell far short of it, yet I was, by the endeavour, a better and happier man than I otherwise should have been.&rdquo;
          </Text>
          <Text style={[styles.quoteAttribution, { color: theme.textTertiary }]}>
            — Benjamin Franklin, Autobiography
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Lifelong Practice
          </Text>
          <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
            Franklin maintained this practice for decades, though in later years he went through only one complete cycle annually due to his many occupations. He attributed much of his success and happiness to this disciplined self-examination.
          </Text>
          <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
            The system was never about achieving moral perfection, which Franklin considered impossible. It was about conscious attention to character, honest observation of faults, and steady, incremental improvement over a lifetime.
          </Text>
        </View>
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
    paddingBottom: 48,
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
