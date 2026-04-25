import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useColorScheme, Alert, ActivityIndicator, useWindowDimensions } from 'react-native';
import type { GestureResponderEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import type { PurchasesPackage } from 'react-native-purchases';
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

type PlanKey = 'weekly' | 'monthly';

function stripTrialText(text: string): string {
  return text
    .replace(/\s*\(?[^)]*trial[^)]*\)?/gi, '')
    .replace(/\b\d+\s*-?\s*day\b[^)]*/gi, '')
    .replace(/free\s*trial/gi, '')
    .replace(/\btrial\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function getPackagePrice(pkg: PurchasesPackage | null, fallback: string): string {
  if (!pkg) {
    return fallback;
  }

  const normalizedPrice = pkg.product.priceString
    ?? pkg.product.pricePerMonthString
    ?? pkg.product.pricePerWeekString
    ?? fallback;

  return stripTrialText(normalizedPrice);
}

export default function Paywall() {
  const router = useRouter();
  const systemColorScheme = useColorScheme();
  const { state } = useEthica();
  const { width } = useWindowDimensions();
  const isDark = state.followSystemTheme ? systemColorScheme === 'dark' : state.darkMode;
  const theme = isDark ? colors.dark : colors.light;
  const isTabletLayout = width >= 768;
  const horizontalPadding = width < 380 ? 20 : isTabletLayout ? 32 : 24;

  const {
    offerings,
    weeklyPackage,
    monthlyPackage,
    isPro,
    purchase,
    restorePurchases,
    refreshRevenueCat,
    isPurchasing,
    isRestoring,
    isLoadingOfferings,
  } = useRevenueCat();

  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('monthly');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  useEffect(() => {
    console.log('Paywall offerings snapshot', offerings?.current?.availablePackages.map((pkg) => ({
      identifier: pkg.identifier,
      packageType: pkg.packageType,
      productIdentifier: pkg.product.identifier,
      priceString: pkg.product.priceString,
      introPrice: pkg.product.introPrice?.priceString,
      subscriptionPeriod: pkg.product.subscriptionPeriod,
    })));
  }, [offerings]);

  useEffect(() => {
    if (!monthlyPackage && weeklyPackage) {
      setSelectedPlan('weekly');
    }

    if (!weeklyPackage && monthlyPackage) {
      setSelectedPlan('monthly');
    }
  }, [monthlyPackage, weeklyPackage]);

  const selectedRevenueCatPackage = selectedPlan === 'monthly' ? monthlyPackage : weeklyPackage;
  const weeklyPrice = getPackagePrice(weeklyPackage, '$2.99');
  const monthlyPrice = getPackagePrice(monthlyPackage, '$9.99');

  const weeklySavings = useMemo(() => {
    if (!weeklyPackage || !monthlyPackage || weeklyPackage.product.price <= 0) {
      return 0;
    }

    const monthlyEquivalent = weeklyPackage.product.price * 4;
    const savings = Math.round((1 - (monthlyPackage.product.price / monthlyEquivalent)) * 100);
    return savings > 0 ? savings : 0;
  }, [monthlyPackage, weeklyPackage]);

  const missingPlans = useMemo(() => {
    const plans: string[] = [];

    if (!weeklyPackage) {
      plans.push('weekly');
    }

    if (!monthlyPackage) {
      plans.push('monthly');
    }

    return plans;
  }, [monthlyPackage, weeklyPackage]);

  const handleClose = () => {
    router.replace('/virtue-selection');
  };

  const handlePurchase = async () => {
    if (!selectedRevenueCatPackage) {
      Alert.alert(
        'Subscription Unavailable',
        `The ${selectedPlan} subscription is not available right now. Please refresh and try again.`
      );
      return;
    }

    try {
      await purchase(selectedPlan);
      Alert.alert(
        'Success!',
        'Welcome to Ethica Pro! You now have access to all premium features.',
        [{ text: 'Continue', onPress: () => router.replace('/virtue-selection') }]
      );
    } catch (error: any) {
      if (error?.message !== 'Purchase cancelled') {
        Alert.alert('Purchase Failed', error?.message || 'Something went wrong. Please try again.');
      }
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshRevenueCat();
      Alert.alert('Refreshed', 'RevenueCat products have been refreshed.');
    } catch (error: any) {
      Alert.alert('Refresh Failed', error?.message || 'Could not refresh RevenueCat data.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRestore = async () => {
    try {
      await restorePurchases();
      Alert.alert(
        'Restore Complete',
        'Your purchases have been restored.',
        [{ text: 'OK', onPress: () => router.replace('/virtue-selection') }]
      );
    } catch (error: any) {
      Alert.alert('Restore Failed', error?.message || 'Could not restore purchases. Please try again.');
    }
  };

  const openPoliciesPage = (section: 'privacy' | 'terms') => (event: GestureResponderEvent) => {
    event.preventDefault();
    console.log('Opening policies page from paywall', { section });
    router.push({ pathname: '/policies', params: { section } });
  };

  const activePriceLabel = selectedPlan === 'monthly' ? `${monthlyPrice}/month` : `${weeklyPrice}/week`;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalPadding }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.contentShell, { maxWidth: isTabletLayout ? 860 : 560 }]}>
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
              {PREMIUM_FEATURES.map((feature) => (
                <View key={feature} style={styles.featureRow}>
                  <View style={[styles.checkContainer, { backgroundColor: theme.accent + '20' }]}> 
                    <Check size={16} color={theme.accent} strokeWidth={2.5} />
                  </View>
                  <Text style={[styles.featureText, { color: theme.text }]}> 
                    {feature}
                  </Text>
                </View>
              ))}
            </View>

            {missingPlans.length > 0 && !isLoadingOfferings ? (
              <View style={[styles.statusCard, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
                <Text style={[styles.statusTitle, { color: theme.text }]}>Subscription setup needs attention</Text>
                <Text style={[styles.statusText, { color: theme.textSecondary }]}> 
                  Missing {missingPlans.join(' and ')} package{missingPlans.length > 1 ? 's' : ''} from the current RevenueCat offering.
                </Text>
              </View>
            ) : null}

            {isPro ? (
              <View style={[styles.statusCard, { backgroundColor: theme.surface, borderColor: theme.accent }]}> 
                <Text style={[styles.statusTitle, { color: theme.text }]}>Ethica Pro is active</Text>
                <Text style={[styles.statusText, { color: theme.textSecondary }]}> 
                  Your premium access is already unlocked on this device.
                </Text>
              </View>
            ) : null}

            {isLoadingOfferings ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.accent} />
                <Text style={[styles.loadingText, { color: theme.textSecondary }]}> 
                  Loading subscription options...
                </Text>
              </View>
            ) : (
              <View style={[styles.pricingContainer, isTabletLayout && styles.pricingContainerTablet]}>
                <TouchableOpacity
                  style={[
                    styles.pricingCard,
                    isTabletLayout && styles.pricingCardTablet,
                    {
                      backgroundColor: theme.surface,
                      borderColor: selectedPlan === 'monthly' ? theme.accent : theme.border,
                      borderWidth: selectedPlan === 'monthly' ? 2 : 1,
                    },
                  ]}
                  onPress={() => setSelectedPlan('monthly')}
                  activeOpacity={0.7}
                  testID="monthly-package"
                >
                  {weeklySavings > 0 ? (
                    <View style={[styles.badge, { backgroundColor: theme.accent }]}> 
                      <Text style={styles.badgeText}>Best Value</Text>
                    </View>
                  ) : null}
                  <View style={styles.pricingHeader}>
                    <Text style={[styles.planName, { color: theme.text }]}>Monthly</Text>
                    <Text style={[styles.planPrice, { color: theme.text }]}> 
                      {monthlyPrice}
                      <Text style={[styles.planPeriod, { color: theme.textSecondary }]}>/month</Text>
                    </Text>
                  </View>
                  <Text style={[styles.planDetail, { color: theme.textSecondary }]}> 
                    1 month subscription • {monthlyPrice} billed every month
                  </Text>
                  <Text style={[styles.planBillingCycle, { color: theme.textTertiary }]}> 
                    Auto-renewing monthly billing cycle. Cancel anytime.
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.pricingCard,
                    isTabletLayout && styles.pricingCardTablet,
                    {
                      backgroundColor: theme.surface,
                      borderColor: selectedPlan === 'weekly' ? theme.accent : theme.border,
                      borderWidth: selectedPlan === 'weekly' ? 2 : 1,
                    },
                  ]}
                  onPress={() => setSelectedPlan('weekly')}
                  activeOpacity={0.7}
                  testID="weekly-package"
                >
                  <View style={styles.pricingHeader}>
                    <Text style={[styles.planName, { color: theme.text }]}>Weekly</Text>
                    <Text style={[styles.planPrice, { color: theme.text }]}> 
                      {weeklyPrice}
                      <Text style={[styles.planPeriod, { color: theme.textSecondary }]}>/week</Text>
                    </Text>
                  </View>
                  <Text style={[styles.planDetail, { color: theme.textSecondary }]}> 
                    1 week subscription • {weeklyPrice} billed every week
                  </Text>
                  <Text style={[styles.planBillingCycle, { color: theme.textTertiary }]}> 
                    Auto-renewing weekly billing cycle. Cancel anytime.
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={[styles.footerOuter, { borderTopColor: theme.border }]}> 
          <View style={[styles.footerInner, { maxWidth: isTabletLayout ? 860 : 560, paddingHorizontal: horizontalPadding }]}> 
            <Text style={[styles.noPaymentText, { color: theme.textSecondary }]}> 
              Cancel anytime. No free trials.
            </Text>
            <TouchableOpacity
              style={[
                styles.subscribeButton,
                { backgroundColor: selectedRevenueCatPackage && !isPro ? theme.accent : theme.border },
              ]}
              onPress={handlePurchase}
              disabled={isPurchasing || isLoadingOfferings || !selectedRevenueCatPackage || isPro}
              activeOpacity={0.7}
              testID="subscribe-button"
            >
              {isPurchasing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.subscribeButtonText}>
                  {isPro ? 'You already have Pro' : `Subscribe to ${selectedPlan === 'monthly' ? 'Monthly' : 'Weekly'}`}
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
              {activePriceLabel}. Cancel anytime.
            </Text>
            <View
              style={[styles.legalContainer, { backgroundColor: theme.surface, borderColor: theme.borderLight }]}
              testID="paywall-legal-footer"
            >
              <Text style={[styles.legalText, { color: theme.textTertiary }]}>By subscribing, you agree to our</Text>
              <View style={styles.legalLinksRow}>
                <TouchableOpacity
                  onPress={openPoliciesPage('terms')}
                  activeOpacity={0.7}
                  testID="terms-of-use-link"
                >
                  <Text style={[styles.legalLink, { color: theme.accent }]}>Terms of Use</Text>
                </TouchableOpacity>
                <Text style={[styles.legalDivider, { color: theme.textTertiary }]}>|</Text>
                <TouchableOpacity
                  onPress={openPoliciesPage('privacy')}
                  activeOpacity={0.7}
                  testID="privacy-policy-link"
                >
                  <Text style={[styles.legalLink, { color: theme.accent }]}>Privacy Policy</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 28,
    paddingBottom: 24,
  },
  contentShell: {
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
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
    maxWidth: 520,
  },
  featuresContainer: {
    gap: 16,
    marginBottom: 24,
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
  statusCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    gap: 8,
  },
  statusTitle: {
    ...typography.sans.semibold,
    fontSize: sizes.label,
  },
  statusText: {
    ...typography.sans.regular,
    fontSize: sizes.body,
    lineHeight: 22,
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
  },
  pricingContainerTablet: {
    flexDirection: 'row',
  },
  pricingCard: {
    padding: 20,
    borderRadius: 18,
    position: 'relative',
  },
  pricingCardTablet: {
    flex: 1,
  },
  badge: {
    position: 'absolute',
    top: -10,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    ...typography.sans.semibold,
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#FFFFFF',
  },
  pricingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 12,
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
    lineHeight: 22,
  },
  planBillingCycle: {
    ...typography.sans.regular,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  footerOuter: {
    borderTopWidth: 1,
    paddingTop: 18,
    paddingBottom: 14,
  },
  footerInner: {
    width: '100%',
    alignSelf: 'center',
    gap: 12,
  },
  noPaymentText: {
    ...typography.sans.medium,
    fontSize: 14,
    textAlign: 'center',
  },
  subscribeButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  subscribeButtonText: {
    ...typography.sans.semibold,
    fontSize: sizes.label,
    color: '#FFFFFF',
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    ...typography.sans.medium,
    fontSize: sizes.body,
  },
  restoreButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  refreshButton: {
    paddingVertical: 8,
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
  legalContainer: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    gap: 6,
  },
  legalText: {
    ...typography.sans.regular,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  legalLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    columnGap: 8,
    rowGap: 4,
  },
  legalDivider: {
    ...typography.sans.regular,
    fontSize: 12,
  },
  legalLink: {
    ...typography.sans.semibold,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
});
