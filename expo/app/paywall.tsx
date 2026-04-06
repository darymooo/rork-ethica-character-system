import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useColorScheme, Alert, ActivityIndicator, useWindowDimensions } from 'react-native';
import type { GestureResponderEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import type { PurchasesPackage } from 'react-native-purchases';
import { Check, RefreshCw, Shield, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
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

const TRUST_ITEMS = [
  'Auto-renewing subscription',
  'Prices shown before purchase',
  'Restore purchases anytime',
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

function getBillingText(plan: PlanKey, price: string): string {
  return plan === 'monthly'
    ? `1 month subscription • ${price} billed every month`
    : `1 week subscription • ${price} billed every week`;
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

  const activePriceLabel = selectedPlan === 'monthly' ? `${monthlyPrice}/month` : `${weeklyPrice}/week`;
  const heroSurfaceColor = isDark ? '#242220' : '#F1E8D9';
  const accentMutedColor = isDark ? 'rgba(200, 200, 200, 0.12)' : 'rgba(74, 74, 74, 0.08)';

  const handleClose = () => {
    router.replace('/virtue-selection');
  };

  const handleSelectPlan = (plan: PlanKey) => {
    void Haptics.selectionAsync();
    setSelectedPlan(plan);
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
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalPadding }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.contentShell, { maxWidth: isTabletLayout ? 980 : 560 }]}> 
            <View style={[styles.heroCard, { backgroundColor: heroSurfaceColor, borderColor: theme.border }]}> 
              <View style={styles.heroTopRow}>
                <View style={[styles.iconContainer, { backgroundColor: accentMutedColor }]}> 
                  <Sparkles size={30} color={theme.accent} strokeWidth={1.75} />
                </View>
                <View style={[styles.statusPill, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
                  <Shield size={14} color={theme.accent} strokeWidth={1.8} />
                  <Text style={[styles.statusPillText, { color: theme.textSecondary }]}>Secure subscription</Text>
                </View>
              </View>

              <Text style={[styles.eyebrow, { color: theme.textTertiary }]}>ETHICA PRO</Text>
              <Text style={[styles.title, { color: theme.text }]}>Upgrade to Ethica Pro</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Unlock the full potential of your character development journey</Text>

              <View style={styles.trustRow}>
                {TRUST_ITEMS.map((item) => (
                  <View key={item} style={[styles.trustChip, { backgroundColor: theme.surface, borderColor: theme.borderLight }]}> 
                    <Text style={[styles.trustChipText, { color: theme.textSecondary }]}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={[styles.featurePanel, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Everything included</Text>
                <Text style={[styles.sectionCaption, { color: theme.textTertiary }]}>Keep your current flow, with more depth and flexibility.</Text>
              </View>
              <View style={styles.featuresContainer}>
                {PREMIUM_FEATURES.map((feature) => (
                  <View key={feature} style={styles.featureRow}>
                    <View style={[styles.checkContainer, { backgroundColor: theme.accent + '18' }]}> 
                      <Check size={16} color={theme.accent} strokeWidth={2.5} />
                    </View>
                    <Text style={[styles.featureText, { color: theme.text }]}>{feature}</Text>
                  </View>
                ))}
              </View>
            </View>

            {missingPlans.length > 0 && !isLoadingOfferings ? (
              <View style={[styles.statusCard, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
                <Text style={[styles.statusTitle, { color: theme.text }]}>Subscription setup needs attention</Text>
                <Text style={[styles.statusText, { color: theme.textSecondary }]}>Missing {missingPlans.join(' and ')} package{missingPlans.length > 1 ? 's' : ''} from the current RevenueCat offering.</Text>
              </View>
            ) : null}

            {isPro ? (
              <View style={[styles.statusCard, { backgroundColor: theme.surface, borderColor: theme.accent }]}> 
                <Text style={[styles.statusTitle, { color: theme.text }]}>Ethica Pro is active</Text>
                <Text style={[styles.statusText, { color: theme.textSecondary }]}>Your premium access is already unlocked on this device.</Text>
              </View>
            ) : null}

            {isLoadingOfferings ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.accent} />
                <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading subscription options...</Text>
              </View>
            ) : (
              <View style={[styles.pricingContainer, isTabletLayout && styles.pricingContainerTablet]}>
                {[
                  {
                    key: 'monthly' as const,
                    title: 'Monthly',
                    price: monthlyPrice,
                    selected: selectedPlan === 'monthly',
                    description: getBillingText('monthly', monthlyPrice),
                    billing: 'Auto-renewing monthly billing cycle. Cancel anytime.',
                    highlight: weeklySavings > 0 ? `Save ${weeklySavings}% vs weekly` : 'Best Value',
                  },
                  {
                    key: 'weekly' as const,
                    title: 'Weekly',
                    price: weeklyPrice,
                    selected: selectedPlan === 'weekly',
                    description: getBillingText('weekly', weeklyPrice),
                    billing: 'Auto-renewing weekly billing cycle. Cancel anytime.',
                    highlight: 'Flexible weekly access',
                  },
                ].map((plan) => (
                  <TouchableOpacity
                    key={plan.key}
                    style={[
                      styles.pricingCard,
                      isTabletLayout && styles.pricingCardTablet,
                      {
                        backgroundColor: theme.surface,
                        borderColor: plan.selected ? theme.accent : theme.border,
                        borderWidth: plan.selected ? 2 : 1,
                      },
                    ]}
                    onPress={() => handleSelectPlan(plan.key)}
                    activeOpacity={0.8}
                    testID={`${plan.key}-package`}
                  >
                    <View style={styles.planBadgeRow}>
                      <View style={[styles.badge, { backgroundColor: plan.key === 'monthly' ? theme.accent : accentMutedColor }]}> 
                        <Text style={[styles.badgeText, { color: plan.key === 'monthly' ? '#FFFFFF' : theme.text }]}>{plan.highlight}</Text>
                      </View>
                    </View>

                    <View style={styles.pricingHeader}>
                      <Text style={[styles.planName, { color: theme.text }]}>{plan.title}</Text>
                      <Text style={[styles.planPrice, { color: theme.text }]}>
                        {plan.price}
                        <Text style={[styles.planPeriod, { color: theme.textSecondary }]}>{plan.key === 'monthly' ? '/month' : '/week'}</Text>
                      </Text>
                    </View>

                    <Text style={[styles.planDetail, { color: theme.textSecondary }]}>{plan.description}</Text>
                    <Text style={[styles.planBillingCycle, { color: theme.textTertiary }]}>{plan.billing}</Text>

                    <View style={styles.planMetaRow}>
                      <View style={[styles.planMetaPill, { backgroundColor: theme.backgroundSecondary }]}> 
                        <Text style={[styles.planMetaText, { color: theme.textSecondary }]}>{plan.key === 'monthly' ? 'Duration: 1 month' : 'Duration: 1 week'}</Text>
                      </View>
                      <View style={[styles.planMetaPill, { backgroundColor: theme.backgroundSecondary }]}> 
                        <Text style={[styles.planMetaText, { color: theme.textSecondary }]}>{plan.key === 'monthly' ? 'Billing: Monthly' : 'Billing: Weekly'}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        <View style={[styles.footerOuter, { borderTopColor: theme.border }]}> 
          <View style={[styles.footerInner, { maxWidth: isTabletLayout ? 980 : 560, paddingHorizontal: horizontalPadding }]}> 
            <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
              <Text style={[styles.summaryLabel, { color: theme.textTertiary }]}>Selected plan</Text>
              <Text style={[styles.summaryPrice, { color: theme.text }]}>{activePriceLabel}</Text>
              <Text style={[styles.summaryCaption, { color: theme.textSecondary }]}>Cancel anytime. No free trials.</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.subscribeButton,
                { backgroundColor: selectedRevenueCatPackage && !isPro ? theme.accent : theme.border },
              ]}
              onPress={handlePurchase}
              disabled={isPurchasing || isLoadingOfferings || !selectedRevenueCatPackage || isPro}
              activeOpacity={0.8}
              testID="subscribe-button"
            >
              {isPurchasing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.subscribeButtonText}>{isPro ? 'You already have Pro' : `Subscribe to ${selectedPlan === 'monthly' ? 'Monthly' : 'Weekly'}`}</Text>
              )}
            </TouchableOpacity>

            <View style={styles.secondaryActionsRow}>
              <TouchableOpacity
                style={[styles.secondaryAction, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={handleRestore}
                disabled={isRestoring}
                activeOpacity={0.8}
                testID="restore-button"
              >
                <Text style={[styles.secondaryActionText, { color: theme.textSecondary }]}>{isRestoring ? 'Restoring...' : 'Restore Purchases'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryAction, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={handleRefresh}
                disabled={isRefreshing || isLoadingOfferings}
                activeOpacity={0.8}
                testID="refresh-revenuecat-button"
              >
                {isRefreshing ? (
                  <ActivityIndicator size="small" color={theme.textTertiary} />
                ) : (
                  <View style={styles.refreshContent}>
                    <RefreshCw size={14} color={theme.textTertiary} strokeWidth={2} />
                    <Text style={[styles.secondaryActionText, { color: theme.textSecondary }]}>Refresh RevenueCat</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleClose}
              activeOpacity={0.7}
              testID="skip-button"
            >
              <Text style={[styles.skipButtonText, { color: theme.textSecondary }]}>Skip and continue to app</Text>
            </TouchableOpacity>

            <Text style={[styles.disclaimer, { color: theme.textTertiary }]}>{activePriceLabel}. Cancel anytime.</Text>
            <View style={[styles.legalContainer, { backgroundColor: theme.surface, borderColor: theme.borderLight }]} testID="paywall-legal-footer">
              <Text style={[styles.legalText, { color: theme.textTertiary }]}>By subscribing, you agree to our</Text>
              <View style={styles.legalLinksRow}>
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
    paddingTop: 24,
    paddingBottom: 28,
  },
  contentShell: {
    width: '100%',
    alignSelf: 'center',
    gap: 18,
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 24,
    gap: 16,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusPillText: {
    ...typography.sans.medium,
    fontSize: 12,
  },
  eyebrow: {
    ...typography.sans.medium,
    fontSize: 12,
    letterSpacing: 1.4,
  },
  title: {
    ...typography.serif.semibold,
    fontSize: sizes.xlarge,
    lineHeight: 40,
  },
  subtitle: {
    ...typography.sans.regular,
    fontSize: sizes.body,
    lineHeight: 23,
    maxWidth: 560,
  },
  trustRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  trustChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  trustChipText: {
    ...typography.sans.medium,
    fontSize: 12,
  },
  featurePanel: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 22,
    gap: 18,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionTitle: {
    ...typography.serif.semibold,
    fontSize: sizes.large,
  },
  sectionCaption: {
    ...typography.sans.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  featuresContainer: {
    gap: 14,
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
    borderRadius: 20,
    padding: 18,
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
    borderRadius: 24,
    gap: 10,
  },
  pricingCardTablet: {
    flex: 1,
  },
  planBadgeRow: {
    alignItems: 'flex-start',
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    ...typography.sans.semibold,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  pricingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 12,
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
  },
  planMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  planMetaPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  planMetaText: {
    ...typography.sans.medium,
    fontSize: 12,
  },
  footerOuter: {
    borderTopWidth: 1,
    paddingTop: 16,
    paddingBottom: 12,
  },
  footerInner: {
    width: '100%',
    alignSelf: 'center',
    gap: 12,
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 2,
  },
  summaryLabel: {
    ...typography.sans.medium,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  summaryPrice: {
    ...typography.serif.semibold,
    fontSize: 24,
  },
  summaryCaption: {
    ...typography.sans.regular,
    fontSize: 13,
  },
  subscribeButton: {
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
  },
  subscribeButtonText: {
    ...typography.sans.semibold,
    fontSize: sizes.label,
    color: '#FFFFFF',
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryAction: {
    flex: 1,
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  secondaryActionText: {
    ...typography.sans.medium,
    fontSize: 13,
    textAlign: 'center',
  },
  refreshContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  skipButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  skipButtonText: {
    ...typography.sans.medium,
    fontSize: sizes.body,
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
