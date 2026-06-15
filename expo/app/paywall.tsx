import { View, Text, StyleSheet, TouchableOpacity, useColorScheme, Alert, ActivityIndicator, useWindowDimensions } from 'react-native';
import type { GestureResponderEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import type { PurchasesPackage } from 'react-native-purchases';
import { Check } from 'lucide-react-native';
import colors from '@/constants/colors';
import { typography, sizes } from '@/constants/typography';
import { useEthica } from '@/contexts/EthicaContext';
import { useRevenueCat } from '@/contexts/RevenueCatContext';
import * as Haptics from 'expo-haptics';

const PREMIUM_FEATURES = [
  'Unlimited custom virtues',
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
  if (!pkg) return fallback;

  const normalizedPrice = pkg.product.priceString
    ?? pkg.product.pricePerMonthString
    ?? pkg.product.pricePerWeekString
    ?? fallback;

  return stripTrialText(normalizedPrice);
}

export default function Paywall() {
  const router = useRouter();
  const params = useLocalSearchParams<{ returnTo?: string }>();
  const systemColorScheme = useColorScheme();
  const { state } = useEthica();
  const { width, height } = useWindowDimensions();
  const isDark = state.followSystemTheme ? systemColorScheme === 'dark' : state.darkMode;
  const theme = isDark ? colors.dark : colors.light;
  const isCompact = height < 700;
  const horizontalPadding = 24;

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
    if (!monthlyPackage && weeklyPackage) setSelectedPlan('weekly');
    if (!weeklyPackage && monthlyPackage) setSelectedPlan('monthly');
  }, [monthlyPackage, weeklyPackage]);

  const selectedRevenueCatPackage = selectedPlan === 'monthly' ? monthlyPackage : weeklyPackage;
  const weeklyPrice = getPackagePrice(weeklyPackage, '$2.99');
  const monthlyPrice = getPackagePrice(monthlyPackage, '$9.99');

  const weeklySavings = useMemo(() => {
    if (!weeklyPackage || !monthlyPackage || weeklyPackage.product.price <= 0) return 0;
    const monthlyEquivalent = weeklyPackage.product.price * 4;
    const savings = Math.round((1 - (monthlyPackage.product.price / monthlyEquivalent)) * 100);
    return savings > 0 ? savings : 0;
  }, [monthlyPackage, weeklyPackage]);

  const missingPlans = useMemo(() => {
    const plans: string[] = [];
    if (!weeklyPackage) plans.push('weekly');
    if (!monthlyPackage) plans.push('monthly');
    return plans;
  }, [monthlyPackage, weeklyPackage]);

  const closeDestination = params.returnTo === 'settings' ? '/settings' : '/virtue-selection';

  const handleClose = () => {
    console.log('Closing paywall', { closeDestination, isPro });
    router.replace(closeDestination);
  };

  const handlePurchase = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!selectedRevenueCatPackage) {
      Alert.alert(
        'Subscription Unavailable',
        `The ${selectedPlan} subscription is not available right now. Please refresh and try again.`
      );
      return;
    }

    try {
      await purchase(selectedPlan);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Welcome to Ethica Pro',
        'You now have access to all premium features.',
        [{ text: 'Continue', onPress: () => router.replace(closeDestination) }]
      );
    } catch (error: any) {
      if (error?.message !== 'Purchase cancelled') {
        Alert.alert('Purchase Failed', error?.message || 'Something went wrong. Please try again.');
      }
    }
  };

  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await restorePurchases();
      Alert.alert(
        'Restore Complete',
        'Your purchases have been restored.',
        [{ text: 'OK', onPress: () => router.replace(closeDestination) }]
      );
    } catch (error: any) {
      Alert.alert('Restore Failed', error?.message || 'Could not restore purchases. Please try again.');
    }
  };

  const openPoliciesPage = (section: 'privacy' | 'terms') => (event: GestureResponderEvent) => {
    event.preventDefault();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/policies', params: { section } });
  };

  const activePriceLabel = selectedPlan === 'monthly' ? `${monthlyPrice}/month` : `${weeklyPrice}/week`;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={[styles.content, { paddingHorizontal: horizontalPadding }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Ethica Pro</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Unlock the full potential of your character development journey
            </Text>
          </View>

          <View style={[styles.featuresContainer, isCompact && styles.featuresContainerCompact]}>
            {PREMIUM_FEATURES.map((feature) => (
              <View key={feature} style={styles.featureRow}>
                <Check size={14} color={theme.accent} strokeWidth={2.5} />
                <Text style={[styles.featureText, { color: theme.text }]}>{feature}</Text>
              </View>
            ))}
          </View>

          {isLoadingOfferings ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.accent} />
            </View>
          ) : isPro ? (
            <View style={[styles.proBadge, { backgroundColor: theme.accent + '12', borderColor: theme.accent }]}>
              <Text style={[styles.proBadgeText, { color: theme.accent }]}>Ethica Pro is active on this device</Text>
            </View>
          ) : (
            <View style={[styles.pricingRow, isCompact && styles.pricingRowCompact]}>
              <TouchableOpacity
                style={[
                  styles.pricingCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: selectedPlan === 'monthly' ? theme.accent : theme.border,
                    borderWidth: selectedPlan === 'monthly' ? 2 : 1,
                  },
                ]}
                onPress={() => { Haptics.selectionAsync(); setSelectedPlan('monthly'); }}
                activeOpacity={0.7}
                testID="monthly-package"
              >
                {weeklySavings > 0 && (
                  <View style={[styles.badge, { backgroundColor: theme.accent }]}>
                    <Text style={styles.badgeText}>Best Value</Text>
                  </View>
                )}
                <Text style={[styles.planName, { color: theme.text }]}>Monthly</Text>
                <Text style={[styles.planPrice, { color: theme.text }]}>{monthlyPrice}</Text>
                <Text style={[styles.planPeriod, { color: theme.textTertiary }]}>per month</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.pricingCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: selectedPlan === 'weekly' ? theme.accent : theme.border,
                    borderWidth: selectedPlan === 'weekly' ? 2 : 1,
                  },
                ]}
                onPress={() => { Haptics.selectionAsync(); setSelectedPlan('weekly'); }}
                activeOpacity={0.7}
                testID="weekly-package"
              >
                <Text style={[styles.planName, { color: theme.text }]}>Weekly</Text>
                <Text style={[styles.planPrice, { color: theme.text }]}>{weeklyPrice}</Text>
                <Text style={[styles.planPeriod, { color: theme.textTertiary }]}>per week</Text>
              </TouchableOpacity>
            </View>
          )}

          {missingPlans.length > 0 && !isLoadingOfferings ? (
            <Text style={[styles.missingNotice, { color: theme.textTertiary }]}>
              Missing {missingPlans.join(' and ')} package(s). Tap refresh below.
            </Text>
          ) : null}

          {!isLoadingOfferings && !isPro && (
            <TouchableOpacity
              style={[
                styles.subscribeButton,
                { backgroundColor: selectedRevenueCatPackage ? theme.text : theme.disabled },
              ]}
              onPress={handlePurchase}
              disabled={isPurchasing || !selectedRevenueCatPackage}
              activeOpacity={0.85}
              testID="subscribe-button"
            >
              {isPurchasing ? (
                <ActivityIndicator size="small" color={theme.background} />
              ) : (
                <Text style={[styles.subscribeButtonText, { color: theme.background }]}>
                  Subscribe {selectedPlan === 'monthly' ? 'Monthly' : 'Weekly'}
                </Text>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleClose}
            activeOpacity={0.7}
            testID="skip-button"
          >
            <Text style={[styles.skipButtonText, { color: theme.textSecondary }]}>
              Continue with free version
            </Text>
          </TouchableOpacity>

          <View style={styles.restoreRow}>
            <TouchableOpacity
              onPress={handleRestore}
              disabled={isRestoring}
              activeOpacity={0.7}
              testID="restore-button"
            >
              <Text style={[styles.restoreText, { color: theme.textTertiary }]}>
                {isRestoring ? 'Restoring...' : 'Restore Purchases'}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.restoreDivider, { color: theme.textTertiary }]}>·</Text>
            <TouchableOpacity
              onPress={handleRefresh}
              disabled={isRefreshing || isLoadingOfferings}
              activeOpacity={0.7}
              testID="refresh-revenuecat-button"
            >
              <Text style={[styles.restoreText, { color: theme.textTertiary }]}>
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.legalRow, { borderTopColor: theme.borderLight }]}>
            <Text style={[styles.legalText, { color: theme.textTertiary }]}>
              {activePriceLabel}. Cancel anytime.
            </Text>
            <View style={styles.legalLinks}>
              <TouchableOpacity onPress={openPoliciesPage('terms')} activeOpacity={0.7} testID="terms-of-use-link">
                <Text style={[styles.legalLink, { color: theme.accent }]}>Terms of Use</Text>
              </TouchableOpacity>
              <Text style={[styles.legalDivider, { color: theme.textTertiary }]}>|</Text>
              <TouchableOpacity onPress={openPoliciesPage('privacy')} activeOpacity={0.7} testID="privacy-policy-link">
                <Text style={[styles.legalLink, { color: theme.accent }]}>Privacy Policy</Text>
              </TouchableOpacity>
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
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 16,
  },
  header: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  title: {
    ...typography.bold,
    fontSize: sizes.xlarge,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.regular,
    fontSize: sizes.body,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
  featuresContainer: {
    gap: 8,
  },
  featuresContainerCompact: {
    gap: 4,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    ...typography.regular,
    fontSize: 14,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  proBadge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  proBadgeText: {
    ...typography.semibold,
    fontSize: 14,
  },
  pricingRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pricingRowCompact: {
    gap: 8,
  },
  pricingCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
    gap: 4,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -9,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: {
    ...typography.semibold,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#FFFFFF',
  },
  planName: {
    ...typography.bold,
    fontSize: sizes.body,
  },
  planPrice: {
    ...typography.semibold,
    fontSize: 20,
  },
  planPeriod: {
    ...typography.regular,
    fontSize: 12,
  },
  missingNotice: {
    ...typography.regular,
    fontSize: 12,
    textAlign: 'center',
  },
  subscribeButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  subscribeButtonText: {
    ...typography.semibold,
    fontSize: sizes.label,
  },
  skipButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  skipButtonText: {
    ...typography.medium,
    fontSize: sizes.body,
  },
  restoreRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  restoreText: {
    ...typography.regular,
    fontSize: 13,
  },
  restoreDivider: {
    ...typography.regular,
    fontSize: 13,
  },
  legalRow: {
    borderTopWidth: 1,
    paddingTop: 10,
    gap: 4,
  },
  legalText: {
    ...typography.regular,
    fontSize: 11,
    textAlign: 'center',
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  legalLink: {
    ...typography.semibold,
    fontSize: 11,
    textDecorationLine: 'underline',
  },
  legalDivider: {
    ...typography.regular,
    fontSize: 11,
  },
});
