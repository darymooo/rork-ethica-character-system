import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useColorScheme, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Check, Sparkles } from 'lucide-react-native';
import colors from '@/constants/colors';
import { typography, sizes } from '@/constants/typography';
import { useEthica } from '@/contexts/EthicaContext';
import { useRevenueCat } from '@/contexts/RevenueCatContext';

const PREMIUM_FEATURES = [
  'Create unlimited custom virtues',
  'Track your own principles',
  'Advanced analytics & insights',
  'Export your complete journal',
  'Priority support',
];

export default function Paywall() {
  const router = useRouter();
  const systemColorScheme = useColorScheme();
  const { state } = useEthica();
  const isDark = state.followSystemTheme ? systemColorScheme === 'dark' : state.darkMode;
  const theme = isDark ? colors.dark : colors.light;

  const {
    offerings,
    purchase,
    restorePurchases,
    refreshRevenueCat,
    isPurchasing,
    isRestoring,
    isLoadingOfferings,
  } = useRevenueCat();

  const [selectedPackage, setSelectedPackage] = useState<'weekly' | 'monthly'>('monthly');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const weeklyPackage = offerings?.current?.availablePackages.find(
    pkg => pkg.identifier === '$rc_weekly'
  );
  const monthlyPackage = offerings?.current?.availablePackages.find(
    pkg => pkg.identifier === '$rc_monthly'
  );

  const handleClose = () => {
    router.replace('/virtue-selection');
  };

  const handlePurchase = async () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'Not Available',
        'Purchases are not available on the web version. Please use the mobile app to upgrade to Pro.'
      );
      return;
    }

    try {
      const packageId = selectedPackage === 'weekly' ? '$rc_weekly' : '$rc_monthly';
      await purchase(packageId);
      Alert.alert(
        'Success!',
        'Welcome to Ethica Pro! You now have access to all premium features.',
        [{ text: 'Continue', onPress: () => router.replace('/virtue-selection') }]
      );
    } catch (error: any) {
      if (error.message !== 'Purchase cancelled') {
        Alert.alert('Purchase Failed', error.message || 'Something went wrong. Please try again.');
      }
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshRevenueCat();
      Alert.alert('Refreshed', 'RevenueCat data has been refreshed.');
    } catch (error: any) {
      Alert.alert('Refresh Failed', error?.message || 'Could not refresh RevenueCat data.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRestore = async () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'Not Available',
        'Restore purchases is not available on the web version.'
      );
      return;
    }

    try {
      await restorePurchases();
      Alert.alert(
        'Restore Complete',
        'Your purchases have been restored.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Restore Failed', error.message || 'Could not restore purchases. Please try again.');
    }
  };

  const weeklyPrice = weeklyPackage?.product?.priceString || '$2.99';
  const monthlyPrice = monthlyPackage?.product?.priceString || '$9.99';
  const weeklySavings = weeklyPackage && monthlyPackage 
    ? Math.round((1 - (monthlyPackage.product.price / (weeklyPackage.product.price * 4))) * 100)
    : 25;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: theme.accent + '20' }]}>
              <Sparkles size={32} color={theme.accent} strokeWidth={1.5} />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>
              Upgrade to Ethica Pro
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Unlock the full potential of your character development journey
            </Text>
          </View>

          <View style={styles.featuresContainer}>
            {PREMIUM_FEATURES.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <View style={[styles.checkContainer, { backgroundColor: theme.accent + '20' }]}>
                  <Check size={16} color={theme.accent} strokeWidth={2.5} />
                </View>
                <Text style={[styles.featureText, { color: theme.text }]}>
                  {feature}
                </Text>
              </View>
            ))}
          </View>

          {isLoadingOfferings ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.accent} />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                Loading subscription options...
              </Text>
            </View>
          ) : (
            <View style={styles.pricingContainer}>
              <TouchableOpacity
                style={[
                  styles.pricingCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: selectedPackage === 'monthly' ? theme.accent : theme.border,
                    borderWidth: selectedPackage === 'monthly' ? 2 : 1,
                  },
                ]}
                onPress={() => setSelectedPackage('monthly')}
                activeOpacity={0.7}
                testID="monthly-package"
              >
                {weeklySavings > 0 && (
                  <View style={[styles.badge, { backgroundColor: theme.accent }]}>
                    <Text style={[styles.badgeText, { color: '#FFFFFF' }]}>
                      Best Value
                    </Text>
                  </View>
                )}
                <View style={styles.pricingHeader}>
                  <Text style={[styles.planName, { color: theme.text }]}>Monthly</Text>
                  <Text style={[styles.planPrice, { color: theme.text }]}>
                    {monthlyPrice}<Text style={[styles.planPeriod, { color: theme.textSecondary }]}>/month</Text>
                  </Text>
                </View>
                <Text style={[styles.planDetail, { color: theme.textSecondary }]}>
                  Billed monthly, cancel anytime
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.pricingCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: selectedPackage === 'weekly' ? theme.accent : theme.border,
                    borderWidth: selectedPackage === 'weekly' ? 2 : 1,
                  },
                ]}
                onPress={() => setSelectedPackage('weekly')}
                activeOpacity={0.7}
                testID="weekly-package"
              >
                <View style={styles.pricingHeader}>
                  <Text style={[styles.planName, { color: theme.text }]}>Weekly</Text>
                  <Text style={[styles.planPrice, { color: theme.text }]}>
                    {weeklyPrice}<Text style={[styles.planPeriod, { color: theme.textSecondary }]}>/week</Text>
                  </Text>
                </View>
                <Text style={[styles.planDetail, { color: theme.textSecondary }]}>
                  Billed weekly, cancel anytime
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <Text style={[styles.noPaymentText, { color: theme.textSecondary }]}>
            Choose a plan to unlock Ethica Pro
          </Text>
          <TouchableOpacity
            style={[styles.subscribeButton, { backgroundColor: theme.accent }]}
            onPress={handlePurchase}
            disabled={isPurchasing || isLoadingOfferings}
            activeOpacity={0.7}
            testID="subscribe-button"
          >
            {isPurchasing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.subscribeButtonText}>
                Subscribe Now
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleClose}
            activeOpacity={0.7}
            testID="skip-button"
          >
            <Text style={[styles.skipButtonText, { color: theme.textSecondary }]}>
              Skip and continue to app
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestore}
            disabled={isRestoring}
            activeOpacity={0.7}
            testID="restore-button"
          >
            <Text style={[styles.restoreButtonText, { color: theme.textTertiary }]}>
              {isRestoring ? 'Restoring...' : 'Restore Purchases'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={isRefreshing || isLoadingOfferings}
            activeOpacity={0.7}
            testID="refresh-revenuecat-button"
          >
            {isRefreshing ? (
              <ActivityIndicator size="small" color={theme.textTertiary} />
            ) : (
              <Text style={[styles.restoreButtonText, { color: theme.textTertiary }]}>
                Refresh RevenueCat
              </Text>
            )}
          </TouchableOpacity>

          <Text style={[styles.disclaimer, { color: theme.textTertiary }]}>
            {selectedPackage === 'monthly' ? monthlyPrice : weeklyPrice}{selectedPackage === 'monthly' ? '/month' : '/week'}. Cancel anytime.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  noPaymentText: {
    ...typography.sans.medium,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingTop: 32,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    gap: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.serif.semibold,
    fontSize: sizes.xlarge,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.sans.regular,
    fontSize: sizes.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  featuresContainer: {
    gap: 16,
    marginBottom: 40,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    ...typography.sans.regular,
    fontSize: sizes.body,
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  loadingText: {
    ...typography.sans.regular,
    fontSize: sizes.body,
  },
  pricingContainer: {
    gap: 16,
    marginBottom: 24,
  },
  pricingCard: {
    padding: 20,
    borderRadius: 12,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    ...typography.sans.semibold,
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  pricingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  planName: {
    ...typography.serif.semibold,
    fontSize: sizes.title,
  },
  planPrice: {
    ...typography.sans.semibold,
    fontSize: 24,
  },
  planPeriod: {
    ...typography.sans.regular,
    fontSize: sizes.body,
  },
  planDetail: {
    ...typography.sans.regular,
    fontSize: sizes.body,
  },
  footer: {
    paddingHorizontal: 32,
    paddingTop: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  subscribeButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  subscribeButtonText: {
    ...typography.sans.semibold,
    fontSize: sizes.label,
    color: '#FFFFFF',
  },
  skipButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  skipButtonText: {
    ...typography.sans.medium,
    fontSize: sizes.body,
  },
  restoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  refreshButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  restoreButtonText: {
    ...typography.sans.regular,
    fontSize: 13,
  },
  disclaimer: {
    ...typography.sans.regular,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  trialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  trialBadgeText: {
    ...typography.sans.semibold,
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});