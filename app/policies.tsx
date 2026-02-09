import { useEthica } from '@/contexts/EthicaContext';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import colors from '@/constants/colors';
import { typography, sizes } from '@/constants/typography';

export default function Policies() {
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
          onPress={() => {
            try {
              router.back();
            } catch {
              router.replace('/settings');
            }
          }}
          activeOpacity={0.7}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          testID="policies-back-button"
        >
          <ArrowLeft size={24} color={theme.text} strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Privacy & Terms
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
            Privacy Policy
          </Text>
          <Text style={[styles.lastUpdated, { color: theme.textTertiary }]}>
            Last updated: January 2026
          </Text>

          <View style={styles.policyContent}>
            <Text style={[styles.heading, { color: theme.text }]}>
              Data Collection
            </Text>
            <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
              Ethica stores all your data locally on your device. Your virtue practice records, observations, and settings remain entirely on your device. We do not collect or store any personal information on external servers.
            </Text>

            <Text style={[styles.heading, { color: theme.text }]}>
              What We Store Locally
            </Text>
            <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
              • Your selected virtues and practice history{'\n'}
              • Daily observations and notes{'\n'}
              • App preferences and settings{'\n'}
              • Streak and progress data
            </Text>

            <Text style={[styles.heading, { color: theme.text }]}>\n              In-App Purchases
            </Text>
            <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
              We use RevenueCat to process in-app purchases and subscriptions. RevenueCat may collect limited transaction data (subscription status, purchase receipts) to manage your premium features. This data is handled according to RevenueCat&apos;s privacy policy. We do not have access to your payment information.
            </Text>

            <Text style={[styles.heading, { color: theme.text }]}>
              Data Sharing
            </Text>
            <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
              We do not share, sell, or transfer your personal data to any third parties beyond what is necessary for processing subscriptions (via RevenueCat). Your character development journey remains private.
            </Text>

            <Text style={[styles.heading, { color: theme.text }]}>
              Data Export & Deletion
            </Text>
            <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
              You can export your data at any time through the Settings menu. You can also reset all data, which permanently deletes all stored information from your device.
            </Text>

            <Text style={[styles.heading, { color: theme.text }]}>
              Notifications
            </Text>
            <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
              If you enable daily reminders, notifications are scheduled locally on your device. No notification data is sent to external servers.
            </Text>

            <Text style={[styles.heading, { color: theme.text }]}>
              Analytics
            </Text>
            <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
              We do not use any third-party analytics services. All statistics and insights are calculated locally on your device.
            </Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Terms of Service
          </Text>
          <Text style={[styles.lastUpdated, { color: theme.textTertiary }]}>
            Last updated: January 2026
          </Text>

          <View style={styles.policyContent}>
            <Text style={[styles.heading, { color: theme.text }]}>
              Acceptance of Terms
            </Text>
            <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
              By using Ethica, you agree to these terms. The app is provided for personal character development and self-improvement purposes.
            </Text>

            <Text style={[styles.heading, { color: theme.text }]}>
              Use of the App
            </Text>
            <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
              Ethica is designed to help you practice Benjamin Franklin&apos;s method of character formation. The app is intended for personal use and self-reflection.
            </Text>

            <Text style={[styles.heading, { color: theme.text }]}>
              No Medical Advice
            </Text>
            <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
              This app is not a substitute for professional medical, psychological, or therapeutic advice. If you are experiencing mental health challenges, please consult a qualified professional.
            </Text>

            <Text style={[styles.heading, { color: theme.text }]}>
              User Responsibility
            </Text>
            <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
              You are responsible for maintaining the security of your device and any data stored within the app. We recommend regular backups using the export feature.
            </Text>

            <Text style={[styles.heading, { color: theme.text }]}>
              Disclaimer
            </Text>
            <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
              The app is provided &quot;as is&quot; without warranties of any kind. We are not liable for any loss of data or any indirect, incidental, or consequential damages arising from your use of the app.
            </Text>

            <Text style={[styles.heading, { color: theme.text }]}>
              Changes to Terms
            </Text>
            <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
              We may update these terms from time to time. Continued use of the app after changes constitutes acceptance of the new terms.
            </Text>

            <Text style={[styles.heading, { color: theme.text }]}>
              Contact
            </Text>
            <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
              If you have questions about these policies, please reach out through the app store listing or our support channels.
            </Text>
          </View>
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
    paddingTop: 8,
  },
  section: {
    paddingVertical: 24,
  },
  sectionTitle: {
    ...typography.serif.semibold,
    fontSize: sizes.large,
    marginBottom: 4,
  },
  lastUpdated: {
    ...typography.sans.regular,
    fontSize: sizes.caption,
    marginBottom: 24,
  },
  policyContent: {
    gap: 16,
  },
  heading: {
    ...typography.sans.semibold,
    fontSize: sizes.label,
    marginTop: 8,
  },
  paragraph: {
    ...typography.sans.regular,
    fontSize: sizes.body,
    lineHeight: 24,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  bottomSpacer: {
    height: 32,
  },
});
